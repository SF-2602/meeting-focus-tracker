import { motion } from "framer-motion";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./ui/tooltip";
import { getAppIconUrl } from "../utils/getAppIcon";

interface ActivitySegment {
  startMin: number;
  endMin: number;
  app: string;
  category: string;
  iconUrl: string | null;
}

interface Participant {
  name: string;
  avatar: string;
  improved: boolean;
  segments: ActivitySegment[];
}

interface FocusTimelineProps {
  intervalData: Array<{
    time: string;
    category: string;
    app: string;
    title: string;
    engaged_pct: number;
  }>;
  meetingStartTime?: string;
}

const MEETING_DURATION = 60;

const getCategoryColor = (category: string) => {
  switch (category) {
    case "meeting":
      return "bg-focus-green";
    case "work_related":
      return "bg-focus-blue";
    case "distraction":
      return "bg-focus-red";
    case "other":
      return "bg-muted";
    default:
      return "bg-muted-foreground";
  }
};

const getCategoryFallbackIcon = (category: string) => {
  switch (category) {
    case "meeting":
      return "📹";
    case "work_related":
      return "💻";
    case "distraction":
      return "📱";
    case "other":
      return "📄";
    default:
      return "❓";
  }
};

const convertIntervalDataToSegments = (
  intervalData: FocusTimelineProps["intervalData"],
  meetingStartTime?: string,
): ActivitySegment[] => {
  if (!intervalData.length) return [];

  let baseHour = 13;
  let baseMinute = 0;

  if (meetingStartTime) {
    const startTime = new Date(meetingStartTime);
    baseHour = startTime.getHours();
    baseMinute = startTime.getMinutes();
  } else if (intervalData[0].time.includes(":")) {
    const [hourStr, minuteStr] = intervalData[0].time.split(":");
    baseHour = parseInt(hourStr);
    baseMinute = parseInt(minuteStr);
  }

  return intervalData.map((item) => {
    const [hourStr, minuteStr] = item.time.split(":");
    const itemHour = parseInt(hourStr);
    const itemMinute = parseInt(minuteStr);

    const startMin = (itemHour - baseHour) * 60 + (itemMinute - baseMinute);
    const endMin = startMin + 5;

    const iconUrl = getAppIconUrl(item.app);

    return {
      startMin,
      endMin,
      app: item.app,
      category: item.category,
      iconUrl,
    };
  });
};

const isMeetingApp = (seg: ActivitySegment) => seg.category === "meeting";

const SegmentBar = ({
  seg,
  pIdx,
  sIdx,
  participantName,
}: {
  seg: ActivitySegment;
  pIdx: number;
  sIdx: number;
  participantName: string;
}) => {
  const left = (seg.startMin / MEETING_DURATION) * 100;
  const width = ((seg.endMin - seg.startMin) / MEETING_DURATION) * 100;
  const duration = seg.endMin - seg.startMin;

  const startH = Math.floor(seg.startMin / 60) + 13;
  const startM = seg.startMin % 60;
  const endH = Math.floor(seg.endMin / 60) + 13;
  const endM = seg.endMin % 60;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{
            delay: 0.5 + pIdx * 0.1 + sIdx * 0.05,
            duration: 0.4,
            ease: "easeOut",
          }}
          className={`absolute top-0.5 bottom-0.5 rounded-md ${getCategoryColor(seg.category)} opacity-85 hover:opacity-100 transition-opacity cursor-default flex items-center justify-center origin-left`}
          style={{ left: `${left}%`, width: `${width}%` }}
        >
          <span className="text-[11px] font-medium text-white truncate px-2 flex items-center gap-1">
            {seg.iconUrl ? (
              <img
                src={seg.iconUrl}
                alt={seg.app}
                className="w-3 h-3"
                style={{
                  filter: "brightness(0) invert(1)",
                  viewTransitionName: "icon",
                }}
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                }}
              />
            ) : (
              <span>{getCategoryFallbackIcon(seg.category)}</span>
            )}
            {width > 12 && <span>{seg.app}</span>}
          </span>
        </motion.div>
      </TooltipTrigger>
      <TooltipContent className="text-xs">
        <p className="font-medium">
          {participantName} was on {seg.app}
        </p>
        <p className="text-muted-foreground">
          {duration} mins ({startH}:{startM.toString().padStart(2, "0")} –{" "}
          {endH}:{endM.toString().padStart(2, "0")})
        </p>
      </TooltipContent>
    </Tooltip>
  );
};

