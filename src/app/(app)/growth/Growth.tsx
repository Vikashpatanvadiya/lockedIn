"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import clsx from "clsx";
import { Flame, Target, CheckCircle2, PenLine } from "lucide-react";
import { addDays, diffDays, formatDayMonth, formatMonth, formatShort, localToday } from "@/lib/dates";
import { heatLevel, summarize, weekly, type DayStat } from "@/lib/stats";
import type { Chapter, Day, Task } from "@/lib/types";

// Single-hue sequential ramp (light → dark orange); level 0 is the empty paper tone.
const HEAT = ["#efe8dc", "#f9d9b8", "#f5ad76", "#e8662c", "#a9431a"];

export function Growth({ chapters, tasks, days }: { chapters: Chapter[]; tasks: Task[]; days: Day[] }) {
  const [today, setToday] = useState("");
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- the local date is only known in the browser
    setToday(localToday());
  }, []);

  const s = useMemo(() => (today ? summarize(chapters, tasks, days, today) : null), [chapters, tasks, days, today]);
  const [range, setRange] = useState<string>("current");

  if (!s) return <div className="h-96" />;

  const selected =
    range === "year"
      ? { start: addDays(today, -364), end: today, title: "Last 12 months" }
      : (() => {
          const c = chapters.find((x) => x.id === range) ?? s.chapter;
          return c ? { start: c.start_date, end: c.end_date, title: c.title } : { start: addDays(today, -364), end: today, title: "Last 12 months" };
        })();

  const weeks = weekly(s.stats, today);
  const chapterIndex = s.chapter ? chapters.indexOf(s.chapter) : -1;

  return (
    <div className="mx-auto max-w-[1180px] px-4 pb-20 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-6 pt-6">
        <div>
          <p className="font-hand text-2xl text-orange">growth, not grind</p>
          <h1 className="font-display text-[clamp(36px,5vw,56px)] font-semibold leading-none tracking-[-0.02em]">
            How far you&apos;ve <em className="font-serif font-normal">come</em>
          </h1>
        </div>
        {s.chapter && (
          <p className="max-w-sm text-ink-soft">
            Chapter {chapterIndex + 1}, <span className="font-medium text-ink">{s.chapter.title}</span>:{" "}
            {Math.min(diffDays(s.chapter.start_date, today) + 1, diffDays(s.chapter.start_date, s.chapter.end_date) + 1)} of{" "}
            {diffDays(s.chapter.start_date, s.chapter.end_date) + 1} days.
          </p>
        )}
      </div>

      {/* Headline numbers */}
      <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-[1.3fr_1fr_1fr_1fr]">
        <div className="relative overflow-hidden rounded-[24px] bg-ink p-6 text-paper">
          <span className="absolute -right-10 -top-10 size-40 rounded-full bg-orange/30 blur-3xl" />
          <p className="relative text-xs font-semibold uppercase tracking-widest text-paper/60">Growth index</p>
          <p className="relative mt-2 font-display text-6xl font-semibold tracking-[-0.03em]">
            {s.growth}
            <span className="text-2xl text-paper/40">/100</span>
          </p>
          <p className="relative mt-2 text-sm text-paper/70">50% tasks · 30% goals · 20% showing up</p>
        </div>
        <Tile icon={<Flame className="size-4" />} label="Current streak" value={`${s.current}`} unit={s.current === 1 ? "day" : "days"} note={`Longest: ${s.longest}`} tone="bg-sun" />
        <Tile
          icon={<CheckCircle2 className="size-4" />}
          label="Tasks completed"
          value={`${Math.round(s.taskRate * 100)}%`}
          note={`${s.tasksDone} of ${s.tasksPlanned} so far`}
          tone="bg-periwinkle"
        />
        <Tile icon={<Target className="size-4" />} label="Goals achieved" value={`${s.goalsDone}/${s.goalsTotal}`} note={`${Math.round(s.goalRate * 100)}% of all goals`} tone="bg-[#cfe9c8]" />
      </div>

      {/* Heatmap */}
      <section className="mt-4 rounded-[24px] bg-page p-6 ring-1 ring-line sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-2xl font-semibold tracking-[-0.01em]">Your days, in colour</h2>
            <p className="text-sm text-ink-soft">The more tasks you finish in a day, the warmer it gets. Tap a day to open its page.</p>
          </div>
          <select
            value={range}
            onChange={(e) => setRange(e.target.value)}
            aria-label="Date range"
            className="h-10 rounded-full border border-line bg-paper px-4 text-sm font-medium outline-none"
          >
            <option value="current">{s.chapter ? `This chapter (${s.chapter.title})` : "This chapter"}</option>
            {chapters
              .filter((c) => c.id !== s.chapter?.id)
              .map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title}
                </option>
              ))}
            <option value="year">Last 12 months</option>
          </select>
        </div>
        <Heatmap start={selected.start} end={selected.end} stats={s.stats} today={today} />
      </section>

      <div className="mt-4 grid gap-4 lg:grid-cols-[1.2fr_1fr]">
        {/* Weekly completion */}
        <section className="rounded-[24px] bg-page p-6 ring-1 ring-line sm:p-8">
          <h2 className="font-display text-2xl font-semibold tracking-[-0.01em]">Weekly task completion</h2>
          <p className="text-sm text-ink-soft">Share of planned tasks you finished, last 12 weeks.</p>
          <WeeklyBars weeks={weeks} />
        </section>

        {/* Chapters */}
        <section className="rounded-[24px] bg-page p-6 ring-1 ring-line sm:p-8">
          <h2 className="font-display text-2xl font-semibold tracking-[-0.01em]">Chapters</h2>
          <p className="text-sm text-ink-soft">Time passed vs. goals achieved.</p>
          <ul className="mt-6 space-y-6">
            {chapters.map((c, i) => {
              const total = diffDays(c.start_date, c.end_date) + 1;
              const elapsed = Math.max(0, Math.min(total, diffDays(c.start_date, today) + 1));
              const done = c.goals.filter((g) => g.done).length;
              return (
                <li key={c.id}>
                  <div className="flex items-baseline justify-between gap-3">
                    <Link href={`/book?at=chapter-${c.id}`} className="font-medium hover:underline">
                      <span className="font-hand text-xl text-orange">{i + 1}.</span> {c.title}
                    </Link>
                    <span className="text-xs text-ink-faint">
                      {formatShort(c.start_date)} → {formatShort(c.end_date)}
                    </span>
                  </div>
                  <Bar label="Time" value={elapsed / total} text={`${elapsed}/${total} days`} color="#9b7150" />
                  <Bar label="Goals" value={c.goals.length ? done / c.goals.length : 0} text={`${done}/${c.goals.length} goals`} color="#1f4d3a" />
                </li>
              );
            })}
          </ul>
          <p className="mt-6 flex items-center gap-2 text-sm text-ink-soft">
            <PenLine className="size-4" /> {s.daysWritten} {s.daysWritten === 1 ? "page" : "pages"} written so far
          </p>
        </section>
      </div>
    </div>
  );
}

