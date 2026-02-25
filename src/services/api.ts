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
  user_id?: string;
  meeting_id?: string;
}

export const analyzeMeeting = async (
  request: MeetingRequest,
): Promise<MeetingData> => {
  try {
    console.log("Sending request to backend:", request);

    const response = await fetch(`${API_BASE_URL}/analyze-meeting`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(request),
    });

    console.log("Response status:", response.status);
    console.log(
      "Response headers:",
      Object.fromEntries(response.headers.entries()),
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Backend error response:", errorText);
      throw new Error(
        `HTTP error! status: ${response.status}, message: ${errorText}`,
      );
    }

    const data = await response.json();
    console.log("Received data from backend:", data);
    return data;
  } catch (error) {
    console.error("Error analyzing meeting:", error);
    throw error;
  }
};

export const analyzeLastHour = async (
  context: { user_id?: string; meeting_id?: string } = {},
): Promise<MeetingData> => {
  const now = new Date();
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

  console.log("Analyzing last hour:", {
    start_time: oneHourAgo.toISOString(),
    end_time: now.toISOString(),
  });

  return analyzeMeeting({
    start_time: oneHourAgo.toISOString(),
    end_time: now.toISOString(),
    ...context, 
  });
};
