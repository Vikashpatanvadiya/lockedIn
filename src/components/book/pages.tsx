"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import clsx from "clsx";
import { CalendarDays, Check, Pencil, Plus, Trash2 } from "lucide-react";
import { AutoTextarea } from "@/components/AutoTextarea";
import { Sticker } from "@/components/BookCover";
import { diffDays, formatDayMonth, formatLong, formatShort, formatWeekday } from "@/lib/dates";
import type { Chapter, Goal } from "@/lib/types";
import type { JournalApi } from "./useJournal";
import { Cloud } from "@/components/Cloud";

export type Spread =
  | { kind: "front" }
  | { kind: "chapter"; chapter: Chapter; number: number }
  | { kind: "day"; chapter: Chapter; number: number; date: string; n: number; total: number };

export type Target = { kind: "front" } | { kind: "chapter"; id: string } | { kind: "date"; date: string; chapterId?: string };

type Ctx = {
  j: JournalApi;
  today: string;
  name: string;
  go: (t: Target) => void;
  newChapter: () => void;
  editChapter: (c: Chapter) => void;
};

export const ReaderContext = createContext<Ctx | null>(null);
const useReader = () => useContext(ReaderContext)!;

export function renderPage(spread: Spread, side: "left" | "right", pageNo: number) {
  const content =
    spread.kind === "front" ? (
      side === "left" ? <LetterPage /> : <IndexPage />
    ) : spread.kind === "chapter" ? (
      side === "left" ? <ChapterPhotoPage chapter={spread.chapter} number={spread.number} /> : <ChapterGoalsPage chapter={spread.chapter} number={spread.number} />
    ) : side === "left" ? (
      <DayLeft spread={spread} />
    ) : (
      <DayRight spread={spread} />
    );
  const bleed = spread.kind === "chapter" && side === "left";
  return (
    <div className={clsx("relative flex h-full flex-col", !bleed && "paper-grain", side === "left" ? "page-left" : "page-right")}>
      <div className={clsx("scroll-thin min-h-0 flex-1 overflow-y-auto", !bleed && "px-7 pt-7 sm:px-10 sm:pt-9")}>{content}</div>
      {!bleed && (
        <p className={clsx("shrink-0 px-10 pb-4 pt-2 font-hand text-lg text-ink-faint", side === "left" ? "text-left" : "text-right")}>
          — {pageNo} —
        </p>
      )}
    </div>
  );
}

function Eyebrow({ children, className }: { children: ReactNode; className?: string }) {
  return <p className={clsx("text-[11px] font-semibold uppercase tracking-[0.18em] text-ink-faint", className)}>{children}</p>;
}

// ---------------------------------------------------------------- Front

function LetterPage() {
  const { j, name } = useReader();
  const [editing, setEditing] = useState(false);
  return (
    <div className="pb-6">
      <div className="flex items-center justify-between">
        <Eyebrow>A letter to myself</Eyebrow>
        <button
          onClick={() => setEditing((e) => !e)}
          className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium text-ink-soft hover:bg-paper-2 hover:text-ink"
        >
          {editing ? <Check className="size-3.5" /> : <Pencil className="size-3.5" />}
          {editing ? "Done" : "Edit"}
        </button>
      </div>
      <p className="mt-4 font-hand text-3xl">Dear {name.split(" ")[0]},</p>
      {editing ? (
        <AutoTextarea autoFocus value={j.letter} onChange={(e) => j.setLetter(e.target.value)} rows={10} className="mt-1" />
      ) : (
        <div className="lines mt-1 whitespace-pre-wrap text-ink/90">{j.letter || "You haven't written your letter yet. Tap Edit."}</div>
      )}
      <p className="mt-4 text-right font-hand text-2xl text-ink-soft">— {name.split(" ")[0]}</p>
    </div>
  );
}

