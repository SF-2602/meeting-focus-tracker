const API_BASE_URL = "http://localhost:8000";

export interface MeetingData {
  total_duration_sec: number;
  engagement_percentage: number;
  category_durations: {
    meeting?: number;
    work_related?: number;
    distraction?: number;
    other?: number;
  };
  avg_focus_seconds: number;
  interval_data: Array<{
    time: string;
    category: string;
    app: string;
    title: string;
    engaged_pct: number;
  }>;
}

export interface MeetingRequest {
  start_time: string;
  end_time: string;
}

export const analyzeMeeting = async (
  request: MeetingRequest,
): Promise<MeetingData> => {
  try {
    const response = await fetch(`${API_BASE_URL}/analyze-meeting`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error analyzing meeting:", error);
    throw error;
  }
};

export const analyzeLastHour = async (): Promise<MeetingData> => {
  const now = new Date();
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

  return analyzeMeeting({
    start_time: oneHourAgo.toISOString(),
    end_time: now.toISOString(),
  });
};
