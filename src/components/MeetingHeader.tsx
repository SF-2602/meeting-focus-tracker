import { motion } from "framer-motion";
import { Target, Users, Clock } from "lucide-react";

interface MeetingHeaderProps {
  duration?: number;
  participants?: number;
}

const MeetingHeader = ({
  duration = 60,
  participants = 4,
}: MeetingHeaderProps) => {
  const startTime = new Date();
  startTime.setHours(startTime.getHours() - Math.floor(duration / 60));
  const endTime = new Date();

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("en-US", {
      hour12: false,
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="mb-8"
    >
      <div className="flex items-center gap-3 mb-3">
        <div className="relative">
          <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Target className="h-5 w-5 text-primary" />
          </div>
          <motion.div
            className="absolute -top-0.5 -right-0.5 h-3 w-3 rounded-full bg-primary/60"
            animate={{ scale: [1, 1.3, 1], opacity: [0.6, 1, 0.6] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Meeting Focus Tracker
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Detection for Meeting Focus
          </p>
        </div>
      </div>

      <div className="flex items-center gap-6 text-sm text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <Clock className="h-3.5 w-3.5" />
          {formatTime(startTime)} – {formatTime(endTime)}
        </span>
        <span className="flex items-center gap-1.5">
          <Users className="h-3.5 w-3.5" /> {participants} participants
        </span>
      </div>
    </motion.header>
  );
};

export default MeetingHeader;