function IndexPage() {
  const { j, today, go, newChapter } = useReader();
  // Front spread is pages 1–2; each chapter adds an opener spread plus one spread per day.
  const startPages = j.chapters.reduce<number[]>((acc, c, i) => {
    acc.push(i === 0 ? 3 : acc[i - 1] + 2 + (diffDays(j.chapters[i - 1].start_date, j.chapters[i - 1].end_date) + 1) * 2);
    return acc;
  }, []);
  return (
    <div className="pb-6">
      <Eyebrow>Contents</Eyebrow>
      <h2 className="mt-2 font-display text-4xl font-semibold tracking-[-0.02em]">Index</h2>
      <ol className="mt-6 space-y-5">
        {j.chapters.map((c, i) => {
          const total = diffDays(c.start_date, c.end_date) + 1;
          const startPage = startPages[i];
          const current = today >= c.start_date && today <= c.end_date;
          const elapsed = Math.max(0, Math.min(total, diffDays(c.start_date, today) + 1));
          const goalsDone = c.goals.filter((g) => g.done).length;
          return (
            <li key={c.id}>
              <button onClick={() => go({ kind: "chapter", id: c.id })} className="group block w-full text-left">
                <div className="flex items-baseline gap-2">
                  <span className="font-hand text-xl text-orange">{i + 1}.</span>
                  <span className="font-display text-xl font-medium group-hover:underline group-hover:decoration-orange/50 group-hover:underline-offset-4">
                    {c.title}
                  </span>
                  <span className="mx-1 flex-1 translate-y-[-4px] border-b-2 border-dotted border-ink/15" />
                  <span className="font-hand text-xl text-ink-soft">p. {startPage}</span>
                </div>
                <p className="mt-0.5 pl-6 text-sm text-ink-soft">
                  {formatShort(c.start_date)} → {formatShort(c.end_date)} · {total} pages · {goalsDone}/{c.goals.length} goals
                </p>
                <div className="ml-6 mt-2 h-1.5 overflow-hidden rounded-full bg-line">
                  <div className="h-full rounded-full bg-kraft" style={{ width: `${(elapsed / total) * 100}%` }} />
                </div>
              </button>
              {current && (
                <button
                  onClick={() => go({ kind: "date", date: today, chapterId: c.id })}
                  className="ml-6 mt-2 inline-flex items-center gap-1.5 rounded-full bg-sun px-3 py-1 text-xs font-semibold"
                >
                  Today · Day {elapsed} →
                </button>
              )}
            </li>
          );
        })}
      </ol>
      <button
        onClick={newChapter}
        className="mt-8 inline-flex items-center gap-2 rounded-full border border-dashed border-kraft/50 px-4 py-2 text-sm font-medium text-kraft-dark hover:bg-white"
      >
        <Plus className="size-4" /> Start a new chapter
      </button>
    </div>
  );
}

// ---------------------------------------------------------------- Chapter opener

