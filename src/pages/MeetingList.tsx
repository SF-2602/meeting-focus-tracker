import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, ChevronRight, LogOut, Calendar, Clock } from "lucide-react";

interface StoredMeeting {
  id: string;
  meetingId: string;
  date: string;
  startTime: string;
  endTime: string;
  createdAt: string;
}

const getMeetings = (userId: string): StoredMeeting[] => {
  const raw = localStorage.getItem(`meetings_${userId}`);
  return raw ? JSON.parse(raw) : [];
};

const saveMeetings = (userId: string, meetings: StoredMeeting[]) => {
  localStorage.setItem(`meetings_${userId}`, JSON.stringify(meetings));
};

const MeetingList = () => {
  const navigate = useNavigate();
  const userId = localStorage.getItem("focus_user_id");
  const [meetings, setMeetings] = useState<StoredMeeting[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [meetingId, setMeetingId] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("10:00");

  useEffect(() => {
    if (!userId) {
      navigate("/");
      return;
    }
    setMeetings(getMeetings(userId));
  }, [userId, navigate]);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!meetingId.trim() || !userId) return;
    const newMeeting: StoredMeeting = {
      id: crypto.randomUUID(),
      meetingId: meetingId.trim(),
      date,
      startTime,
      endTime,
      createdAt: new Date().toISOString(),
    };
    const updated = [newMeeting, ...meetings];
    setMeetings(updated);
    saveMeetings(userId, updated);
    setMeetingId("");
    setShowForm(false);
  };

  const handleLogout = () => {
    localStorage.removeItem("focus_user_id");
    navigate("/");
  };

  const handleViewDetails = (m: StoredMeeting) => {
    navigate(
      `/dashboard?meeting_id=${encodeURIComponent(m.meetingId)}&date=${m.date}&start=${m.startTime}&end=${m.endTime}`
    );
  };

  return (
    <div className="min-h-screen bg-surface">
      {/* Header */}
      <header className="h-16 sticky top-0 z-10 bg-card/80 backdrop-blur-md ring-1 ring-border">
        <div className="max-w-5xl mx-auto h-full px-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-sm font-semibold tracking-tight">
              Meeting Focus
            </h1>
            <span className="text-xs text-muted-foreground">
              / {userId?.slice(0, 8)}…
            </span>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <LogOut className="h-3.5 w-3.5" />
            Sign out
          </button>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">Meetings</h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              {meetings.length} meeting{meetings.length !== 1 ? "s" : ""} tracked
            </p>
          </div>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-1.5 h-8 px-3 text-xs font-medium bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
          >
            <Plus className="h-3.5 w-3.5" />
            Add meeting
          </motion.button>
        </div>

        {/* Add meeting form */}
        <AnimatePresence>
          {showForm && (
            <motion.form
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              onSubmit={handleAdd}
              className="overflow-hidden"
            >
              <div className="glass-card rounded-xl p-5 mb-6 space-y-4">
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                    Meeting ID
                  </label>
                  <input
                    type="text"
                    value={meetingId}
                    onChange={(e) => setMeetingId(e.target.value)}
                    placeholder="Enter meeting identifier"
                    className="h-10 w-full px-3 rounded-md ring-1 ring-inset ring-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary transition-shadow"
                    required
                  />
                </div>
                <div className="flex flex-wrap gap-3">
                  <label className="flex flex-col gap-1">
                    <span className="text-xs text-muted-foreground">Date</span>
                    <input
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="h-10 px-3 rounded-md ring-1 ring-inset ring-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </label>
                  <label className="flex flex-col gap-1">
                    <span className="text-xs text-muted-foreground">Start</span>
                    <input
                      type="time"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      className="h-10 px-3 rounded-md ring-1 ring-inset ring-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </label>
                  <label className="flex flex-col gap-1">
                    <span className="text-xs text-muted-foreground">End</span>
                    <input
                      type="time"
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      className="h-10 px-3 rounded-md ring-1 ring-inset ring-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </label>
                </div>
                <div className="flex gap-2">
                  <motion.button
                    type="submit"
                    whileTap={{ scale: 0.95 }}
                    className="h-8 px-4 text-xs font-medium bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
                  >
                    Save
                  </motion.button>
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="h-8 px-4 text-xs font-medium text-muted-foreground hover:text-foreground"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </motion.form>
          )}
        </AnimatePresence>

        {/* Meeting table */}
        {meetings.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground text-sm">
            No meetings yet. Add one to get started.
          </div>
        ) : (
          <div className="glass-card rounded-xl overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="bg-surface/50">
                  <th className="text-left text-[11px] uppercase tracking-wider font-semibold text-muted-foreground px-4 py-2.5">
                    Meeting ID
                  </th>
                  <th className="text-left text-[11px] uppercase tracking-wider font-semibold text-muted-foreground px-4 py-2.5">
                    Date
                  </th>
                  <th className="text-left text-[11px] uppercase tracking-wider font-semibold text-muted-foreground px-4 py-2.5">
                    Time
                  </th>
                  <th className="text-right text-[11px] uppercase tracking-wider font-semibold text-muted-foreground px-4 py-2.5">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {meetings.map((m, idx) => (
                  <motion.tr
                    key={m.id}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.03 }}
                    className="border-b border-border last:border-0 hover:bg-surface/80 transition-colors duration-150"
                  >
                    <td className="px-4 py-3 text-sm font-medium tabular-nums">
                      {m.meetingId.length > 20
                        ? `${m.meetingId.slice(0, 20)}…`
                        : m.meetingId}
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5" />
                        {m.date}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground tabular-nums">
                      <span className="flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5" />
                        {m.startTime} – {m.endTime}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <motion.button
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleViewDetails(m)}
                        className="inline-flex items-center gap-1 h-8 px-3 text-xs font-medium bg-card ring-1 ring-input hover:ring-muted-foreground/30 rounded-md shadow-sm transition-all"
                      >
                        View details
                        <ChevronRight className="h-3 w-3" />
                      </motion.button>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default MeetingList;
