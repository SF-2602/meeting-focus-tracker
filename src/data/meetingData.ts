export interface ActivitySegment {
  app: string;
  category: "meeting" | "media" | "dev" | "office" | "social" | "other";
  startMin: number; 
  endMin: number;
  emoji: string;
}

export interface Participant {
  name: string;
  avatar: string;
  improved: boolean; 
  segments: ActivitySegment[];
}


// export function getFocusPercentage(p: Participant): number {
//   const meetingMins = p.segments
//     .filter(s => s.category === "meeting")
//     .reduce((sum, s) => sum + (s.endMin - s.startMin), 0);
//   return Math.round((meetingMins / MEETING_DURATION) * 100);
// }
