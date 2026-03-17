const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000";

export interface Meeting {
  id: string;
  name: string;
  start_time: string;
  end_time: string;
  participant_count: number;
}

export interface UserMeeting {
  meeting_id: string;
  meeting_name: string;
  start_time: string;
  end_time: string;
  role: string;
  joined_at: string;
}

export interface PublicMeeting {
  id: string;
  name: string;
  start_time: string;
  end_time: string;
  participant_count: number;
  is_joined: boolean;
}

export interface MeetingAnalytics {
  meeting_id: string;
  total_duration_sec: number;
  engagement_percentage: number;
  category_durations: Record<string, number>;
  avg_focus_seconds: number;
  interval_data: Array<{
    time: string;
    category: string;
    app: string;
    title: string;
    engaged_pct: number;
  }>;
  user_stats: Array<{
    user_id: string;
    total_duration_sec: number;
    engagement_percentage: number;
    category_durations: Record<string, number>;
  }>;
  user_interval_data?: Record<
    string,
    Array<{
      time: string;
      category: string;
      app: string;
      title: string;
      engaged_pct: number;
    }>
  >;
}

export const registerUser = async (userId: string) => {
  const res = await fetch(`${API_BASE}/users/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ user_id: userId }),
  });
  if (!res.ok) throw new Error("Registration failed");
  return res.json();
};

export const getUserMeetings = async (
  userId: string,
): Promise<UserMeeting[]> => {
  const res = await fetch(`${API_BASE}/users/${userId}/meetings`);
  if (!res.ok) throw new Error("Failed to fetch meetings");
  return res.json();
};

export const joinMeeting = async (userId: string, meetingId: string) => {
  const res = await fetch(`${API_BASE}/meetings/join`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ user_id: userId, meeting_id: meetingId }),
  });
  if (!res.ok) throw new Error("Failed to join meeting");
  return res.json();
};

export const createMeeting = async (
  name: string,
  startTime: string,
  endTime: string,
  hostUserId: string,
) => {
  const res = await fetch(`${API_BASE}/meetings`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name,
      start_time: startTime,
      end_time: endTime,
      host_user_id: hostUserId,
    }),
  });
  if (!res.ok) throw new Error("Failed to create meeting");
  return res.json();
};

export const getMeeting = async (meetingId: string): Promise<Meeting> => {
  const res = await fetch(`${API_BASE}/meetings/${meetingId}`);
  if (!res.ok) throw new Error("Meeting not found");
  return res.json();
};

export const analyzeMeeting = async (params: {
  meeting_id: string;
  start_time?: string;
  end_time?: string;
}) => {
  const searchParams = new URLSearchParams();
  if (params.start_time) searchParams.set("start_time", params.start_time);
  if (params.end_time) searchParams.set("end_time", params.end_time);

  const res = await fetch(
    `${API_BASE}/meetings/${params.meeting_id}/analyze?${searchParams}`,
    { method: "POST" },
  );
  if (!res.ok) throw new Error("Analysis failed");
  return res.json() as Promise<MeetingAnalytics>;
};

export const getMeetingFocus = async (params: {
  user_id: string;
  meeting_id?: string;
  start_time?: string;
  end_time?: string;
}) => {
  const searchParams = new URLSearchParams({ user_id: params.user_id });
  if (params.meeting_id) searchParams.set("meeting_id", params.meeting_id);
  if (params.start_time) searchParams.set("start_time", params.start_time);
  if (params.end_time) searchParams.set("end_time", params.end_time);

  const res = await fetch(`${API_BASE}/meeting-focus?${searchParams}`);
  if (!res.ok) throw new Error("Failed to fetch focus data");
  return res.json();
};

export const triggerMeetingAnalysis = async (params: {
  meeting_id: string;
  user_id: string;
  start_time: string;
  end_time: string;
}) => {
  const res = await fetch(
    `${API_BASE}/meetings/${params.meeting_id}/trigger-analysis`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user_id: params.user_id,
        start_time: params.start_time,
        end_time: params.end_time,
      }),
    },
  );

  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.detail || "Failed to trigger analysis");
  }

  return res.json();
};

export const getPublicMeetings = async (
  userId?: string,
): Promise<PublicMeeting[]> => {
  const url = new URL(`${API_BASE}/meetings/public`);
  if (userId) {
    url.searchParams.set("user_id", userId);
  }

  const res = await fetch(url.toString());
  if (!res.ok) throw new Error("Failed to fetch public meetings");
  return res.json();
};
