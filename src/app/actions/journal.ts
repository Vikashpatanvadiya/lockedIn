"use server";

import { revalidatePath } from "next/cache";
import { sql, assertDb } from "@/lib/db";
import { getUserId } from "@/lib/session";

const ISO = /^\d{4}-\d{2}-\d{2}$/;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function uid() {
  assertDb();
  const id = await getUserId();
  if (!id) throw new Error("Not signed in");
  return id;
}

const text = (v: unknown, max: number) => String(v ?? "").slice(0, max);
const date = (v: unknown) => {
  const s = String(v ?? "");
  if (!ISO.test(s)) throw new Error("Invalid date");
  return s;
};
const id = (v: unknown) => {
  const s = String(v ?? "");
  if (!UUID.test(s)) throw new Error("Invalid id");
  return s;
};

export async function addTask(input: { id: string; date: string; text: string; position: number; goal_id: string | null }) {
  const userId = await uid();
  await sql`insert into tasks (id, user_id, date, text, position, goal_id)
    values (${id(input.id)}, ${userId}, ${date(input.date)}, ${text(input.text, 300)}, ${Number(input.position) || 0},
            ${input.goal_id ? id(input.goal_id) : null})`;
}

/** Point a task at a goal, or clear it with null. */
export async function setTaskGoal(taskId: string, goalId: string | null) {
  const userId = await uid();
  await sql`update tasks set goal_id = ${goalId ? id(goalId) : null}
    where id = ${id(taskId)} and user_id = ${userId}
      and (${goalId ? id(goalId) : null}::uuid is null
        or exists (select 1 from goals g where g.id = ${goalId ? id(goalId) : null} and g.user_id = ${userId}))`;
}

export async function addGoal(input: { id: string; text: string; chapter_start: string; position: number }) {
  const userId = await uid();
  await sql`insert into goals (id, user_id, text, chapter_start, position)
    values (${id(input.id)}, ${userId}, ${text(input.text, 200)}, ${date(input.chapter_start)}, ${Number(input.position) || 0})`;
}

export async function updateGoal(goalId: string, patch: { text?: string; done?: boolean }) {
  const userId = await uid();
  await sql`update goals set
      text = coalesce(${patch.text === undefined ? null : text(patch.text, 200)}, text),
      done = coalesce(${patch.done ?? null}, done)
    where id = ${id(goalId)} and user_id = ${userId}`;
}

export async function deleteGoal(goalId: string) {
  const userId = await uid();
  await sql`delete from goals where id = ${id(goalId)} and user_id = ${userId}`;
}

export async function updateTask(taskId: string, patch: { text?: string; done?: boolean }) {
  const userId = await uid();
  await sql`update tasks set
      text = coalesce(${patch.text === undefined ? null : text(patch.text, 300)}, text),
      done = coalesce(${patch.done ?? null}, done)
    where id = ${id(taskId)} and user_id = ${userId}`;
}

export async function deleteTask(taskId: string) {
  const userId = await uid();
  await sql`delete from tasks where id = ${id(taskId)} and user_id = ${userId}`;
}

export async function updateProfile(input: { name: string; birthday: string | null }) {
  const userId = await uid();
  await sql`update users set name = ${text(input.name, 80).trim() || "Friend"},
    birthday = ${input.birthday ? date(input.birthday) : null} where id = ${userId}`;
  revalidatePath("/", "layout");
}

/** Save the letter you write when a chapter closes. */
export async function saveReview(chapterStart: string, letter: string) {
  const userId = await uid();
  await sql`insert into year_reviews (user_id, chapter_start, letter)
    values (${userId}, ${date(chapterStart)}, ${text(letter, 20_000)})
    on conflict (user_id, chapter_start) do update set letter = excluded.letter, updated_at = now()`;
}
