import { useState, useEffect } from "react";
import MeetingHeader from "../components/MeetingHeader";
import FocusTimeline from "../components/FocusTimeLine";
import StatisticsPanel from "../components/StatisticsPanel";
import {
  analyzeMeeting,
  getMeetingFocus,
  type MeetingData,
} from "../services/api";

// import { v4 as uuidv4 } from "uuid";

const getOrCreateUserId = () => {
  const defaultId = "421829fb-3fe6-4fc4-8b2e-c4819b86dc5c";
  let uid = localStorage.getItem("focus_user_id");

  if (!uid) {
    localStorage.setItem("focus_user_id", defaultId);
    uid = defaultId;
  }

  return uid;
};

const Index = () => {
  const [meetingData, setMeetingData] = useState<MeetingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const userId = getOrCreateUserId();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        let data = await getMeetingFocus({ user_id: userId });

        if (!data || data.total_duration_sec === 0) {
          console.log("No data found → running fresh analysis");
          const now = new Date();
          const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

          try {
            const analysisResult = await analyzeMeeting({
              start_time: oneHourAgo.toISOString(),
              end_time: now.toISOString(),
              user_id: userId,
              meeting_id: `solo-${userId.slice(0, 8)}-${Date.now()}`,
            });

            data = analysisResult;
          } catch (analyzeErr) {
            console.error("Analysis also failed:", analyzeErr);
          }
        }

        setMeetingData(data);
      } catch (err: any) {
        setError(err.message || "Failed to load meeting data");
        console.error("Fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [userId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">
            Analyzing your meeting focus...
          </p>
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
          <p className="text-sm text-muted-foreground opacity-60">
            Make sure ActivityWatch is running and the Python backend is
            started.
          </p>
        </div>
      </div>
    );
  }

  if (!meetingData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">No data available</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-5xl mx-auto px-6 py-10">
        <MeetingHeader
          duration={meetingData.total_duration_sec / 60}
          participants={1}
        />
        <FocusTimeline intervalData={meetingData.interval_data} />
        <StatisticsPanel meetingData={meetingData} />

        <p className="text-center text-xs text-muted-foreground mt-8 opacity-60">
          🔒 Privacy-first · No screenshots or keystrokes · Only app names &
          timestamps
        </p>
      </div>
    </div>
  );
};

export default Index;
