import { motion } from "framer-motion";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./ui/tooltip";
import {
  participants,
  getCategoryColor,
  MEETING_DURATION,
  type ActivitySegment,
} from "../data/meetingData";

const timeLabels = Array.from({ length: 13 }, (_, i) => {
  const min = i * 5;
  const h = 13 + Math.floor(min / 60);
  const m = min % 60;
  return `${h}:${m.toString().padStart(2, "0")}`;
});

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
  const startH = 13 + Math.floor(seg.startMin / 60);
  const startM = seg.startMin % 60;
  const endH = 13 + Math.floor(seg.endMin / 60);
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
            <span>{seg.emoji}</span>
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

const FocusTimeline = () => {
  return (
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
              style={{ left: `${((i * 5) / MEETING_DURATION) * 100}%` }}
            >
              {label}
            </span>
          ))}
        </div>
      </div>

      {/* Participant rows */}
      <div className="space-y-3">
        {participants.map((p, pIdx) => {
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
                      🌱
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
                        key={sIdx}
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
                        key={sIdx}
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
          <span className="h-2.5 w-2.5 rounded-sm bg-focus-green" /> Meeting App
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm bg-focus-red" /> Media /
          Social
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm bg-focus-purple" /> Dev Tools
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm bg-focus-blue" /> Office Apps
        </span>
      </div>
    </motion.div>
  );
};

export default FocusTimeline;
