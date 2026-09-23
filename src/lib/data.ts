import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { sql, assertDb } from "./db";
import { requireUserId } from "./session";
import type { Goal, Review, Task, User } from "./types";

export const getUser = cache(async (id: string): Promise<User | null> => {
  assertDb();
  const rows = await sql`
    select id, email, name, birthday::text as birthday, created_at::text as created_at
    from users where id = ${id}`;
  return (rows[0] as User) ?? null;
});

/** The signed-in user, or a redirect to the login page. */
export async function requireUser(): Promise<User> {
  const user = await getUser(await requireUserId());
  if (!user) redirect("/login");
  return user;
}

export async function getTasks(userId: string): Promise<Task[]> {
  const rows = await sql`
    select id, date::text as date, text, done, position, goal_id
    from tasks where user_id = ${userId} order by date, position, created_at`;
  return rows as Task[];
}

export async function getGoals(userId: string): Promise<Goal[]> {
  const rows = await sql`
    select id, text, done, chapter_start::text as chapter_start, position
    from goals where user_id = ${userId} and chapter_start is not null
    order by position, created_at`;
  return rows as Goal[];
}

export async function getReviews(userId: string): Promise<Review[]> {
  const rows = await sql`
    select chapter_start::text as chapter_start, letter
    from year_reviews where user_id = ${userId} order by chapter_start`;
  return rows as Review[];
}
