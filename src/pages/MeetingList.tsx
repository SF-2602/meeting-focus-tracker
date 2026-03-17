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
    Search,
    Link as LinkIcon,
  } from "lucide-react";
  import {
    getUserMeetings,
    joinMeeting,
    createMeeting,
    getPublicMeetings,
    type UserMeeting,
    type PublicMeeting,
  } from "../services/api";

  const MeetingList = () => {
    const navigate = useNavigate();
    const location = useLocation();

    const userIdFromState = (location.state as { userId?: string })?.userId;
    const urlParams = new URLSearchParams(location.search);
    const userId = userIdFromState || urlParams.get("user_id");

    const [meetings, setMeetings] = useState<UserMeeting[]>([]);
    const [publicMeetings, setPublicMeetings] = useState<PublicMeeting[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [showJoinForm, setShowJoinForm] = useState(false);
    const [newMeetingName, setNewMeetingName] = useState("");
    const [joinMeetingCode, setJoinMeetingCode] = useState("");
    const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
    const [startTime, setStartTime] = useState("09:00");
    const [endTime, setEndTime] = useState("10:00");
    const [searchQuery, setSearchQuery] = useState("");

    useEffect(() => {
      if (!userId) {
        navigate("/", { replace: true });
        return;
      }
      fetchAllData();
    }, [userId, navigate]);

    const fetchAllData = async () => {
      if (!userId) return;
      try {
        setLoading(true);
        // Fetch user's joined meetings
        const userMeetings = await getUserMeetings(userId);
        setMeetings(userMeetings);

        const publicM = await getPublicMeetings(userId);
        setPublicMeetings(publicM);
      } catch (err: any) {
        console.error("Failed to fetch data:", err);
      } finally {
        setLoading(false);
      }
    };

    const handleCreateMeeting = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!newMeetingName.trim() || !userId) return;

      try {
        const startIso = `${date}T${startTime}:00`;
        const endIso = `${date}T${endTime}:00`;

        const result = await createMeeting(
          newMeetingName.trim(),
          startIso,
          endIso,
          userId,
        );
        await joinMeeting(userId, result.meeting_id);

        setNewMeetingName("");
        setShowForm(false);
        fetchAllData();
      } catch (err: any) {
        console.error("Failed to create meeting:", err);
        alert("Failed to create meeting: " + err.message);
      }
    };

    const handleJoinByCode = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!joinMeetingCode.trim() || !userId) return;

      try {
        // Validate it's a UUID format
        const uuidRegex =
          /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (!uuidRegex.test(joinMeetingCode.trim())) {
          alert("Please enter a valid meeting ID (UUID format)");
          return;
        }

        await joinMeeting(userId, joinMeetingCode.trim());
        setJoinMeetingCode("");
        setShowJoinForm(false);
        fetchAllData();
        alert("Successfully joined meeting!");
      } catch (err: any) {
        console.error("Failed to join meeting:", err);
        alert("Failed to join: " + (err.message || "Meeting may not exist"));
      }
    };

    const handleJoinPublicMeeting = async (meeting: PublicMeeting) => {
      if (!userId) return;
      try {
        await joinMeeting(userId, meeting.id);
        fetchAllData();
        alert(`Joined "${meeting.name}"`);
      } catch (err: any) {
        console.error("Failed to join:", err);
        alert("Failed to join meeting");
      }
    };

    const handleLogout = () => {
      navigate("/", { replace: true, state: {} });
    };

    const handleViewDetails = (meeting: UserMeeting | PublicMeeting) => {
      const meetingId = "meeting_id" in meeting ? meeting.meeting_id : meeting.id;
      const meetingName =
        "meeting_name" in meeting ? meeting.meeting_name : meeting.name;
      const startTime = "start_time" in meeting ? meeting.start_time : null;
      const endTime = "end_time" in meeting ? meeting.end_time : null;

      navigate("/dashboard", {
        state: {
          userId,
          meetingId,
          meetingName,
          startTime,
          endTime,
        },
        replace: true,
      });
    };

    const filteredPublicMeetings = publicMeetings.filter(
      (m) =>
        m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.id.toLowerCase().includes(searchQuery.toLowerCase()),
    );

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
          {/* Action Buttons */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight">
                Your Meetings
              </h2>
              <p className="text-sm text-muted-foreground mt-0.5">
                {meetings.length} meeting{meetings.length !== 1 ? "s" : ""} joined
              </p>
            </div>
            <div className="flex gap-2">
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  setShowForm(!showForm);
                  setShowJoinForm(false);
                }}
                className="flex items-center gap-1.5 h-8 px-3 text-xs font-medium bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
              >
                <Plus className="h-3.5 w-3.5" />
                Create new
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  setShowJoinForm(!showJoinForm);
                  setShowForm(false);
                }}
                className="flex items-center gap-1.5 h-8 px-3 text-xs font-medium bg-card ring-1 ring-input hover:ring-muted-foreground/30 rounded-md transition-colors"
              >
                <LinkIcon className="h-3.5 w-3.5" />
                Join existing
              </motion.button>
            </div>
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

          {/* Join Existing Meeting Form */}
          <AnimatePresence>
            {showJoinForm && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="glass-card rounded-xl p-5 mb-6 space-y-4">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                      Join by Meeting ID
                    </label>
                    <form onSubmit={handleJoinByCode} className="flex gap-2">
                      <input
                        type="text"
                        value={joinMeetingCode}
                        onChange={(e) => setJoinMeetingCode(e.target.value)}
                        placeholder="e.g. 6c6a1336-b6bc-4810-ba21-6f59de9938dc"
                        className="flex-1 h-10 px-3 rounded-md ring-1 ring-inset ring-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                      <motion.button
                        type="submit"
                        whileTap={{ scale: 0.95 }}
                        className="h-10 px-4 text-xs font-medium bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
                      >
                        Join
                      </motion.button>
                    </form>
                    <p className="text-xs text-muted-foreground mt-1">
                      Get the Meeting ID from the meeting host or invitation
                    </p>
                  </div>

                  {/* Public Meetings List */}
                  <div className="pt-4 border-t">
                    <div className="flex items-center justify-between mb-3">
                      <label className="text-xs font-medium text-muted-foreground">
                        Or browse available meetings
                      </label>
                      <div className="relative">
                        <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                        <input
                          type="text"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          placeholder="Search meetings..."
                          className="pl-7 pr-3 h-8 text-xs rounded-md ring-1 ring-inset ring-input bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                      </div>
                    </div>

                    {filteredPublicMeetings.length === 0 ? (
                      <p className="text-xs text-muted-foreground py-2">
                        {searchQuery
                          ? "No matching meetings found"
                          : "No public meetings available"}
                      </p>
                    ) : (
                      <div className="space-y-2 max-h-60 overflow-y-auto">
                        {filteredPublicMeetings.map((m) => (
                          <div
                            key={m.id}
                            className="flex items-center justify-between p-3 rounded-lg bg-background/50 hover:bg-background transition-colors"
                          >
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium truncate">
                                  {m.name}
                                </span>
                                {m.is_joined && (
                                  <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-green-500/10 text-green-600">
                                    Joined
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                                <span className="flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  {new Date(m.start_time).toLocaleDateString()}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {new Date(m.start_time).toLocaleTimeString([], {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Users className="h-3 w-3" />
                                  {m.participant_count} participant
                                  {m.participant_count !== 1 ? "s" : ""}
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 ml-3">
                              {m.is_joined ? (
                                <motion.button
                                  whileTap={{ scale: 0.95 }}
                                  onClick={() => handleViewDetails(m)}
                                  className="h-8 px-3 text-xs font-medium bg-primary/10 text-primary rounded-md hover:bg-primary/20"
                                >
                                  View
                                </motion.button>
                              ) : (
                                <motion.button
                                  whileTap={{ scale: 0.95 }}
                                  onClick={() => handleJoinPublicMeeting(m)}
                                  className="h-8 px-3 text-xs font-medium bg-card ring-1 ring-input hover:ring-muted-foreground/30 rounded-md"
                                >
                                  Join
                                </motion.button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* User's Joined Meetings Table */}
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
                          {new Date(m.start_time).toLocaleDateString()}
                          <Clock className="h-3.5 w-3.5 ml-2" />
                          {new Date(m.start_time).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}{" "}
                          –
                          {new Date(m.end_time).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
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
