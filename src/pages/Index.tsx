import MeetingHeader from "../components/MeetingHeader";
import FocusTimeline from "../components/FocusTimeLine";
import StatisticsPanel from "../components/StatisticsPanel";
const Index = () => {
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

export default Index;
