"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import clsx from "clsx";
import { AlertCircle, Check, Loader2, Plus, X } from "lucide-react";
import { Calendar } from "@/components/Calendar";
import { addDays, ageOn, diffDays, formatFeed, lastBirthday, localToday, nextBirthday } from "@/lib/dates";
import type { Goal, Review, Task, User } from "@/lib/types";
import { useTasks } from "./useTasks";
import { YearReview, type FinishedChapter } from "./YearReview";

const CHUNK = 21;

export function Feed({
  user,
  tasks: initialTasks,
  goals: initialGoals,
  reviews,
}: {
  user: User;
  tasks: Task[];
  goals: Goal[];
  reviews: Review[];
}) {
  const t = useTasks(initialTasks, initialGoals);
  const [today, setToday] = useState("");
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- the local date is only known in the browser
    setToday(localToday());
  }, []);

  // The current chapter only: it starts on your last birthday (or the day you
  // joined, whichever is later) and ends the day before your next birthday.
  const chapter = useMemo(() => {
    if (!today) return null;
    const joined = user.created_at.slice(0, 10);
    if (!user.birthday) return { start: joined, end: addDays(today, 365), year: null as number | null };
    const birthdayStart = lastBirthday(user.birthday, today);
    return {
      start: birthdayStart > joined ? birthdayStart : joined,
      end: addDays(nextBirthday(user.birthday, today), -1),
      year: ageOn(user.birthday, today),
    };
  }, [today, user.birthday, user.created_at]);

  // The chapter that just closed, if this isn't your first year here.
  const finished = useMemo<FinishedChapter | null>(() => {
    if (!chapter || !user.birthday) return null;
    const joined = user.created_at.slice(0, 10);
    const end = addDays(chapter.start, -1);
    if (end < joined) return null;
    const start = lastBirthday(user.birthday, end);
    return { start: start > joined ? start : joined, end, year: ageOn(user.birthday, end) };
  }, [chapter, user.birthday, user.created_at]);

  const [to, setTo] = useState("");
  const [selected, setSelected] = useState("");
  useEffect(() => {
    if (!chapter || to) return;
    const end = addDays(today, CHUNK);
    // eslint-disable-next-line react-hooks/set-state-in-effect -- seed the window once today is known
    setTo(end < chapter.end ? end : chapter.end);
    setSelected(today);
  }, [chapter, to, today]);

  const days = useMemo(() => {
    if (!chapter || !to) return [];
    const list: string[] = [];
    for (let d = chapter.start; d <= to; d = addDays(d, 1)) list.push(d);
    return list;
  }, [chapter, to]);

  const atEnd = Boolean(chapter && to >= chapter.end);
  const later = useCallback(() => {
    if (!chapter) return;
    setTo((prev) => {
      const next = addDays(prev, CHUNK);
      return next < chapter.end ? next : chapter.end;
    });
  }, [chapter]);

  const bottom = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!bottom.current || atEnd) return;
    const observer = new IntersectionObserver((entries) => entries.some((e) => e.isIntersecting) && later(), { rootMargin: "400px" });
    observer.observe(bottom.current);
    return () => observer.disconnect();
  }, [later, atEnd]);

  const jumpTo = useCallback(
    (date: string) => {
      setSelected(date);
      setTo((prev) => (date > prev ? date : prev));
      requestAnimationFrame(() =>
        requestAnimationFrame(() => document.getElementById(`day-${date}`)?.scrollIntoView({ block: "start", behavior: "smooth" })),
      );
    },
    [],
  );

  // Land on today the first time the feed renders — unless the chapter has only
  // just begun, in which case the top of the list already shows today.
  const landed = useRef(false);
  useEffect(() => {
    if (landed.current || !today || !days.length || !chapter) return;
    landed.current = true;
    if (diffDays(chapter.start, today) <= 3) return;
    document.getElementById(`day-${today}`)?.scrollIntoView({ block: "start" });
  }, [today, days, chapter]);

  if (!chapter || !today || !to) return <div className="h-dvh" />;

  const goals = t.goals.filter((g) => g.chapter_start === chapter.start);
  const countFor = (goalId: string) => {
    const linked = t.tasks.filter((task) => task.goal_id === goalId);
    return { done: linked.filter((task) => task.done).length, total: linked.length };
  };

  const next = user.birthday ? nextBirthday(user.birthday, today) : null;
  const daysLeft = next ? diffDays(today, next) : null;
  const turning = user.birthday && next ? ageOn(user.birthday, next) : null;

  return (
    <div className="mx-auto max-w-xl px-5 pb-32">
      <header className="sticky top-0 z-30 -mx-5 border-b border-line bg-bg/90 px-5 pb-4 pt-4 backdrop-blur">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            {daysLeft != null && turning != null ? (
              <h1 className="text-[clamp(20px,4.4vw,28px)] font-medium leading-tight">
                {daysLeft === 0 ? (
                  <>You are {turning} today</>
                ) : (
                  <>
                    <span className="text-orange">{daysLeft}</span> {daysLeft === 1 ? "day" : "days"} left to become {turning}
                  </>
                )}
              </h1>
            ) : (
              <h1 className="text-xl font-medium">Add your birthday in your profile</h1>
            )}
            <p className="mt-1 text-sm text-ink-soft">Complete your today&apos;s task, then do whatever you want.</p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <SaveDot status={t.status} />
            <Calendar
              today={today}
              selected={selected}
              min={chapter.start}
              max={chapter.end}
              hasTasks={(d) => Boolean(t.byDate[d]?.length)}
              onPick={jumpTo}
            />
          </div>
        </div>
      </header>

      {chapter.year != null && (
        <h2 className="pb-1 pt-8 text-[clamp(26px,5.6vw,34px)] font-medium leading-none">
          {chapter.year} Year <span className="text-ink-faint">:</span>
        </h2>
      )}
      <p className="pb-2 text-xs text-ink-faint">
        {formatFeed(chapter.start)} → {formatFeed(chapter.end)}
      </p>

      {finished && (
        <YearReview
          chapter={finished}
          tasks={t.tasks}
          goals={t.goals.filter((g) => g.chapter_start === finished.start)}
          letter={reviews.find((r) => r.chapter_start === finished.start)?.letter ?? ""}
        />
      )}

      <section className="mb-6 mt-4 rounded-2xl border border-line bg-surface p-4">
        <div className="flex items-baseline justify-between">
          <h3 className="text-[15px] font-medium">Goals</h3>
          {goals.length > 0 && (
            <span className="text-xs text-ink-faint">
              {goals.filter((g) => g.done).length}/{goals.length} done
            </span>
          )}
        </div>
        <ul className="mt-2 space-y-0.5">
          {goals.map((goal) => {
            const c = countFor(goal.id);
            return (
              <li key={goal.id} className="group flex items-center gap-3">
                <button
                  role="checkbox"
                  aria-checked={goal.done}
                  aria-label={goal.text || "Goal"}
                  onClick={() => t.toggleGoal(goal.id)}
                  className={clsx(
                    "grid size-[18px] shrink-0 place-items-center rounded-full border transition",
                    goal.done ? "border-green bg-green text-bg" : "border-ink-faint hover:border-ink",
                  )}
                >
                  {goal.done && <Check className="size-3" strokeWidth={3} />}
                </button>
                <input
                  value={goal.text}
                  onChange={(e) => t.editGoal(goal.id, e.target.value)}
                  maxLength={200}
                  className={clsx("field py-1.5 text-[15px]", goal.done && "text-ink-faint line-through")}
                />
                {c.total > 0 && (
                  <span className="shrink-0 text-xs text-ink-faint">
                    {c.done}/{c.total} tasks
                  </span>
                )}
                <button
                  onClick={() => t.removeGoal(goal.id)}
                  aria-label="Delete goal"
                  className="shrink-0 opacity-0 transition group-hover:opacity-100 focus:opacity-100"
                >
                  <X className="size-4 text-ink-faint hover:text-red" />
                </button>
              </li>
            );
          })}
        </ul>
        <AddRow placeholder={goals.length ? "Add another goal" : "What do you want to achieve this year?"} onAdd={(text) => t.addGoal(text, chapter.start)} />
      </section>

      {days.map((date) => (
        <Day
          key={date}
          date={date}
          today={today}
          tasks={t.byDate[date] ?? []}
          goals={goals}
          onAdd={(text, goalId) => t.add(date, text, goalId)}
          onToggle={t.toggle}
          onEdit={t.edit}
          onRemove={t.remove}
          onSetGoal={t.setGoalOf}
          onFocus={() => setSelected(date)}
        />
      ))}

      <div ref={bottom} />
      {atEnd ? (
        <p className="py-8 text-center text-sm text-ink-faint">
          {user.birthday ? `Your ${turning}th birthday closes this chapter.` : "That's the end of the list."}
        </p>
      ) : (
        <button onClick={later} className="mx-auto mt-4 block text-xs font-medium uppercase tracking-widest text-ink-faint transition-colors hover:text-ink">
          more days
        </button>
      )}
    </div>
  );
}

