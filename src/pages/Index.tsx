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

/** Round time to :00 or :30 only (e.g. 9:15 → 9:30, 9:45 → 10:00). */
const roundTimeToHalfHour = (timeStr: string): string => {
  const [h, m] = timeStr.split(":").map((s) => parseInt(s, 10) || 0);
  const min = m ?? 0;
  const roundedMin = min < 15 ? 0 : min < 45 ? 30 : 0;
  const addHour = min >= 45 ? 1 : 0;
  const newH = (h + addHour) % 24;
  return `${String(newH).padStart(2, "0")}:${roundedMin === 0 ? "00" : "30"}`;
};

const getDefaultRange = () => {
  const now = new Date();
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
  const meetingDate = now.toISOString().slice(0, 10);
  const startTime = roundTimeToHalfHour(
    `${oneHourAgo.getHours()}:${oneHourAgo.getMinutes()}`,
  );
  const endTime = roundTimeToHalfHour(
    `${now.getHours()}:${now.getMinutes()}`,
  );
  return { meetingDate, startTime, endTime };
};

const rangeToIso = (
  meetingDate: string,
  startTime: string,
  endTime: string,
): { start_iso: string; end_iso: string } => {
  const startDate = new Date(`${meetingDate}T${startTime}`);
  let endDate = new Date(`${meetingDate}T${endTime}`);
  if (endDate <= startDate) endDate.setDate(endDate.getDate() + 1);
  return {
    start_iso: startDate.toISOString(),
    end_iso: endDate.toISOString(),
  };
};

const defaults = getDefaultRange();

const Index = () => {
  const [meetingData, setMeetingData] = useState<MeetingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [meetingDate, setMeetingDate] = useState(defaults.meetingDate);
  const [startTime, setStartTime] = useState(defaults.startTime);
  const [endTime, setEndTime] = useState(defaults.endTime);

  const userId = getOrCreateUserId();

  const fetchData = async (opts?: {
    meetingDate: string;
    startTime: string;
    endTime: string;
  }) => {
    const { meetingDate: d, startTime: s, endTime: e } = opts ?? {
      meetingDate,
      startTime,
      endTime,
    };
    const { start_iso, end_iso } = rangeToIso(d, s, e);

    try {
      setLoading(true);
      setError(null);

      try {
        await analyzeMeeting({
          start_time: start_iso,
          end_time: end_iso,
          user_id: userId,
          meeting_id: userId,
        });
      } catch (analyzeErr) {
        console.error(
          "Analysis failed (will still try to fetch existing data):",
          analyzeErr,
        );
      }

      const data = await getMeetingFocus({
        user_id: userId,
        meeting_id: userId,
        start_time: start_iso,
        end_time: end_iso,
      });
      setMeetingData(data);
    } catch (err: any) {
      setError(err.message || "Failed to load meeting data");
      console.error("Fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
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

  const handleStartTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    if (v) setStartTime(roundTimeToHalfHour(v));
  };
  const handleEndTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    if (v) setEndTime(roundTimeToHalfHour(v));
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-5xl mx-auto px-6 py-10">
        <div className="mb-6 p-4 rounded-xl border bg-card text-card-foreground shadow-sm">
          <p className="text-sm font-medium text-muted-foreground mb-3">
            Time range (rounded to :00 or :30)
          </p>
          <div className="flex flex-wrap items-end gap-3">
            <label className="flex flex-col gap-1">
              <span className="text-xs text-muted-foreground">Date</span>
              <input
                type="date"
                value={meetingDate}
                onChange={(e) => setMeetingDate(e.target.value)}
                className="rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs text-muted-foreground">Start</span>
              <input
                type="time"
                step="1800"
                value={startTime}
                onChange={handleStartTimeChange}
                onBlur={(e) => e.target.value && setStartTime(roundTimeToHalfHour(e.target.value))}
                className="rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs text-muted-foreground">End</span>
              <input
                type="time"
                step="1800"
                value={endTime}
                onChange={handleEndTimeChange}
                onBlur={(e) => e.target.value && setEndTime(roundTimeToHalfHour(e.target.value))}
                className="rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
            </label>
            <button
              type="button"
              onClick={() => fetchData()}
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              Update range
            </button>
          </div>
        </div>

        <MeetingHeader
          duration={meetingData.total_duration_sec / 60}
          participants={1}
          startTimeLabel={startTime}
          endTimeLabel={endTime}
        />
        <FocusTimeline
          intervalData={meetingData.interval_data}
          meetingDate={meetingDate}
          cutoffTimeIso={(() => {
            const now = new Date();
            const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
            const endDateTime = new Date(`${meetingDate}T${endTime}`);
            const cutoff =
              meetingDate === todayStr && now < endDateTime
                ? now
                : endDateTime;
            return cutoff.toISOString();
          })()}
        />
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
