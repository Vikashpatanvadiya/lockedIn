"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import clsx from "clsx";
import { Check, ChevronDown } from "lucide-react";
import { saveReview } from "@/app/actions/journal";
import { formatFeed } from "@/lib/dates";
import type { Goal, Task } from "@/lib/types";

export type FinishedChapter = { start: string; end: string; year: number | null };

const PROMPT = "How was the year? What did you enjoy most? What do you want to do better?";

/** The numbers for a closed chapter, plus the letter you write about it. */
export function YearReview({
  chapter,
  tasks,
  goals,
  letter: saved,
}: {
  chapter: FinishedChapter;
  tasks: Task[];
  goals: Goal[];
  letter: string;
}) {
  const inChapter = tasks.filter((t) => t.date >= chapter.start && t.date <= chapter.end);
  const tasksDone = inChapter.filter((t) => t.done).length;
  const achieved = goals.filter((g) => g.done);
  const missed = goals.filter((g) => !g.done);
  const activeDays = new Set(inChapter.filter((t) => t.done).map((t) => t.date)).size;

  const [letter, setLetter] = useState(saved);
  const [open, setOpen] = useState(!saved.trim());
  const [status, setStatus] = useState<"idle" | "saving" | "saved">("idle");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latest = useRef(saved);

  const save = useCallback(
    async (value: string) => {
      timer.current = null;
      try {
        await saveReview(chapter.start, value);
        setStatus("saved");
      } catch (e) {
        console.error(e);
        setStatus("idle");
      }
    },
    [chapter.start],
  );

  // Write the pending letter if the tab closes or this card unmounts mid-sentence.
  useEffect(() => {
    const flush = () => {
      if (!timer.current) return;
      clearTimeout(timer.current);
      timer.current = null;
      saveReview(chapter.start, latest.current).catch(console.error);
    };
    window.addEventListener("pagehide", flush);
    return () => {
      window.removeEventListener("pagehide", flush);
      flush();
    };
  }, [chapter.start]);

  function write(value: string) {
    setLetter(value);
    latest.current = value;
    setStatus("saving");
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => save(value), 900);
  }

  return (
    <section className="mt-4 rounded-2xl border border-orange/40 bg-surface p-4">
      <button onClick={() => setOpen((o) => !o)} className="flex w-full items-center justify-between gap-3 text-left">
        <div>
          <h3 className="text-[15px] font-medium">
            {chapter.year != null ? `Year ${chapter.year} is complete` : "Your year is complete"}
          </h3>
          <p className="text-xs text-ink-faint">
            {formatFeed(chapter.start)} → {formatFeed(chapter.end)}
          </p>
        </div>
        <ChevronDown className={clsx("size-5 shrink-0 text-ink-faint transition-transform", open && "rotate-180")} />
      </button>

      {open && (
        <div className="mt-4">
          <dl className="grid grid-cols-3 gap-3">
            <Stat value={inChapter.length} label="tasks added" />
            <Stat value={tasksDone} label="completed" tone="green" />
            <Stat value={`${achieved.length}/${goals.length}`} label="goals achieved" tone="orange" />
          </dl>
          <p className="mt-3 text-xs text-ink-faint">
            {inChapter.length > 0
              ? `You finished ${Math.round((tasksDone / inChapter.length) * 100)}% of what you set, across ${activeDays} ${activeDays === 1 ? "day" : "days"}.`
              : "You didn't write any tasks this year."}
          </p>

          {goals.length > 0 && (
            <div className="mt-4 space-y-1">
              {achieved.map((g) => (
                <p key={g.id} className="flex items-center gap-2 text-sm">
                  <span className="grid size-[18px] shrink-0 place-items-center rounded-full bg-green text-bg">
                    <Check className="size-3" strokeWidth={3} />
                  </span>
                  {g.text}
                </p>
              ))}
              {missed.map((g) => (
                <p key={g.id} className="flex items-center gap-2 text-sm text-ink-faint">
                  <span className="size-[18px] shrink-0 rounded-full border border-ink-faint" />
                  {g.text}
                </p>
              ))}
            </div>
          )}

          <div className="mt-5">
            <div className="flex items-baseline justify-between">
              <h4 className="text-[15px] font-medium">Letter to yourself</h4>
              <span className="text-xs text-ink-faint">
                {status === "saving" ? "saving…" : status === "saved" ? "saved" : ""}
              </span>
            </div>
            <textarea
              value={letter}
              onChange={(e) => write(e.target.value)}
              placeholder={PROMPT}
              rows={6}
              maxLength={20000}
              className="mt-2 w-full resize-y rounded-xl border border-line bg-bg px-3 py-2 text-[15px] leading-relaxed outline-none transition placeholder:text-ink-faint focus:border-orange/60"
            />
          </div>
        </div>
      )}
    </section>
  );
}

function Stat({ value, label, tone }: { value: number | string; label: string; tone?: "green" | "orange" }) {
  return (
    <div className="rounded-xl border border-line bg-bg px-3 py-2">
      <dt className={clsx("text-2xl font-medium", tone === "green" && "text-green", tone === "orange" && "text-orange")}>{value}</dt>
      <dd className="text-xs text-ink-faint">{label}</dd>
    </div>
  );
}
