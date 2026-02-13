import MeetingHeader from "../components/MeetingHeader";
import FocusTimeline from "../components/FocusTimeLine";
import StatisticsPanel from "../components/StatisticsPanel";
import { useEffect, useState } from "react";
import { type MeetingData, analyzeLastHour } from "../services/api";

const Index = () => {
  const [meetingData, setMeetingData] = useState<MeetingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const timeData = await analyzeLastHour();
        setMeetingData(timeData);
      } catch (err) {
        setError(
          "Failed to load meeting data. Make sure the backend is running.",
        );
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    const interval = setInterval(fetchData, 2 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

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

  if (error || !meetingData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center max-w-md p-6">
          <div className="text-destructive text-2xl mb-4">⚠️</div>
          <p className="text-muted-foreground mb-4">{error}</p>
          <p className="text-sm text-muted-foreground opacity-60">
            Please ensure ActivityWatch is running and the Python backend is
            started.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-5xl mx-auto px-6 py-10">
        <MeetingHeader />
        <FocusTimeline />
        <StatisticsPanel />

        <p className="text-center text-xs text-muted-foreground mt-8 opacity-60">
          🔒 Privacy-first · No screenshots or keystrokes · Only app names &
          timestamps
        </p>
      </div>
    </div>
  );
};
