import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
// import MeetingHeader from "../components/MeetingHeader";
import FocusTimeline from "../components/FocusTimeLine";
import StatisticsPanel from "../components/StatisticsPanel";
import {
  analyzeMeeting,
  triggerMeetingAnalysis,
  type MeetingAnalytics,
} from "../services/api";

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
  const [meetingName, setMeetingName] = useState<string>(
    state?.meetingName || "Meeting",
  );
  const [startTime, setStartTime] = useState<string>(state?.startTime || "");
  const [endTime, setEndTime] = useState<string>(state?.endTime || "");
  const [userId, setUserId] = useState<string>(state?.userId || ""); // ✅ Add userId state

  const [analytics, setAnalytics] = useState<MeetingAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false); // ✅ New state for analysis button
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!meetingId || !userId) {
      navigate("/meetings", { replace: true });
      return;
    }
    fetchAnalytics();
  }, [meetingId, userId]);

  const toIsoString = (timeStr: string | undefined): string | undefined => {
    if (!timeStr) return undefined;

    if (
      timeStr.includes("Z") ||
      timeStr.includes("+") ||
      timeStr.split("T")[1]?.includes(":00")
    ) {
      return timeStr.replace(/:\d{2}:\d{2}:\d{2}$/, ":00");
    }

    if (/^\d{2}:\d{2}$/.test(timeStr)) {
      return `${timeStr}:00`;
    }

    if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(timeStr)) {
      return `${timeStr}:00`;
    }

    return timeStr;
  };

  const fetchAnalytics = async () => {
    if (!meetingId) return;

    try {
      setLoading(true);
      setError(null);

      console.log("🔍 Fetching analytics for meeting:", meetingId);
      console.log("📅 Time range:", { startTime, endTime });

      const data = await analyzeMeeting({
        meeting_id: meetingId,
        start_time: toIsoString(startTime),
        end_time: toIsoString(endTime),
      });

      console.log("📥 Received analytics:", {
        engagement: data.engagement_percentage,
        users: data.user_stats?.length,
        intervals: data.interval_data?.length,
      });

      setAnalytics(data);
    } catch (err: any) {
      console.error("❌ Fetch error:", err);
      setError(err.message || "Failed to load analytics");
    } finally {
      setLoading(false);
    }
  };

  const handleFetchData = async () => {
    if (!meetingId || !userId || !startTime || !endTime) {
      setError("Missing meeting details");
      return;
    }

    setAnalyzing(true);
    setError(null);

    try {
      console.log("🔄 Triggering analysis for meeting:", meetingId);

      const result = await triggerMeetingAnalysis({
        meeting_id: meetingId,
        user_id: userId,
        start_time: toIsoString(startTime)!,
        end_time: toIsoString(endTime)!,
      });

      console.log("Analysis triggered:", result);

      console.log("Waiting for data to commit...");
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Then fetch fresh analytics
      await fetchAnalytics();
    } catch (err: any) {
      console.error("❌ Analysis trigger failed:", err);
      setError(err.message || "Failed to fetch activity data");
    } finally {
      setAnalyzing(false);
    }
  };

  // Loading states
  if (loading && !analyzing) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading analytics...</p>
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
          <div className="flex gap-2 justify-center">
            <button
              onClick={() => fetchAnalytics()}
              className="text-sm text-primary hover:underline"
            >
              Retry
            </button>
            <button
              onClick={() => navigate("/meetings")}
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              ← Back to Meetings
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-6 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold tracking-tight">
            {meetingName}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {new Date(startTime).toLocaleString()} –{" "}
            {new Date(endTime).toLocaleString()}
          </p>
        </div>

        <div className="mb-6 p-4 rounded-xl border bg-card/50">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-medium">Activity Data</h3>
              <p className="text-xs text-muted-foreground">
                Fetch window activity from ActivityWatch for this meeting
              </p>
            </div>
            <button
              onClick={handleFetchData}
              disabled={analyzing}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                analyzing
                  ? "bg-muted text-muted-foreground cursor-not-allowed"
                  : "bg-primary text-primary-foreground hover:bg-primary/90"
              }`}
            >
              {analyzing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent"></div>
                  Fetching...
                </>
              ) : (
                <>
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                    />
                  </svg>
                  Fetch Activity Data
                </>
              )}
            </button>
          </div>
        </div>

        {!analytics || analytics.user_stats?.length === 0 ? (
          <div className="glass-card rounded-xl p-8 text-center">
            <div className="text-muted-foreground mb-4">
              <svg
                className="w-12 h-12 mx-auto opacity-50"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-medium mb-2">No activity data yet</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Click "Fetch Activity Data" to pull window activity from
              ActivityWatch for this meeting time range.
            </p>
            <button
              onClick={handleFetchData}
              disabled={analyzing}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 disabled:opacity-50"
            >
              {analyzing ? "Fetching..." : "Fetch Activity Data"}
            </button>
          </div>
        ) : (
          <>
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

            <FocusTimeline
              intervalData={analytics.interval_data}
              meetingDate={new Date(startTime).toISOString().slice(0, 10)}
              cutoffTimeIso={endTime}
            />

            <div className="mt-10">
              <h2 className="text-lg font-semibold mb-4">
                Participant Activity
              </h2>
              <div className="grid gap-4 md:grid-cols-2">
                {analytics.user_stats.map((user) => (
                  <div key={user.user_id} className="glass-card rounded-xl p-4">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-medium">
                        User: {user.user_id.slice(0, 8)}…
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs ${
                          user.engagement_percentage >= 70
                            ? "bg-green-500/10 text-green-600"
                            : user.engagement_percentage >= 40
                              ? "bg-yellow-500/10 text-yellow-600"
                              : "bg-red-500/10 text-red-600"
                        }`}
                      >
                        {user.engagement_percentage}% engaged
                      </span>
                    </div>
                    <div className="space-y-2 text-sm text-muted-foreground">
                      <div className="flex justify-between">
                        <span>Duration</span>
                        <span>
                          {Math.round(user.total_duration_sec / 60)} min
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Focus Time</span>
                        <span>
                          {Math.round(
                            user.category_durations["work_related"] / 60 || 0,
                          )}{" "}
                          min
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        <p className="text-center text-xs text-muted-foreground mt-8 opacity-60">
          🔒 Privacy-first · Aggregated data only · No personal content tracked
        </p>
      </div>
    </div>
  );
};

export default Dashboard;
