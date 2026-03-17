import { motion } from "framer-motion";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./ui/tooltip";
import { getAppIconUrl } from "../utils/getAppIcon";
import { getDisplayAppName } from "../utils/getDisplayAppName";

interface ActivitySegment {
  startMin: number;
  endMin: number;
  app: string;
  category: string;
  iconUrl: string | null;
  baseHour: number;
  baseMinute: number;
  isFuture?: boolean;
}

interface Participant {
  user_id: string;
  name: string;
  avatar: string;
  improved?: boolean;
  engagement_percentage: number;
  segments: ActivitySegment[];
}

interface FocusTimelineProps {
  userIntervalData?: Record<
    string,
    Array<{
      time: string;
      category: string;
      app: string;
      title: string;
      engaged_pct: number;
    }>
  >;
  intervalData: Array<{
    time: string;
    category: string;
    app: string;
    title: string;
    engaged_pct: number;
  }>;
  userStats?: Array<{
    user_id: string;
    engagement_percentage: number;
    total_duration_sec: number;
    category_durations: Record<string, number>;
  }>;
  meetingStartTime?: string;
  cutoffTimeIso?: string;
  meetingDate?: string;
}

const MEETING_DURATION = 60;

const getCategoryColor = (category: string) => {
  switch (category) {
    case "meeting":
      return "bg-focus-blue";
    case "work_related":
      return "bg-focus-purple";
    case "instant_message":
      return "bg-focus-red";
    case "browser":
      return "bg-focus-amber";
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
    case "instant_message":
      return "📱";
    case "browser":
      return "🔎";
    case "other":
      return "📄";
    default:
      return "❓";
  }
};

const mergeAdjacentSegments = (
  segments: ActivitySegment[],
): ActivitySegment[] => {
  if (segments.length === 0) return [];

  const merged: ActivitySegment[] = [];
  let current = { ...segments[0] };

  for (let i = 1; i < segments.length; i++) {
    const next = segments[i];

    if (
      current.app === next.app &&
      current.category === next.category &&
      current.endMin === next.startMin &&
      current.isFuture === next.isFuture
    ) {
      current.endMin = next.endMin;
    } else {
      merged.push(current);
      current = { ...next };
    }
  }

  merged.push(current);
  return merged;
};

