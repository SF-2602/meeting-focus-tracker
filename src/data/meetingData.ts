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
  improved: boolean; // improved vs last meeting
  segments: ActivitySegment[];
}


export function getCategoryColor(category: ActivitySegment["category"]): string {
  switch (category) {
    case "meeting": return "bg-focus-green";
    case "media": return "bg-focus-red";
    case "social": return "bg-focus-red";
    case "dev": return "bg-focus-purple";
    case "office": return "bg-focus-blue";
    default: return "bg-muted-foreground";
  }
}

export function getCategoryLabel(category: ActivitySegment["category"]): string {
  switch (category) {
    case "meeting": return "Zoom Time";
    case "media": return "Quick Breaks";
    case "social": return "Social";
    case "dev": return "Deep Work";
    case "office": return "Office Apps";
    default: return "Other";
  }
}

// export function getFocusPercentage(p: Participant): number {
//   const meetingMins = p.segments
//     .filter(s => s.category === "meeting")
//     .reduce((sum, s) => sum + (s.endMin - s.startMin), 0);
//   return Math.round((meetingMins / MEETING_DURATION) * 100);
// }
