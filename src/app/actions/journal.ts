"use server";

import { revalidatePath } from "next/cache";
import { sql, assertDb } from "@/lib/db";
import { getUserId } from "@/lib/session";
import type { CoverColor } from "@/lib/types";

const ISO = /^\d{4}-\d{2}-\d{2}$/;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const COLORS: CoverColor[] = ["kraft", "sky", "blush", "forest", "ink", "sun"];
const MAX_IMAGE = 3_000_000;

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
const image = (v: unknown): string | null => {
  if (v == null || v === "") return null;
  const s = String(v);
  if (!/^data:image\/(jpeg|png|webp);base64,/.test(s) || s.length > MAX_IMAGE) throw new Error("Invalid image");
  return s;
};
const color = (v: unknown): CoverColor => (COLORS.includes(v as CoverColor) ? (v as CoverColor) : "kraft");

type ChapterInput = {
  title: string;
  label?: string;
  motto?: string;
  cover_image?: string | null;
  start_date: string;
  end_date: string;
  goals?: { id: string; text: string }[];
};

function chapterValues(c: ChapterInput) {
  const start = date(c.start_date);
  const end = date(c.end_date);
  if (end < start) throw new Error("A chapter must end after it starts");
  return {
    title: text(c.title, 120).trim() || "Untitled chapter",
    label: text(c.label, 60),
    motto: text(c.motto, 280),
    cover_image: image(c.cover_image),
    start,
    end,
  };
}

// ---------- Onboarding ----------

export async function completeOnboarding(input: {
  name: string;
  birthday: string;
  letter: string;
  book: { title: string; subtitle: string; cover_image: string | null; cover_color: string };
  chapter: ChapterInput;
}) {
  const userId = await uid();
  const c = chapterValues(input.chapter);
  const goals = (input.chapter.goals ?? []).filter((g) => g.text.trim()).slice(0, 40);
  const chapterId = crypto.randomUUID();

  await sql.transaction([
    sql`update users set name = ${text(input.name, 80).trim() || "Friend"}, birthday = ${date(input.birthday)},
        letter = ${text(input.letter, 20_000)}, onboarded = true where id = ${userId}`,
    sql`insert into books (user_id, title, subtitle, cover_image, cover_color)
        values (${userId}, ${text(input.book.title, 80) || "My Book"}, ${text(input.book.subtitle, 160)},
                ${image(input.book.cover_image)}, ${color(input.book.cover_color)})
        on conflict (user_id) do update set title = excluded.title, subtitle = excluded.subtitle,
          cover_image = excluded.cover_image, cover_color = excluded.cover_color, updated_at = now()`,
    sql`insert into chapters (id, user_id, title, label, motto, cover_image, start_date, end_date)
        values (${chapterId}, ${userId}, ${c.title}, ${c.label}, ${c.motto}, ${c.cover_image}, ${c.start}, ${c.end})`,
    ...goals.map(
      (g, i) => sql`insert into goals (id, chapter_id, user_id, text, position)
                    values (${id(g.id)}, ${chapterId}, ${userId}, ${text(g.text, 200)}, ${i})`,
    ),
  ]);
  revalidatePath("/", "layout");
}

// ---------- Profile & book ----------

export async function updateProfile(input: { name: string; birthday: string | null; bio: string; avatar: string | null }) {
  const userId = await uid();
  await sql`update users set name = ${text(input.name, 80).trim() || "Friend"},
    birthday = ${input.birthday ? date(input.birthday) : null}, bio = ${text(input.bio, 500)},
    avatar = ${image(input.avatar)} where id = ${userId}`;
  revalidatePath("/", "layout");
}

export async function updateLetter(letter: string) {
  const userId = await uid();
  await sql`update users set letter = ${text(letter, 20_000)} where id = ${userId}`;
}

