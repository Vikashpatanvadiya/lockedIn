export type User = {
  id: string;
  email: string;
  name: string;
  birthday: string | null;
  created_at: string;
};

export type Goal = {
  id: string;
  text: string;
  done: boolean;
  /** The chapter this goal belongs to, identified by its first day. */
  chapter_start: string | null;
  position: number;
};

export type Task = {
  id: string;
  date: string;
  text: string;
  done: boolean;
  position: number;
  goal_id: string | null;
};

export type Review = {
  chapter_start: string;
  letter: string;
};
