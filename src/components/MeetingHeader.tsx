import { motion } from "framer-motion";
import { Target, Users, Clock } from "lucide-react";

const MeetingHeader = () => {
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
          <h1 className="text-3xl font-bold tracking-tight">Meeting Focus Tracker</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Gentle insights, not judgments 💛
          </p>
        </div>
      </div>

      <div className="flex items-center gap-6 text-sm text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <Clock className="h-3.5 w-3.5" />
          13:00 – 14:00
        </span>
        <span className="flex items-center gap-1.5">
          <Users className="h-3.5 w-3.5" />
          4 participants
        </span>
      </div>
    </motion.header>
  );
};

export default MeetingHeader;
