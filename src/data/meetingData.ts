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


export const participants: Participant[] = [
  {
    name: "Sean",
    avatar: "S",
    improved: true,
    segments: [
      { app: "Zoom Meeting", category: "meeting", startMin: 0, endMin: 60, emoji: "📹" },
    ],
  },
  {
    name: "Max",
    avatar: "M",
    improved: false,
    segments: [
      { app: "YouTube", category: "media", startMin: 5, endMin: 18, emoji: "🎥" },
      { app: "Zoom Meeting", category: "meeting", startMin: 18, endMin: 45, emoji: "📹" },
      { app: "Visual Studio Code", category: "dev", startMin: 48, endMin: 60, emoji: "💻" },
    ],
  },
  {
    name: "Marvel",
    avatar: "V",
    improved: false,
    segments: [
      { app: "Zoom Meeting", category: "meeting", startMin: 3, endMin: 30, emoji: "📹" },
      { app: "Instagram", category: "social", startMin: 30, endMin: 55, emoji: "📱" },
    ],
  },
  {
    name: "Jovan",
    avatar: "J",
    improved: true,
    segments: [
      { app: "Zoom Meeting", category: "meeting", startMin: 5, endMin: 35, emoji: "📹" },
      { app: "Microsoft Word", category: "office", startMin: 35, endMin: 42, emoji: "📝" },
      { app: "Zoom Meeting", category: "meeting", startMin: 45, endMin: 60, emoji: "📹" },
    ],
  },
];

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