const convertIntervalDataToSegments = (
  intervalData: FocusTimelineProps["intervalData"],
  meetingStartTime?: string,
  meetingDate?: string,
  cutoffTimeIso?: string,
): ActivitySegment[] => {
  if (!intervalData.length) return [];

  let baseHour: number;
  let baseMinute: number;

  if (meetingStartTime) {
    const startTime = new Date(meetingStartTime);
    baseHour = startTime.getHours();
    baseMinute = startTime.getMinutes();
  } else if (intervalData[0]?.time?.includes(":")) {
    const [hourStr, minuteStr] = intervalData[0].time.split(":");
    baseHour = parseInt(hourStr, 10);
    baseMinute = parseInt(minuteStr, 10);
  } else {
    baseHour = 0;
    baseMinute = 0;
  }

  const cutoffMs =
    cutoffTimeIso && meetingDate
      ? new Date(cutoffTimeIso).getTime()
      : undefined;

  return intervalData.map((item) => {
    const [hourStr, minuteStr] = item.time.split(":");
    const itemHour = parseInt(hourStr);
    const itemMinute = parseInt(minuteStr);

    const startMin = (itemHour - baseHour) * 60 + (itemMinute - baseMinute);
    const endMin = startMin + 5;

    let isFuture = false;
    if (cutoffMs != null && meetingDate) {
      const binEnd = new Date(`${meetingDate}T${item.time}`);
      binEnd.setMinutes(binEnd.getMinutes() + 5);
      if (binEnd.getTime() > cutoffMs) isFuture = true;
    }

    const displayName = getDisplayAppName(item.app, item.title, item.category);
    const iconUrl = getAppIconUrl(item.app);

    return {
      startMin,
      endMin,
      app: displayName,
      category: item.category,
      iconUrl,
      baseHour,
      baseMinute,
      isFuture,
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

  const startTotalMinutes = seg.baseHour * 60 + seg.baseMinute + seg.startMin;
  const endTotalMinutes = seg.baseHour * 60 + seg.baseMinute + seg.endMin;

  const startH = Math.floor(startTotalMinutes / 60) % 24;
  const startM = startTotalMinutes % 60;
  const endH = Math.floor(endTotalMinutes / 60) % 24;
  const endM = endTotalMinutes % 60;

  if (seg.isFuture) {
    return (
      <div
        className="absolute top-0.5 bottom-0.5 rounded-md cursor-default origin-left"
        style={{ left: `${left}%`, width: `${width}%` }}
        title="Not yet"
      />
    );
  }

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
                className="w-4 h-4"
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
  userIntervalData,
  intervalData,
  userStats,
  meetingStartTime,
  cutoffTimeIso,
  meetingDate,
}: FocusTimelineProps) => {
  const participants: Participant[] = [];

  if (userIntervalData && userStats) {
    // ✅ Preferred: per-user interval data from backend
    Object.entries(userIntervalData).forEach(([userId, userData]) => {
      const stats = userStats.find((s) => s.user_id === userId);
      const segments = convertIntervalDataToSegments(
        userData,
        meetingStartTime,
        meetingDate,
        cutoffTimeIso,
      );
      participants.push({
        user_id: userId,
        name: `User ${userId.slice(0, 6)}…`,
        avatar: userId.slice(0, 2).toUpperCase(),
        engagement_percentage: stats?.engagement_percentage || 0,
        segments: mergeAdjacentSegments(segments),
      });
    });
  } else if (intervalData && userStats) {
    const baseSegments = convertIntervalDataToSegments(
      intervalData,
      meetingStartTime,
      meetingDate,
      cutoffTimeIso,
    );
    userStats.forEach((stats) => {
      participants.push({
        user_id: stats.user_id,
        name: `User ${stats.user_id.slice(0, 6)}…`,
        avatar: stats.user_id.slice(0, 2).toUpperCase(),
        engagement_percentage: stats.engagement_percentage,
        segments: mergeAdjacentSegments(baseSegments),
      });
    });
  }

  const lastHourData =
    intervalData.length > 12
      ? intervalData.slice(intervalData.length - 12)
      : intervalData;

  const cutoffMs =
    cutoffTimeIso && meetingDate
      ? new Date(cutoffTimeIso).getTime()
      : undefined;

  const displayedData =
    cutoffMs != null && meetingDate
      ? lastHourData.filter((item) => {
          const binEnd = new Date(`${meetingDate}T${item.time}`);
          binEnd.setMinutes(binEnd.getMinutes() + 5);
          return binEnd.getTime() <= cutoffMs;
        })
      : lastHourData;

  const currentUserSegments = convertIntervalDataToSegments(
    displayedData,
    meetingStartTime,
    meetingDate,
    cutoffTimeIso,
  );

  if (participants.length === 0) {
    return (
      <div className="glass-card rounded-2xl p-6 text-center text-muted-foreground">
        No participant timeline data available.
      </div>
    );
  }

  const firstSegments = participants[0]?.segments || [];
  const timeLabels =
    firstSegments.length > 0
      ? Array.from({ length: 13 }, (_, i) => {
          const totalMin =
            firstSegments[0].baseHour * 60 +
            firstSegments[0].baseMinute +
            i * 5;
          const h = Math.floor(totalMin / 60) % 24;
          const m = totalMin % 60;
          return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
        })
      : [];

  return (
    <TooltipProvider>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card rounded-2xl p-6 mb-6 overflow-x-auto"
      >
        <h2 className="text-lg font-semibold mb-4">Team Focus Timeline</h2>

        {/* Time labels header */}
        <div className="flex mb-2 pl-62">
          {" "}
          {/* offset for avatar+name column */}
          <div className="flex-1 relative h-4">
            {timeLabels.map((label, i) => (
              <span
                key={i}
                className="absolute text-[9px] text-muted-foreground -translate-x-1/2"
                style={{ left: `${i * (100 / timeLabels.length)}%` }}
              >
                {label}
              </span>
            ))}
          </div>
        </div>

        {/* Participant rows */}
        <div className="space-y-2.5">
          {participants.map((p, pIdx) => {
            const meetingSegs = p.segments.filter(
              (s) => s.category === "meeting",
            );
            const otherSegs = p.segments.filter(
              (s) => s.category !== "meeting",
            );

            return (
              <motion.div
                key={p.user_id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 * pIdx }}
                className="flex items-start group"
              >
                {/* Avatar + Name + Engagement */}
                <div className="w-44 shrink-0 pr-3">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="h-7 w-7 rounded-full bg-primary/15 flex items-center justify-center text-xs font-semibold text-primary">
                      {p.avatar}
                    </div>
                    <span className="text-sm font-medium truncate">
                      {p.name}
                    </span>
                  </div>
                  <div className="pl-9">
                    <span
                      className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium ${
                        p.engagement_percentage >= 70
                          ? "bg-green-500/15 text-green-700"
                          : p.engagement_percentage >= 40
                            ? "bg-yellow-500/15 text-yellow-700"
                            : "bg-red-500/15 text-red-700"
                      }`}
                    >
                      {p.engagement_percentage}% engaged
                    </span>
                  </div>
                </div>

                {/* Timeline lanes */}
                <div className="flex-1 flex flex-col gap-0.5">
                  {/* Meeting lane */}
                  <div className="flex items-center">
                    <div className="w-14 shrink-0 text-[9px] text-muted-foreground text-right pr-2">
                      Meeting
                    </div>
                    <div className="flex-1 relative h-6 bg-focus-blue/10 rounded overflow-hidden">
                      {meetingSegs.map((seg, sIdx) => (
                        <SegmentBar
                          key={`mtg-${p.user_id}-${sIdx}`}
                          seg={seg}
                          pIdx={pIdx}
                          sIdx={sIdx}
                          participantName={p.name}
                        />
                      ))}
                    </div>
                  </div>
                  {/* Other apps lane */}
                  <div className="flex items-center">
                    <div className="w-14 shrink-0 text-[9px] text-muted-foreground text-right pr-2">
                      Other
                    </div>
                    <div className="flex-1 relative h-6 bg-focus-blue/10 rounded overflow-hidden">
                      {otherSegs.map((seg, sIdx) => (
                        <SegmentBar
                          key={`other-${p.user_id}-${sIdx}`}
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
        <div className="flex flex-wrap gap-3 mt-5 text-[10px] text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-sm bg-focus-blue" /> Meeting
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-sm bg-focus-purple" /> Work
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-sm bg-focus-amber" /> Browser
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-sm bg-focus-red" /> Chat
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-sm bg-muted" /> Other
          </span>
        </div>
      </motion.div>
    </TooltipProvider>
  );
};

export default FocusTimeline;
