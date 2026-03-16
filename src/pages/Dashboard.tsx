import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import MeetingHeader from "../components/MeetingHeader";
import FocusTimeline from "../components/FocusTimeLine";
import StatisticsPanel from "../components/StatisticsPanel";
import { analyzeMeeting, type MeetingAnalytics } from "../services/api";

interface DashboardState {
  userId: string;
  meetingId: string;
  meetingName: string;
  startTime: string;
  endTime: string;
}

const Dashboard = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  const state = location.state as Partial<DashboardState> | null;
  
  const [meetingId, setMeetingId] = useState<string>(state?.meetingId || "");
  const [meetingName, setMeetingName] = useState<string>(state?.meetingName || "Meeting");
  const [startTime, setStartTime] = useState<string>(state?.startTime || "");
  const [endTime, setEndTime] = useState<string>(state?.endTime || "");
  
  const [analytics, setAnalytics] = useState<MeetingAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!meetingId) {
      navigate("/meetings", { replace: true });
      return;
    }
    fetchAnalytics();
  }, [meetingId]);

  const fetchAnalytics = async () => {
    if (!meetingId) return;
    
    try {
      setLoading(true);
      setError(null);

      const data = await analyzeMeeting({
        meeting_id: meetingId,
        start_time: startTime || undefined,
        end_time: endTime || undefined,
      });
      setAnalytics(data);
    } catch (err: any) {
      setError(err.message || "Failed to load analytics");
      console.error("Fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  // Loading / Error states
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Analyzing meeting activity...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center max-w-md p-6">
          <div className="text-destructive text-2xl mb-4">⚠️</div>
          <p className="text-muted-foreground mb-4">Error: {error}</p>
          <button
            onClick={() => navigate("/meetings")}
            className="text-sm text-primary hover:underline"
          >
            ← Back to Meetings
          </button>
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">No analytics available</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-6 py-10">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-semibold tracking-tight">{meetingName}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {new Date(startTime).toLocaleString()} – {new Date(endTime).toLocaleString()}
          </p>
        </div>

        {/* Aggregate Stats */}
        <StatisticsPanel 
          meetingData={{
            total_duration_sec: analytics.total_duration_sec,
            engagement_percentage: analytics.engagement_percentage,
            category_durations: analytics.category_durations,
            avg_focus_seconds: analytics.avg_focus_seconds,
            interval_data: analytics.interval_data,
          }}
        />

        {/* Timeline (all users combined) */}
        <FocusTimeline
          intervalData={analytics.interval_data}
          meetingDate={new Date(startTime).toISOString().slice(0, 10)}
          cutoffTimeIso={endTime}
        />

        {/* Per-User Breakdown */}
        <div className="mt-10">
          <h2 className="text-lg font-semibold mb-4">Participant Activity</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {analytics.user_stats.map((user) => (
              <div key={user.user_id} className="glass-card rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium">User: {user.user_id.slice(0, 8)}…</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs ${
                    user.engagement_percentage >= 70 ? 'bg-green-500/10 text-green-600' :
                    user.engagement_percentage >= 40 ? 'bg-yellow-500/10 text-yellow-600' :
                    'bg-red-500/10 text-red-600'
                  }`}>
                    {user.engagement_percentage}% engaged
                  </span>
                </div>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <div className="flex justify-between">
                    <span>Duration</span>
                    <span>{Math.round(user.total_duration_sec / 60)} min</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Focus Time</span>
                    <span>{Math.round(user.category_durations['work_related'] / 60 || 0)} min</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-8 opacity-60">
          🔒 Privacy-first · Aggregated data only · No personal content tracked
        </p>
      </div>
    </div>
  );
};

export default Dashboard;