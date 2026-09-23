"use client";

import { useEffect, useMemo, useState } from "react";
import clsx from "clsx";
import { AlertCircle, ArrowLeft, Check, Loader2, Plus, X } from "lucide-react";
import { Calendar } from "@/components/Calendar";
import { addDays, ageOn, diffDays, formatFeed, lastBirthday, localToday, nextBirthday } from "@/lib/dates";
import type { Goal, Review, Task, User } from "@/lib/types";
import { useTasks } from "./useTasks";
import { YearReview, type FinishedChapter } from "./YearReview";

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

  // The current chapter: it starts on your last birthday (or the day you joined,
  // whichever is later) and ends the day before your next birthday.
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

  // Only one day is on screen: today, unless you look back with the calendar.
  const [viewing, setViewing] = useState("");
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- start on today once it is known
    if (today && !viewing) setViewing(today);
  }, [today, viewing]);

  if (!chapter || !today || !viewing) return <div className="h-dvh" />;

  const next = user.birthday ? nextBirthday(user.birthday, today) : null;
  const daysLeft = next ? diffDays(today, next) : null;
  const turning = user.birthday && next ? ageOn(user.birthday, next) : null;

  const goals = t.goals.filter((g) => g.chapter_start === chapter.start);
  const countFor = (goalId: string) => {
    const linked = t.tasks.filter((task) => task.goal_id === goalId);
    return { done: linked.filter((task) => task.done).length, total: linked.length };
  };

  const isToday = viewing === today;

  return (
    <div className="mx-auto max-w-xl px-5 pb-24">
      <header className="border-b border-line pb-4">
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
            {/* Look back at an earlier day. Days ahead stay out of reach. */}
            <Calendar
              today={today}
              selected={viewing}
              min={chapter.start}
              max={today}
              hasTasks={(d) => Boolean(t.byDate[d]?.length)}
              onPick={setViewing}
            />
          </div>
        </div>
      </header>

      {finished && (
        <YearReview
          chapter={finished}
          tasks={t.tasks}
          goals={t.goals.filter((g) => g.chapter_start === finished.start)}
          letter={reviews.find((r) => r.chapter_start === finished.start)?.letter ?? ""}
        />
      )}

      {chapter.year != null && (
        <h2 className="pb-1 pt-8 text-[clamp(26px,5.6vw,34px)] font-medium leading-none">
          {chapter.year} Year <span className="text-ink-faint">:</span>
        </h2>
      )}
      <p className="pb-2 text-xs text-ink-faint">
        {formatFeed(chapter.start)} → {formatFeed(chapter.end)}
      </p>

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
        <AddRow
          placeholder={goals.length ? "Add another goal" : "What do you want to achieve this year?"}
          onAdd={(text) => t.addGoal(text, chapter.start)}
        />
      </section>

      {!isToday && (
        <button
          onClick={() => setViewing(today)}
          className="mb-3 inline-flex items-center gap-2 text-sm font-medium text-orange transition-colors hover:text-orange-soft"
        >
          <ArrowLeft className="size-4" /> Back to today
        </button>
      )}

      <Day
        date={viewing}
        today={today}
        tasks={t.byDate[viewing] ?? []}
        goals={goals}
        onAdd={(text, goalId) => t.add(viewing, text, goalId)}
        onToggle={t.toggle}
        onEdit={t.edit}
        onRemove={t.remove}
        onSetGoal={t.setGoalOf}
      />
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
}) {
  const isToday = date === today;
  const done = tasks.filter((x) => x.done).length;

  return (
    <section className={clsx("rounded-2xl border p-4", isToday ? "border-orange/40 bg-surface" : "border-line")}>
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-[15px] font-medium">
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