function Tile({ icon, label, value, unit, note, tone }: { icon: React.ReactNode; label: string; value: string; unit?: string; note: string; tone: string }) {
  return (
    <div className={clsx("rounded-[24px] p-6", tone)}>
      <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-ink/60">
        {icon} {label}
      </p>
      <p className="mt-2 font-display text-5xl font-semibold tracking-[-0.03em]">
        {value}
        {unit && <span className="ml-1 text-xl font-medium text-ink/50">{unit}</span>}
      </p>
      <p className="mt-1 text-sm text-ink/70">{note}</p>
    </div>
  );
}

function Bar({ label, value, text, color }: { label: string; value: number; text: string; color: string }) {
  return (
    <div className="mt-2 grid grid-cols-[48px_1fr_92px] items-center gap-3 text-xs">
      <span className="text-ink-soft">{label}</span>
      <div className="h-2 overflow-hidden rounded-full bg-line">
        <div className="h-full rounded-full" style={{ width: `${Math.round(value * 100)}%`, background: color }} />
      </div>
      <span className="text-right text-ink-soft">{text}</span>
    </div>
  );
}

function Heatmap({ start, end, stats, today }: { start: string; end: string; stats: Map<string, DayStat>; today: string }) {
  const [tip, setTip] = useState<{ x: number; y: number; text: string } | null>(null);
  const first = addDays(start, -new Date(`${start}T00:00:00Z`).getUTCDay());
  const weeks = Math.ceil((diffDays(first, end) + 1) / 7);
  const cols = Array.from({ length: weeks }, (_, w) => Array.from({ length: 7 }, (_, d) => addDays(first, w * 7 + d)));
  const cell = weeks <= 30 ? 20 : weeks <= 40 ? 16 : 13;
  // Label a column with its month when the month starts in it; skip labels that would collide.
  const labels: (string | null)[] = cols.map((col, w) => {
    const monthStart = col.find((d) => d.endsWith("-01") && d >= start && d <= end);
    return monthStart ? formatMonth(monthStart) : w === 0 ? formatMonth(start) : null;
  });
  const minGap = cell >= 16 ? 2 : 3;
  let last = -Infinity;
  labels.forEach((l, i) => {
    if (!l) return;
    const next = labels.findIndex((x, j) => j > i && x);
    if (i === 0 && next > 0 && next < minGap) labels[0] = null;
    else if (i - last < minGap) labels[i] = null;
    else last = i;
  });

  return (
    <div className="relative mt-6">
      <div className="scroll-thin overflow-x-auto pb-2">
        <div className="inline-grid grid-flow-col gap-[3px]" style={{ gridTemplateRows: `16px repeat(7, ${cell}px)`, gridAutoColumns: `${cell}px` }}>
          {cols.map((col, w) => {
            return [
              <span key={`m${w}`} className="overflow-visible whitespace-nowrap text-[11px] text-ink-faint">
                {labels[w] ?? ""}
              </span>,
              ...col.map((d) => {
                const outside = d < start || d > end;
                if (outside) return <span key={d} />;
                const s = stats.get(d);
                const future = d > today;
                const label = future
                  ? `${formatDayMonth(d)} — ahead`
                  : `${formatDayMonth(d)} — ${s?.done ?? 0} ${s?.done === 1 ? "task" : "tasks"} done${s?.planned ? ` of ${s.planned}` : ""}${s?.wrote ? " · wrote" : ""}`;
                return (
                  <Link
                    key={d}
                    href={`/book?at=${d}`}
                    aria-label={label}
                    onMouseEnter={(e) => {
                      const r = e.currentTarget.getBoundingClientRect();
                      const p = e.currentTarget.closest(".relative")!.getBoundingClientRect();
                      setTip({ x: r.left - p.left + r.width / 2, y: r.top - p.top, text: label });
                    }}
                    onMouseLeave={() => setTip(null)}
                    className={clsx(
                      "rounded-[4px] transition-transform hover:scale-125",
                      future && "ring-1 ring-inset ring-line",
                      d === today && "ring-2 ring-ink",
                    )}
                    style={{ background: future ? "transparent" : HEAT[heatLevel(s)] }}
                  />
                );
              }),
            ];
          })}
        </div>
      </div>
      {tip && (
        <div
          className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-[calc(100%+8px)] whitespace-nowrap rounded-lg bg-ink px-3 py-1.5 text-xs text-paper shadow-lg"
          style={{ left: tip.x, top: tip.y }}
        >
          {tip.text}
        </div>
      )}
      <div className="mt-3 flex items-center justify-end gap-1.5 text-xs text-ink-faint">
        Less
        {HEAT.map((c) => (
          <span key={c} className="size-3 rounded-[3px]" style={{ background: c }} />
        ))}
        More
      </div>
    </div>
  );
}