function Day({
  date,
  today,
  tasks,
  goals,
  onAdd,
  onToggle,
  onEdit,
  onRemove,
  onSetGoal,
  onFocus,
}: {
  date: string;
  today: string;
  tasks: Task[];
  goals: Goal[];
  onAdd: (text: string, goalId: string | null) => void;
  onToggle: (id: string) => void;
  onEdit: (id: string, text: string) => void;
  onRemove: (id: string) => void;
  onSetGoal: (taskId: string, goalId: string | null) => void;
  onFocus: () => void;
}) {
  const isToday = date === today;
  const done = tasks.filter((x) => x.done).length;

  return (
    <section
      id={`day-${date}`}
      onFocus={onFocus}
      className={clsx(
        "scroll-mt-28 py-4",
        isToday ? "-mx-3 rounded-2xl border border-orange/40 bg-surface px-3" : "border-b border-line",
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <h3 className={clsx("text-[15px] font-medium", date > today ? "text-ink-faint" : "text-ink")}>
          {formatFeed(date)} <span className="text-ink-faint">:</span>
        </h3>
        <div className="flex items-center gap-2 text-xs">
          {tasks.length > 0 && (
            <span className={done === tasks.length ? "text-green" : "text-ink-faint"}>
              {done}/{tasks.length}
            </span>
          )}
          {isToday && <span className="rounded-full bg-orange px-2 py-0.5 text-[11px] font-semibold text-bg">Today</span>}
        </div>
      </div>

      <ul className="mt-2 space-y-0.5">
        {tasks.map((task) => (
          <li key={task.id} className="group flex items-center gap-3">
            <button
              role="checkbox"
              aria-checked={task.done}
              aria-label={task.text || "Task"}
              onClick={() => onToggle(task.id)}
              className={clsx(
                "grid size-[18px] shrink-0 place-items-center rounded-full border transition",
                task.done ? "border-green bg-green text-bg" : "border-ink-faint hover:border-ink",
              )}
            >
              {task.done && <Check className="size-3" strokeWidth={3} />}
            </button>
            <input
              value={task.text}
              onChange={(e) => onEdit(task.id, e.target.value)}
              maxLength={300}
              className={clsx("field py-1.5 text-[15px]", task.done && "text-ink-faint line-through")}
            />
            {goals.length > 0 && <GoalPicker goals={goals} value={task.goal_id} onChange={(g) => onSetGoal(task.id, g)} />}
            <button
              onClick={() => onRemove(task.id)}
              aria-label="Delete task"
              className="shrink-0 opacity-0 transition group-hover:opacity-100 focus:opacity-100"
            >
              <X className="size-4 text-ink-faint hover:text-red" />
            </button>
          </li>
        ))}
      </ul>

      <AddTask placeholder={tasks.length ? "Add another" : "Add a task"} goals={goals} onAdd={onAdd} />
    </section>
  );
}

/** Which goal a task works towards. Plain select, no frills. */
function GoalPicker({ goals, value, onChange }: { goals: Goal[]; value: string | null; onChange: (goalId: string | null) => void }) {
  return (
    <select
      value={value ?? ""}
      onChange={(e) => onChange(e.target.value || null)}
      aria-label="Goal this task works towards"
      title="Goal this task works towards"
      className={clsx(
        "max-w-[40%] shrink-0 cursor-pointer rounded-full border px-2 py-0.5 text-xs outline-none transition",
        value ? "border-orange/50 text-orange" : "border-line text-ink-faint hover:text-ink",
      )}
    >
      <option value="">no goal</option>
      {goals.map((g) => (
        <option key={g.id} value={g.id}>
          {g.text || "untitled goal"}
        </option>
      ))}
    </select>
  );
}

function AddTask({ placeholder, goals, onAdd }: { placeholder: string; goals: Goal[]; onAdd: (text: string, goalId: string | null) => void }) {
  const [draft, setDraft] = useState("");
  const [goalId, setGoalId] = useState<string | null>(null);
  const commit = () => {
    const text = draft.trim();
    if (!text) return;
    onAdd(text, goalId);
    setDraft("");
  };
  return (
    <div className="mt-0.5 flex items-center gap-3">
      <Plus className="size-[18px] shrink-0 text-ink-faint" />
      <input
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.nativeEvent.isComposing) {
            e.preventDefault();
            commit();
          }
        }}
        onBlur={commit}
        enterKeyHint="done"
        placeholder={placeholder}
        maxLength={300}
        className="field py-1.5 text-[15px]"
      />
      {goals.length > 0 && <GoalPicker goals={goals} value={goalId} onChange={setGoalId} />}
    </div>
  );
}

function AddRow({ placeholder, onAdd }: { placeholder: string; onAdd: (text: string) => void }) {
  const [draft, setDraft] = useState("");
  const commit = () => {
    const text = draft.trim();
    if (!text) return;
    onAdd(text);
    setDraft("");
  };
  return (
    <div className="mt-0.5 flex items-center gap-3">
      <Plus className="size-[18px] shrink-0 text-ink-faint" />
      <input
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.nativeEvent.isComposing) {
            e.preventDefault();
            commit();
          }
        }}
        onBlur={commit}
        enterKeyHint="done"
        placeholder={placeholder}
        maxLength={200}
        className="field py-1.5 text-[15px]"
      />
    </div>
  );
}

function SaveDot({ status }: { status: ReturnType<typeof useTasks>["status"] }) {
  if (status === "idle") return null;
  return (
    <span className="flex items-center gap-1 text-xs text-ink-faint" aria-live="polite">
      {status === "saving" && <Loader2 className="size-3.5 animate-spin" />}
      {status === "saved" && <Check className="size-3.5 text-green" />}
      {status === "error" && (
        <span className="flex items-center gap-1 text-red">
          <AlertCircle className="size-3.5" /> not saved
        </span>
      )}
    </span>
  );
}
