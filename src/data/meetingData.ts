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
