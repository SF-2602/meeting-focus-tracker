import { useState, useEffect } from "react";
import MeetingHeader from "../components/MeetingHeader";
import FocusTimeline from "../components/FocusTimeLine";
import StatisticsPanel from "../components/StatisticsPanel";
import { analyzeLastHour, type MeetingData } from "../services/api";

const Index = () => {
  const [meetingData, setMeetingData] = useState<MeetingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await analyzeLastHour();
        setMeetingData(data);
      } catch (err: any) {
        setError(err.message || "Failed to load meeting data");
        console.error("Fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
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
          participants={4}
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