export async function updateBook(input: { title: string; subtitle: string; cover_image: string | null; cover_color: string }) {
  const userId = await uid();
  await sql`insert into books (user_id, title, subtitle, cover_image, cover_color)
    values (${userId}, ${text(input.title, 80) || "My Book"}, ${text(input.subtitle, 160)}, ${image(input.cover_image)}, ${color(input.cover_color)})
    on conflict (user_id) do update set title = excluded.title, subtitle = excluded.subtitle,
      cover_image = excluded.cover_image, cover_color = excluded.cover_color, updated_at = now()`;
  revalidatePath("/", "layout");
}

// ---------- Chapters & goals ----------

export async function createChapter(input: ChapterInput & { id: string }) {
  const userId = await uid();
  const c = chapterValues(input);
  const chapterId = id(input.id);
  const goals = (input.goals ?? []).filter((g) => g.text.trim()).slice(0, 40);
  await sql.transaction([
    sql`insert into chapters (id, user_id, title, label, motto, cover_image, start_date, end_date)
        values (${chapterId}, ${userId}, ${c.title}, ${c.label}, ${c.motto}, ${c.cover_image}, ${c.start}, ${c.end})`,
    ...goals.map(
      (g, i) => sql`insert into goals (id, chapter_id, user_id, text, position)
                    values (${id(g.id)}, ${chapterId}, ${userId}, ${text(g.text, 200)}, ${i})`,
    ),
  ]);
  revalidatePath("/growth");
}

export async function updateChapter(chapterId: string, input: Omit<ChapterInput, "goals">) {
  const userId = await uid();
  const c = chapterValues(input);
  await sql`update chapters set title = ${c.title}, label = ${c.label}, motto = ${c.motto},
    cover_image = ${c.cover_image}, start_date = ${c.start}, end_date = ${c.end}
    where id = ${id(chapterId)} and user_id = ${userId}`;
  revalidatePath("/growth");
}

export async function deleteChapter(chapterId: string) {
  const userId = await uid();
  await sql`delete from chapters where id = ${id(chapterId)} and user_id = ${userId}`;
  revalidatePath("/growth");
}

export async function addGoal(input: { id: string; chapter_id: string; text: string; position: number }) {
  const userId = await uid();
  await sql`insert into goals (id, chapter_id, user_id, text, position)
    select ${id(input.id)}, c.id, ${userId}, ${text(input.text, 200)}, ${Number(input.position) || 0}
    from chapters c where c.id = ${id(input.chapter_id)} and c.user_id = ${userId}`;
}

export async function updateGoal(goalId: string, patch: { text?: string; done?: boolean; done_at?: string | null }) {
  const userId = await uid();
  const doneAt = patch.done ? date(patch.done_at) : null;
  await sql`update goals set
      text = coalesce(${patch.text === undefined ? null : text(patch.text, 200)}, text),
      done = coalesce(${patch.done ?? null}, done),
      done_at = case when ${patch.done ?? null}::boolean is null then done_at else ${doneAt}::date end
    where id = ${id(goalId)} and user_id = ${userId}`;
}

export async function deleteGoal(goalId: string) {
  const userId = await uid();
  await sql`delete from goals where id = ${id(goalId)} and user_id = ${userId}`;
}

// ---------- Days & tasks ----------

export async function saveDay(day: string, patch: { thought?: string; free_notes?: string; summary?: string }) {
  const userId = await uid();
  const d = date(day);
  const t = patch.thought === undefined ? null : text(patch.thought, 5_000);
  const f = patch.free_notes === undefined ? null : text(patch.free_notes, 20_000);
  const s = patch.summary === undefined ? null : text(patch.summary, 10_000);
  await sql`insert into days (user_id, date, thought, free_notes, summary)
    values (${userId}, ${d}, ${t ?? ""}, ${f ?? ""}, ${s ?? ""})
    on conflict (user_id, date) do update set
      thought = coalesce(${t}, days.thought),
      free_notes = coalesce(${f}, days.free_notes),
      summary = coalesce(${s}, days.summary),
      updated_at = now()`;
}

export async function addTask(input: { id: string; date: string; text: string; position: number }) {
  const userId = await uid();
  await sql`insert into tasks (id, user_id, date, text, position)
    values (${id(input.id)}, ${userId}, ${date(input.date)}, ${text(input.text, 300)}, ${Number(input.position) || 0})`;
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
