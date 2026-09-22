import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { sql, assertDb } from "./db";
import { requireUserId } from "./session";
import type { Book, Chapter, Day, Goal, Journal, Task, User } from "./types";

export const getUser = cache(async (id: string): Promise<User | null> => {
  assertDb();
  const rows = await sql`
    select id, email, name, birthday::text as birthday, bio, avatar, letter, onboarded, created_at::text as created_at
    from users where id = ${id}`;
  return (rows[0] as User) ?? null;
});

/** The signed-in, onboarded user. Redirects otherwise. */
export async function requireUser(): Promise<User> {
  const id = await requireUserId();
  const user = await getUser(id);
  if (!user) redirect("/login");
  if (!user.onboarded) redirect("/onboarding");
  return user;
}

export async function getBook(userId: string): Promise<Book> {
  const rows = await sql`select title, subtitle, cover_image, cover_color from books where user_id = ${userId}`;
  return (rows[0] as Book) ?? { title: "My Book", subtitle: "", cover_image: null, cover_color: "kraft" };
}

export async function getChapters(userId: string): Promise<Chapter[]> {
  const [chapters, goals] = await Promise.all([
    sql`select id, title, label, motto, cover_image, start_date::text as start_date, end_date::text as end_date
        from chapters where user_id = ${userId} order by start_date, created_at`,
    sql`select id, chapter_id, text, done, done_at::text as done_at, position
        from goals where user_id = ${userId} order by position, id`,
  ]);
  return (chapters as Omit<Chapter, "goals">[]).map((c) => ({
    ...c,
    goals: (goals as Goal[]).filter((g) => g.chapter_id === c.id),
  }));
}

export async function getJournal(user: User): Promise<Journal> {
  const [book, chapters, days, tasks] = await Promise.all([
    getBook(user.id),
    getChapters(user.id),
    sql`select date::text as date, thought, free_notes, summary from days where user_id = ${user.id} order by date`,
    sql`select id, date::text as date, text, done, position from tasks where user_id = ${user.id} order by date, position, created_at`,
  ]);
  return { user, book, chapters, days: days as Day[], tasks: tasks as Task[] };
}