function WeeklyBars({ weeks }: { weeks: { start: string; planned: number; done: number; rate: number }[] }) {
  const [hover, setHover] = useState<number | null>(null);
  return (
    <div className="relative mt-6">
      <div className="flex h-44 items-end gap-2 border-b border-line">
        {weeks.map((w, i) => (
          <div
            key={w.start}
            className="group relative flex h-full flex-1 items-end"
            onMouseEnter={() => setHover(i)}
            onMouseLeave={() => setHover(null)}
          >
            <div
              className={clsx("w-full rounded-t-[4px] transition-colors", hover === i ? "bg-orange" : "bg-[#f5ad76]")}
              style={{ height: w.planned ? `${Math.max(3, w.rate * 100)}%` : 0 }}
            />
            {hover === i && (
              <div className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 -translate-x-1/2 whitespace-nowrap rounded-lg bg-ink px-3 py-1.5 text-xs text-paper shadow-lg">
                Week of {formatShort(w.start)}: {w.planned ? `${Math.round(w.rate * 100)}% · ${w.done}/${w.planned}` : "no tasks planned"}
              </div>
            )}
          </div>
        ))}
      </div>
      <div className="mt-2 flex gap-2 text-[11px] text-ink-faint">
        {weeks.map((w, i) => (
          <span key={w.start} className="flex-1 text-center">
            {i % 3 === 0 ? `${formatMonth(w.start)} ${Number(w.start.slice(8))}` : ""}
          </span>
        ))}
      </div>
    </div>
  );
}