const generateTimeLabels = (
  intervalData: FocusTimelineProps["intervalData"],
) => {
  if (!intervalData.length) {
    return Array.from({ length: 13 }, (_, i) => {
      const min = i * 5;
      const h = 13 + Math.floor(min / 60);
      const m = min % 60;
      return `${h}:${m.toString().padStart(2, "0")}`;
    });
  }

  return intervalData.map((item) => item.time);
};

const FocusTimeline = ({
  intervalData,
  meetingStartTime,
}: FocusTimelineProps) => {
  const currentUserSegments = convertIntervalDataToSegments(
    intervalData,
    meetingStartTime,
  );

  const mockParticipants: Participant[] = [
    {
      name: "You",
      avatar: "Y",
      improved: false,
      segments: currentUserSegments,
    },
  ];

  const timeLabels = generateTimeLabels(intervalData);

  return (
    <TooltipProvider>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="glass-card rounded-2xl p-6 mb-6"
      >
        <h2 className="text-lg font-semibold mb-4">Focus Timeline</h2>

        {/* Column headers */}
        <div className="flex mb-1">
          <div className="w-32 shrink-0" />
          <div className="w-16 shrink-0" />
          <div className="flex-1 relative h-5">
            {timeLabels.map((label, i) => (
              <span
                key={label}
                className="absolute text-[10px] text-muted-foreground -translate-x-1/2"
                style={{ left: `${i * (100 / timeLabels.length)}%` }}
              >
                {label}
              </span>
            ))}
          </div>
        </div>

        {/* Rest of your component remains the same... */}

        {/* Participant rows */}
        <div className="space-y-3">
          {mockParticipants.map((p, pIdx) => {
            const meetingSegs = p.segments.filter(isMeetingApp);
            const otherSegs = p.segments.filter((s) => !isMeetingApp(s));

            return (
              <motion.div
                key={p.name}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + pIdx * 0.1 }}
                className="flex items-center"
              >
                {/* Name + avatar */}
                <div className="w-32 shrink-0 flex items-center gap-2">
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium text-primary">
                    {p.avatar}
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-sm font-medium">{p.name}</span>
                    {p.improved && (
                      <span
                        className="text-xs"
                        title="Improved since last meeting"
                      >
                        🏆
                      </span>
                    )}
                  </div>
                </div>

                {/* Two-lane timeline */}
                <div className="flex-1 flex flex-col gap-0.5">
                  {/* Lane 1: Meeting */}
                  <div className="flex items-center">
                    <div className="w-16 shrink-0 text-[10px] text-muted-foreground text-right pr-2">
                      Meeting
                    </div>
                    <div className="flex-1 relative h-7 bg-focus-green/10 rounded-md overflow-hidden">
                      {meetingSegs.map((seg, sIdx) => (
                        <SegmentBar
                          key={`${pIdx}-meeting-${sIdx}`}
                          seg={seg}
                          pIdx={pIdx}
                          sIdx={sIdx}
                          participantName={p.name}
                        />
                      ))}
                    </div>
                  </div>
                  {/* Lane 2: Other */}
                  <div className="flex items-center">
                    <div className="w-16 shrink-0 text-[10px] text-muted-foreground text-right pr-2">
                      Other
                    </div>
                    <div className="flex-1 relative h-7 bg-muted/50 rounded-md overflow-hidden">
                      {otherSegs.map((seg, sIdx) => (
                        <SegmentBar
                          key={`${pIdx}-other-${sIdx}`}
                          seg={seg}
                          pIdx={pIdx}
                          sIdx={sIdx + meetingSegs.length}
                          participantName={p.name}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-4 mt-5 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm bg-focus-green" /> Meeting
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm bg-focus-red" /> Distraction
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm bg-focus-blue" /> Work
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm bg-muted" /> Other
          </span>
        </div>
      </motion.div>
    </TooltipProvider>
  );
};

export default FocusTimeline;
