"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as actions from "@/app/actions/journal";
import type { Chapter, Day, Goal, Journal, Task } from "@/lib/types";
import type { ChapterDraft } from "@/components/ChapterFields";

type DayField = "thought" | "free_notes" | "summary";
export type SaveStatus = "idle" | "saving" | "saved" | "error";

const EMPTY_DAY = (date: string): Day => ({ date, thought: "", free_notes: "", summary: "" });

/** Client-side journal state with optimistic updates and debounced autosave. */
export function useJournal(initial: Journal) {
  const [chapters, setChapters] = useState<Chapter[]>(initial.chapters);
  const [days, setDays] = useState<Record<string, Day>>(() => Object.fromEntries(initial.days.map((d) => [d.date, d])));
  const [tasks, setTasks] = useState<Task[]>(initial.tasks);
  const [letter, setLetterState] = useState(initial.user.letter);
  const [status, setStatus] = useState<SaveStatus>("idle");

  const inflight = useRef(0);
  const timers = useRef(new Map<string, { t: ReturnType<typeof setTimeout>; fn: () => void }>());

  const run = useCallback(async (p: () => Promise<unknown>, rethrow = false) => {
    inflight.current++;
    setStatus("saving");
    try {
      await p();
      inflight.current--;
      if (inflight.current === 0 && timers.current.size === 0) setStatus("saved");
    } catch (e) {
      inflight.current--;
      console.error(e);
      setStatus("error");
      if (rethrow) throw e;
    }
  }, []);

  const debounce = useCallback(
    (key: string, fn: () => Promise<unknown>, ms = 700) => {
      const existing = timers.current.get(key);
      if (existing) clearTimeout(existing.t);
      setStatus("saving");
      const fire = () => {
        timers.current.delete(key);
        run(fn);
      };
      timers.current.set(key, { t: setTimeout(fire, ms), fn: fire });
    },
    [run],
  );

  // Save anything pending when the tab is hidden or closed.
  useEffect(() => {
    const flush = () => {
      for (const { t, fn } of [...timers.current.values()]) {
        clearTimeout(t);
        fn();
      }
    };
    const onHide = () => document.visibilityState === "hidden" && flush();
    document.addEventListener("visibilitychange", onHide);
    window.addEventListener("pagehide", flush);
    return () => {
      document.removeEventListener("visibilitychange", onHide);
      window.removeEventListener("pagehide", flush);
    };
  }, []);

  const sortedChapters = useMemo(
    () => [...chapters].sort((a, b) => (a.start_date === b.start_date ? 0 : a.start_date < b.start_date ? -1 : 1)),
    [chapters],
  );

  const tasksByDate = useMemo(() => {
    const map: Record<string, Task[]> = {};
    for (const t of tasks) (map[t.date] ??= []).push(t);
    for (const list of Object.values(map)) list.sort((a, b) => a.position - b.position);
    return map;
  }, [tasks]);

  const api = {
    setLetter(text: string) {
      setLetterState(text);
      debounce("letter", () => actions.updateLetter(text), 900);
    },

    setDayField(date: string, field: DayField, value: string) {
      setDays((d) => ({ ...d, [date]: { ...(d[date] ?? EMPTY_DAY(date)), [field]: value } }));
      debounce(`day:${date}:${field}`, () => actions.saveDay(date, { [field]: value }));
    },

    addTask(date: string, text: string) {
      const list = tasksByDate[date] ?? [];
      const task: Task = { id: crypto.randomUUID(), date, text, done: false, position: (list.at(-1)?.position ?? -1) + 1 };
      setTasks((t) => [...t, task]);
      run(() => actions.addTask(task));
    },
    toggleTask(id: string) {
      const task = tasks.find((t) => t.id === id);
      if (!task) return;
      setTasks((ts) => ts.map((t) => (t.id === id ? { ...t, done: !t.done } : t)));
      run(() => actions.updateTask(id, { done: !task.done }));
    },
    editTask(id: string, text: string) {
      setTasks((ts) => ts.map((t) => (t.id === id ? { ...t, text } : t)));
      debounce(`task:${id}`, () => actions.updateTask(id, { text }));
    },
    removeTask(id: string) {
      setTasks((ts) => ts.filter((t) => t.id !== id));
      const pending = timers.current.get(`task:${id}`);
      if (pending) {
        clearTimeout(pending.t);
        timers.current.delete(`task:${id}`);
      }
      run(() => actions.deleteTask(id));
    },

    toggleGoal(goal: Goal, today: string) {
      const done = !goal.done;
      const done_at = done ? today : null;
      setChapters((cs) =>
        cs.map((c) => (c.id === goal.chapter_id ? { ...c, goals: c.goals.map((g) => (g.id === goal.id ? { ...g, done, done_at } : g)) } : c)),
      );
      run(() => actions.updateGoal(goal.id, { done, done_at }));
    },
    addGoal(chapterId: string, text: string) {
      const chapter = chapters.find((c) => c.id === chapterId);
      const goal: Goal = {
        id: crypto.randomUUID(),
        chapter_id: chapterId,
        text,
        done: false,
        done_at: null,
        position: (chapter?.goals.at(-1)?.position ?? -1) + 1,
      };
      setChapters((cs) => cs.map((c) => (c.id === chapterId ? { ...c, goals: [...c.goals, goal] } : c)));
      run(() => actions.addGoal(goal));
    },
    editGoal(goal: Goal, text: string) {
      setChapters((cs) =>
        cs.map((c) => (c.id === goal.chapter_id ? { ...c, goals: c.goals.map((g) => (g.id === goal.id ? { ...g, text } : g)) } : c)),
      );
      debounce(`goal:${goal.id}`, () => actions.updateGoal(goal.id, { text }));
    },
    removeGoal(goal: Goal) {
      setChapters((cs) => cs.map((c) => (c.id === goal.chapter_id ? { ...c, goals: c.goals.filter((g) => g.id !== goal.id) } : c)));
      run(() => actions.deleteGoal(goal.id));
    },

    async createChapter(draft: ChapterDraft) {
      const id = crypto.randomUUID();
      const goals = draft.goals.filter((g) => g.text.trim());
      await run(() => actions.createChapter({ ...draft, id, goals }), true);
      setChapters((cs) => [
        ...cs,
        {
          id,
          title: draft.title,
          label: draft.label,
          motto: draft.motto,
          cover_image: draft.cover_image,
          start_date: draft.start_date,
          end_date: draft.end_date,
          goals: goals.map((g, i) => ({ id: g.id, chapter_id: id, text: g.text, done: false, done_at: null, position: i })),
        },
      ]);
      return id;
    },
    async updateChapter(id: string, draft: Omit<ChapterDraft, "goals">) {
      await run(() => actions.updateChapter(id, draft), true);
      setChapters((cs) => cs.map((c) => (c.id === id ? { ...c, ...draft } : c)));
    },
    async deleteChapter(id: string) {
      await run(() => actions.deleteChapter(id), true);
      setChapters((cs) => cs.filter((c) => c.id !== id));
    },
  };

  return { chapters: sortedChapters, days, tasksByDate, letter, status, ...api };
}

export type JournalApi = ReturnType<typeof useJournal>;