function ChapterPhotoPage({ chapter, number }: { chapter: Chapter; number: number }) {
  return (
    <div className="relative h-full min-h-[420px] overflow-hidden bg-kraft">
      {chapter.cover_image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={chapter.cover_image} alt="" className="absolute inset-0 size-full object-cover" />
      ) : (
        <div className="sky absolute inset-0">
          <Cloud className="left-[-14%] top-[52%] w-[80%]" />
          <Cloud variant={1} className="right-[-20%] top-[22%] w-[70%]" />
          <Sticker kind="sun" className="!size-16 left-[14%] top-[14%]" />
        </div>
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-ink/55 via-transparent to-transparent" />
      <div className="absolute left-6 top-6 rotate-[-4deg] rounded-md bg-sun/95 px-4 py-1.5 font-hand text-2xl shadow-md">Chapter {number}</div>
      {chapter.motto && (
        <p className="absolute inset-x-8 bottom-10 font-serif text-[clamp(22px,2.4vw,30px)] italic leading-snug text-white drop-shadow">
          &ldquo;{chapter.motto}&rdquo;
        </p>
      )}
    </div>
  );
}

function ChapterGoalsPage({ chapter, number }: { chapter: Chapter; number: number }) {
  const { j, today, go, editChapter } = useReader();
  const total = diffDays(chapter.start_date, chapter.end_date) + 1;
  const done = chapter.goals.filter((g) => g.done).length;
  const inRange = today >= chapter.start_date && today <= chapter.end_date;
  return (
    <div className="pb-6">
      <div className="flex items-center justify-between">
        <Eyebrow>
          Chapter {number}
          {chapter.label && ` · ${chapter.label}`}
        </Eyebrow>
        <button
          onClick={() => editChapter(chapter)}
          className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium text-ink-soft hover:bg-paper-2 hover:text-ink"
        >
          <Pencil className="size-3.5" /> Edit
        </button>
      </div>
      <h2 className="mt-2 font-display text-[40px] font-semibold leading-[1.02] tracking-[-0.02em]">{chapter.title}</h2>
      <p className="mt-2 text-sm text-ink-soft">
        {formatLong(chapter.start_date)} → {formatLong(chapter.end_date)} · <span className="font-hand text-lg text-ink">{total} pages</span>
      </p>

      <div className="mt-7 flex items-baseline justify-between">
        <p className="font-hand text-2xl text-orange">What I want to achieve</p>
        <span className="text-xs font-medium text-ink-soft">
          {done}/{chapter.goals.length} done
        </span>
      </div>
      <ul className="mt-2 space-y-1">
        {chapter.goals.map((g) => (
          <GoalRow key={g.id} goal={g} />
        ))}
      </ul>
      <div className="mt-2 flex items-center gap-3 pl-1">
        <Plus className="size-4 text-ink-faint" />
        <AddInput placeholder="Add a goal…" maxLength={200} onAdd={(text) => j.addGoal(chapter.id, text)} className="text-[22px]" />
      </div>

      {inRange && (
        <button onClick={() => go({ kind: "date", date: today, chapterId: chapter.id })} className="mt-8 inline-flex items-center gap-2 rounded-full bg-ink px-5 py-2.5 text-sm font-medium text-paper hover:bg-black">
          Go to today&apos;s page →
        </button>
      )}
    </div>
  );
}

function GoalRow({ goal }: { goal: Goal }) {
  const { j, today } = useReader();
  return (
    <li className="group flex items-start gap-3">
      <Checkbox checked={goal.done} onChange={() => j.toggleGoal(goal, today)} tone="forest" label={goal.text} />
      <input
        value={goal.text}
        onChange={(e) => j.editGoal(goal, e.target.value)}
        className={clsx("field font-hand text-[23px] leading-8", goal.done && "text-ink-faint line-through decoration-forest/50")}
        maxLength={200}
      />
      <button onClick={() => j.removeGoal(goal)} aria-label="Delete goal" className="mt-1.5 opacity-0 transition group-hover:opacity-100 focus:opacity-100">
        <Trash2 className="size-4 text-ink-faint hover:text-orange" />
      </button>
    </li>
  );
}

/** Text input that adds an item on Enter and clears itself. */
function AddInput({ onAdd, className, ...props }: { onAdd: (text: string) => void; placeholder: string; maxLength: number; className?: string }) {
  const [draft, setDraft] = useState("");
  const commit = () => {
    const text = draft.trim();
    if (!text) return;
    onAdd(text);
    setDraft("");
  };
  return (
    <input
      {...props}
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
      className={clsx("field font-hand", className)}
    />
  );
}

function Checkbox({ checked, onChange, tone = "orange", label }: { checked: boolean; onChange: () => void; tone?: "orange" | "forest"; label: string }) {
  return (
    <button
      role="checkbox"
      aria-checked={checked}
      aria-label={label || "Task"}
      onClick={onChange}
      className={clsx(
        "mt-[7px] grid size-[18px] shrink-0 place-items-center rounded-[6px] border-2 transition",
        checked ? (tone === "orange" ? "border-orange bg-orange text-white" : "border-forest bg-forest text-white") : "border-ink/25 hover:border-ink/50",
      )}
    >
      {checked && <Check className="size-3" strokeWidth={3.5} />}
    </button>
  );
}

// ---------------------------------------------------------------- Day pages

type DaySpread = Extract<Spread, { kind: "day" }>;

function DayLeft({ spread }: { spread: DaySpread }) {
  const { j, today, go } = useReader();
  const { date, chapter, n, total } = spread;
  const day = j.days[date];
  const tasks = j.tasksByDate[date] ?? [];
  const isToday = date === today;

  return (
    <div className="pb-4">
      <div className="flex items-center justify-between gap-3">
        <Eyebrow>
          {chapter.label || chapter.title} · Day {n}/{total}
        </Eyebrow>
        {isToday ? (
          <span className="rounded-full bg-sun px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider">Today</span>
        ) : date > today ? (
          <span className="rounded-full bg-periwinkle/60 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider">Plan ahead</span>
        ) : null}
      </div>

      <label className="group relative mt-3 flex w-fit cursor-pointer items-center gap-2">
        <span className="font-display text-[28px] font-semibold leading-tight tracking-[-0.01em]">
          {formatWeekday(date)}, <span className="font-serif font-normal italic">{formatDayMonth(date)}</span>
        </span>
        <CalendarDays className="size-5 text-ink-faint group-hover:text-ink" />
        <input
          type="date"
          aria-label="Jump to a date"
          value={date}
          min={chapter.start_date}
          max={chapter.end_date}
          onChange={(e) => e.target.value && go({ kind: "date", date: e.target.value, chapterId: chapter.id })}
          className="absolute inset-0 cursor-pointer opacity-0"
        />
      </label>

      <p className="mt-6 font-hand text-2xl text-orange">Today&apos;s thought</p>
      <AutoTextarea
        value={day?.thought ?? ""}
        onChange={(e) => j.setDayField(date, "thought", e.target.value)}
        placeholder="What's on your mind this morning?"
        rows={2}
        maxLength={5000}
      />

      <div className="mt-6 flex items-baseline justify-between">
        <p className="font-hand text-2xl text-orange">Today&apos;s tasks</p>
        {tasks.length > 0 && (
          <span className="text-xs font-medium text-ink-soft">
            {tasks.filter((t) => t.done).length}/{tasks.length} done
          </span>
        )}
      </div>
      <ul className="mt-1">
        {tasks.map((t) => (
          <li key={t.id} className="group flex items-start gap-3">
            <Checkbox checked={t.done} onChange={() => j.toggleTask(t.id)} label={t.text} />
            <input
              value={t.text}
              onChange={(e) => j.editTask(t.id, e.target.value)}
              className={clsx("field font-hand text-[23px] leading-8", t.done && "text-ink-faint line-through decoration-orange/60")}
              maxLength={300}
            />
            <button onClick={() => j.removeTask(t.id)} aria-label="Delete task" className="mt-1.5 opacity-0 transition group-hover:opacity-100 focus:opacity-100">
              <Trash2 className="size-4 text-ink-faint hover:text-orange" />
            </button>
          </li>
        ))}
      </ul>
      <div className="flex items-center gap-3">
        <Plus className="size-[18px] shrink-0 text-ink-faint" />
        <AddInput
          placeholder={tasks.length ? "Add another…" : "Add a task and press Enter"}
          maxLength={300}
          onAdd={(text) => j.addTask(date, text)}
          className="text-[23px] leading-8"
        />
      </div>
    </div>
  );
}

function DayRight({ spread }: { spread: DaySpread }) {
  const { j } = useReader();
  const { date } = spread;
  const day = j.days[date];
  return (
    <div className="pb-4">
      <p className="font-hand text-2xl text-orange">Do whatever you like</p>
      <p className="text-xs text-ink-faint">Friends, games, a walk, a doodle in words. It all counts.</p>
      <AutoTextarea
        value={day?.free_notes ?? ""}
        onChange={(e) => j.setDayField(date, "free_notes", e.target.value)}
        placeholder="Anything goes here…"
        rows={3}
        maxLength={20000}
        className="mt-1"
      />

      <p className="mt-6 font-hand text-2xl text-orange">End of the day</p>
      <AutoTextarea
        value={day?.summary ?? ""}
        onChange={(e) => j.setDayField(date, "summary", e.target.value)}
        placeholder="What went well? What will you do differently tomorrow?"
        rows={3}
        maxLength={10000}
      />

    </div>
  );
}
