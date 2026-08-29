export type ThemeAccent = "gold" | "indigo" | "emerald" | "rose" | "cyan" | "amber";

export interface UserProfile {
  name: string;
  username?: string;
  avatarUrl?: string;
  avatarPreset?: string;
  bio?: string;
  themeAccent?: ThemeAccent;
  age: string | number;
  goals: string[];
  challenges: string[];
  motivationStyle: string;
  preferredTime: string;
  createdAt?: string;
}

export interface Goal {
  id: number;
  text: string;
  category: string;
  priority: "low" | "medium" | "high";
  completed: boolean;
  progress: number;
  createdAt: string;
  targetDate?: string;
  milestones?: { title: string; description: string; done?: boolean }[];
}

export interface MoodEntry {
  id: number;
  mood: "excellent" | "good" | "okay" | "down" | "sad";
  energyLevel?: number; // 1-10
  notes: string;
  habits: string[];
  timestamp: string;
}

export interface Figure {
  id: string;
  name: string;
  emoji: string;
  era: string;
  themes: string;
  quoteSample?: string;
}

export interface QuoteItem {
  id: number | string;
  quote: string;
  context: string;
  practicalTakeaway?: string;
  memorableKeyword?: string;
  fig: {
    id?: string;
    name: string;
    emoji: string;
    era?: string;
  };
  saved?: boolean;
  createdAt?: string;
}

export interface AffirmationItem {
  id: number | string;
  text: string;
  category: string;
  activationAction?: string;
  isFavorite?: boolean;
}

export interface ChatMessage {
  id: string;
  sender: "user" | "coach";
  text: string;
  emotion?: "enthusiastic" | "empathetic" | "inspiring" | "tactical" | "grounding";
  actionStep?: string;
  quickReplies?: string[];
  timestamp: string;
}

export interface BadgeDef {
  id: string;
  icon: string;
  label: string;
  desc: string;
  category: "streak" | "goals" | "habits" | "wisdom" | "coach";
}
