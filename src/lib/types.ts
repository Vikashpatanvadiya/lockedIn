export type User = {
  id: string;
  email: string;
  name: string;
  birthday: string | null;
  bio: string;
  avatar: string | null;
  letter: string;
  onboarded: boolean;
  created_at: string;
};

export type CoverColor = "kraft" | "sky" | "blush" | "forest" | "ink" | "sun";

export type Book = {
  title: string;
  subtitle: string;
  cover_image: string | null;
  cover_color: CoverColor;
};

export type Goal = {
  id: string;
  chapter_id: string;
  text: string;
  done: boolean;
  done_at: string | null;
  position: number;
};

export type Chapter = {
  id: string;
  title: string;
  label: string;
  motto: string;
  cover_image: string | null;
  start_date: string;
  end_date: string;
  goals: Goal[];
};

export type Day = {
  date: string;
  thought: string;
  free_notes: string;
  summary: string;
};

export type Task = {
  id: string;
  date: string;
  text: string;
  done: boolean;
  position: number;
};

export type Journal = {
  user: User;
  book: Book;
  chapters: Chapter[];
  days: Day[];
  tasks: Task[];
};
