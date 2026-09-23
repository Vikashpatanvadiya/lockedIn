"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as actions from "@/app/actions/journal";
import type { Goal, Task } from "@/lib/types";

export type SaveStatus = "idle" | "saving" | "saved" | "error";

/** Tasks and goals with optimistic updates and debounced autosave. */
export function useTasks(initial: Task[], initialGoals: Goal[]) {
  const [tasks, setTasks] = useState(initial);
  const [goals, setGoals] = useState(initialGoals);
  const [status, setStatus] = useState<SaveStatus>("idle");
  const inflight = useRef(0);
  const timers = useRef(new Map<string, { t: ReturnType<typeof setTimeout>; fn: () => void }>());

  const run = useCallback(async (p: () => Promise<unknown>) => {
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

  // Save anything still pending when the tab is hidden or closed.
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

  const byDate = useMemo(() => {
    const map: Record<string, Task[]> = {};
    for (const t of tasks) (map[t.date] ??= []).push(t);
    for (const list of Object.values(map)) list.sort((a, b) => a.position - b.position);
    return map;
  }, [tasks]);

  return {
    byDate,
    goals,
    tasks,
    status,
    add(date: string, text: string, goalId: string | null) {
      const list = byDate[date] ?? [];
      const task: Task = {
        id: crypto.randomUUID(),
        date,
        text,
        done: false,
        position: (list.at(-1)?.position ?? -1) + 1,
        goal_id: goalId,
      };
      setTasks((t) => [...t, task]);
      run(() => actions.addTask(task));
    },
    setGoalOf(taskId: string, goalId: string | null) {
      setTasks((ts) => ts.map((t) => (t.id === taskId ? { ...t, goal_id: goalId } : t)));
      run(() => actions.setTaskGoal(taskId, goalId));
    },
    addGoal(text: string, chapterStart: string) {
      const goal: Goal = {
        id: crypto.randomUUID(),
        text,
        done: false,
        chapter_start: chapterStart,
        position: (goals.at(-1)?.position ?? -1) + 1,
      };
      setGoals((g) => [...g, goal]);
      run(() => actions.addGoal({ id: goal.id, text, chapter_start: chapterStart, position: goal.position }));
    },
    toggleGoal(id: string) {
      const goal = goals.find((g) => g.id === id);
      if (!goal) return;
      setGoals((gs) => gs.map((g) => (g.id === id ? { ...g, done: !g.done } : g)));
      run(() => actions.updateGoal(id, { done: !goal.done }));
    },
    editGoal(id: string, text: string) {
      setGoals((gs) => gs.map((g) => (g.id === id ? { ...g, text } : g)));
      debounce(`goal:${id}`, () => actions.updateGoal(id, { text }));
    },
    removeGoal(id: string) {
      setGoals((gs) => gs.filter((g) => g.id !== id));
      setTasks((ts) => ts.map((t) => (t.goal_id === id ? { ...t, goal_id: null } : t)));
      run(() => actions.deleteGoal(id));
    },
    toggle(id: string) {
      const task = tasks.find((t) => t.id === id);
      if (!task) return;
      setTasks((ts) => ts.map((t) => (t.id === id ? { ...t, done: !t.done } : t)));
      run(() => actions.updateTask(id, { done: !task.done }));
    },
    edit(id: string, text: string) {
      setTasks((ts) => ts.map((t) => (t.id === id ? { ...t, text } : t)));
      debounce(`task:${id}`, () => actions.updateTask(id, { text }));
    },
    remove(id: string) {
      setTasks((ts) => ts.filter((t) => t.id !== id));
      const pending = timers.current.get(`task:${id}`);
      if (pending) {
        clearTimeout(pending.t);
        timers.current.delete(`task:${id}`);
      }
      run(() => actions.deleteTask(id));
    },
  };
}
