import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  ChevronRight,
  LogOut,
  Calendar,
  Clock,
  Users,
} from "lucide-react";
import { getUserMeetings, joinMeeting, createMeeting } from "../services/api";

interface UserMeeting {
  meeting_id: string;
  meeting_name: string;
  start_time: string;
  end_time: string;
  role: string;
  joined_at: string;
}

const MeetingList = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const userIdFromState = (location.state as { userId?: string })?.userId;
  const urlParams = new URLSearchParams(location.search);
  const userId = userIdFromState || urlParams.get("user_id");

  const [meetings, setMeetings] = useState<UserMeeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [newMeetingName, setNewMeetingName] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("10:00");

  useEffect(() => {
    if (!userId) {
      navigate("/", { replace: true });
      return;
    }
    fetchMeetings();
  }, [userId, navigate]);

  const fetchMeetings = async () => {
    if (!userId) return;
    try {
      setLoading(true);
      console.log("🔍 Fetching meetings for user:", userId);
      const data = await getUserMeetings(userId);
      console.log("📦 Received meetings:", data);
      setMeetings(data);
    } catch (err: any) {
      console.error("❌ Failed to fetch meetings:", err);
      alert("Failed to load meetings: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateMeeting = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMeetingName.trim() || !userId) return;

    try {
      const startLocal = `${date}T${startTime}:00`;
      const endLocal = `${date}T${endTime}:00`;

      console.log("📝 Creating meeting:", {
        newMeetingName,
        startLocal,
        endLocal,
        userId,
      });

      const result = await createMeeting(
        newMeetingName.trim(),
        startLocal,
        endLocal,
        userId,
      );

      const joinResult = await joinMeeting(userId, result.meeting_id);

      setNewMeetingName("");
      setShowForm(false);
      fetchMeetings();
    } catch (err: any) {
      console.error("Create meeting error:", err);
      alert("Failed to create meeting: " + err.message);
    }
  };

  const handleJoinMeeting = async (meetingId: string) => {
    if (!userId) return;
    try {
      await joinMeeting(userId, meetingId);
      fetchMeetings();
    } catch (err: any) {
      console.error("Failed to join:", err);
    }
  };

  const handleLogout = () => {
    navigate("/", { replace: true, state: {} });
  };

  const handleViewDetails = (meeting: UserMeeting) => {
    navigate("/dashboard", {
      state: {
        userId,
        meetingId: meeting.meeting_id,
        meetingName: meeting.meeting_name,
        startTime: meeting.start_time,
        endTime: meeting.end_time,
      },
      replace: true,
    });
  };

  if (!userId) return null;
  if (loading) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

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
              / {userId.slice(0, 8)}…
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
            <h2 className="text-2xl font-semibold tracking-tight">
              Your Meetings
            </h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              {meetings.length} meeting{meetings.length !== 1 ? "s" : ""} joined
            </p>
          </div>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-1.5 h-8 px-3 text-xs font-medium bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
          >
            <Plus className="h-3.5 w-3.5" />
            Create meeting
          </motion.button>
        </div>

        {/* Create Meeting Form */}
        <AnimatePresence>
          {showForm && (
            <motion.form
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              onSubmit={handleCreateMeeting}
              className="overflow-hidden"
            >
              <div className="glass-card rounded-xl p-5 mb-6 space-y-4">
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                    Meeting Name
                  </label>
                  <input
                    type="text"
                    value={newMeetingName}
                    onChange={(e) => setNewMeetingName(e.target.value)}
                    placeholder="e.g. Daily Standup"
                    className="h-10 w-full px-3 rounded-md ring-1 ring-inset ring-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
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
                      className="h-10 px-3 rounded-md ring-1 ring-inset ring-input bg-background text-sm"
                    />
                  </label>
                  <label className="flex flex-col gap-1">
                    <span className="text-xs text-muted-foreground">Start</span>
                    <input
                      type="time"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      className="h-10 px-3 rounded-md ring-1 ring-inset ring-input bg-background text-sm"
                    />
                  </label>
                  <label className="flex flex-col gap-1">
                    <span className="text-xs text-muted-foreground">End</span>
                    <input
                      type="time"
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      className="h-10 px-3 rounded-md ring-1 ring-inset ring-input bg-background text-sm"
                    />
                  </label>
                </div>
                <div className="flex gap-2">
                  <motion.button
                    type="submit"
                    whileTap={{ scale: 0.95 }}
                    className="h-8 px-4 text-xs font-medium bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
                  >
                    Create
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

        {/* Meetings List */}
        {meetings.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground text-sm">
            <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No meetings yet.</p>
            <p className="mt-1">Create one or join with a meeting code.</p>
          </div>
        ) : (
          <div className="glass-card rounded-xl overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="bg-surface/50">
                  <th className="text-left text-[11px] uppercase tracking-wider font-semibold text-muted-foreground px-4 py-2.5">
                    Meeting
                  </th>
                  <th className="text-left text-[11px] uppercase tracking-wider font-semibold text-muted-foreground px-4 py-2.5">
                    Date & Time
                  </th>
                  <th className="text-left text-[11px] uppercase tracking-wider font-semibold text-muted-foreground px-4 py-2.5">
                    Role
                  </th>
                  <th className="text-right text-[11px] uppercase tracking-wider font-semibold text-muted-foreground px-4 py-2.5">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {meetings.map((m, idx) => (
                  <motion.tr
                    key={m.meeting_id}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.03 }}
                    className="border-b border-border last:border-0 hover:bg-surface/80 transition-colors"
                  >
                    <td className="px-4 py-3 text-sm font-medium">
                      {m.meeting_name}
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5" />
                        {new Date(m.start_time).toLocaleDateString(undefined, {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                        <Clock className="h-3.5 w-3.5 ml-2" />
                        {new Date(m.start_time).toLocaleTimeString(undefined, {
                          hour: "2-digit",
                          minute: "2-digit",
                          hour12: false, // Use 24-hour format
                        })}{" "}
                        –
                        {new Date(m.end_time).toLocaleTimeString(undefined, {
                          hour: "2-digit",
                          minute: "2-digit",
                          hour12: false,
                        })}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs ${
                          m.role === "host"
                            ? "bg-primary/10 text-primary"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {m.role}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <motion.button
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleViewDetails(m)}
                        className="inline-flex items-center gap-1 h-8 px-3 text-xs font-medium bg-card ring-1 ring-input hover:ring-muted-foreground/30 rounded-md shadow-sm"
                      >
                        View analytics
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
