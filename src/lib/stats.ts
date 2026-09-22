import { addDays, diffDays } from "./dates";
import type { Chapter, Day, Task } from "./types";

export type DayStat = { date: string; planned: number; done: number; wrote: boolean };

export function dayStats(tasks: Task[], days: Day[]): Map<string, DayStat> {
  const map = new Map<string, DayStat>();
  const get = (date: string) => {
    let s = map.get(date);
    if (!s) map.set(date, (s = { date, planned: 0, done: 0, wrote: false }));
    return s;
  };
  for (const t of tasks) {
    const s = get(t.date);
    s.planned++;
    if (t.done) s.done++;
  }
  for (const d of days) {
    if (d.thought.trim() || d.free_notes.trim() || d.summary.trim()) get(d.date).wrote = true;
  }
  return map;
}

/** A day "counts" when at least one task was completed or the summary was written. */
const active = (s: DayStat | undefined) => Boolean(s && (s.done > 0 || s.wrote));

export function streaks(stats: Map<string, DayStat>, today: string) {
  // Current streak may end today or, if today is still empty, yesterday.
  let current = 0;
  let cursor = active(stats.get(today)) ? today : addDays(today, -1);
  while (active(stats.get(cursor))) {
    current++;
    cursor = addDays(cursor, -1);
  }
  const dates = [...stats.values()].filter((s) => s.date <= today && active(s)).map((s) => s.date).sort();
  let longest = 0;
  let run = 0;
  for (let i = 0; i < dates.length; i++) {
    run = i > 0 && diffDays(dates[i - 1], dates[i]) === 1 ? run + 1 : 1;
    longest = Math.max(longest, run);
  }
  return { current, longest };
}

/** Heat level 0–4 from the number of tasks completed that day. */
export function heatLevel(s: DayStat | undefined): number {
  if (!s) return 0;
  if (s.done === 0) return s.wrote ? 1 : 0;
  if (s.done === 1) return 1;
  if (s.done <= 3) return 2;
  if (s.done <= 5) return 3;
  return 4;
}

export function summarize(chapters: Chapter[], tasks: Task[], days: Day[], today: string) {
  const stats = dayStats(tasks, days);
  const past = tasks.filter((t) => t.date <= today);
  const tasksDone = past.filter((t) => t.done).length;
  const goals = chapters.flatMap((c) => c.goals);
  const goalsDone = goals.filter((g) => g.done).length;
  const daysWritten = [...stats.values()].filter((s) => s.wrote && s.date <= today).length;

  const chapter = chapters.find((c) => today >= c.start_date && today <= c.end_date) ?? chapters.at(-1) ?? null;
  let consistency = 0;
  if (chapter) {
    const end = today < chapter.end_date ? today : chapter.end_date;
    const elapsed = Math.max(1, diffDays(chapter.start_date, end) + 1);
    let activeDays = 0;
    for (let d = chapter.start_date; d <= end; d = addDays(d, 1)) if (active(stats.get(d))) activeDays++;
    consistency = activeDays / elapsed;
  }

  const taskRate = past.length ? tasksDone / past.length : 0;
  const goalRate = goals.length ? goalsDone / goals.length : 0;
  const growth = Math.round((taskRate * 0.5 + goalRate * 0.3 + consistency * 0.2) * 100);

  return {
    stats,
    ...streaks(stats, today),
    tasksDone,
    tasksPlanned: past.length,
    taskRate,
    goalsDone,
    goalsTotal: goals.length,
    goalRate,
    daysWritten,
    consistency,
    growth,
    chapter,
  };
}

/** Completion per week (Sunday start) for the last `weeks` weeks. */
export function weekly(stats: Map<string, DayStat>, today: string, weeks = 12) {
  const dow = new Date(`${today}T00:00:00Z`).getUTCDay();
  const thisWeek = addDays(today, -dow);
  return Array.from({ length: weeks }, (_, i) => {
    const start = addDays(thisWeek, -7 * (weeks - 1 - i));
    let planned = 0;
    let done = 0;
    for (let k = 0; k < 7; k++) {
      const s = stats.get(addDays(start, k));
      if (s) {
        planned += s.planned;
        done += s.done;
      }
    }
    return { start, planned, done, rate: planned ? done / planned : 0 };
  });
}
