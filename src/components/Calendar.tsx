"use client";

import { useEffect, useRef, useState } from "react";
import clsx from "clsx";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { addDays, formatFeed, weekdayIndex } from "@/lib/dates";

const WEEKDAYS = ["M", "T", "W", "T", "F", "S", "S"];
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

const firstOfMonth = (iso: string) => `${iso.slice(0, 7)}-01`;
const shiftMonth = (iso: string, by: number) => {
  const y = Number(iso.slice(0, 4));
  const m = Number(iso.slice(5, 7)) - 1 + by;
  return `${y + Math.floor(m / 12)}-${String((((m % 12) + 12) % 12) + 1).padStart(2, "0")}-01`;
};
const daysInMonth = (iso: string) => new Date(Date.UTC(Number(iso.slice(0, 4)), Number(iso.slice(5, 7)), 0)).getUTCDate();

/** Month picker that jumps the feed to a day. Days with tasks get a dot. */
export function Calendar({
  today,
  selected,
  min,
  max,
  hasTasks,
  onPick,
}: {
  today: string;
  selected: string;
  min: string;
  max: string;
  hasTasks: (date: string) => boolean;
  onPick: (date: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [month, setMonth] = useState(() => firstOfMonth(selected || today));
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!box.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const first = month;
  const lead = (weekdayIndex(first) + 6) % 7; // weeks start on Monday
  const count = daysInMonth(first);
  const cells = [...Array.from({ length: lead }, () => null), ...Array.from({ length: count }, (_, i) => addDays(first, i))];

  return (
    <div className="relative" ref={box}>
      <button
        onClick={() => {
          setMonth(firstOfMonth(selected || today));
          setOpen((o) => !o);
        }}
        aria-expanded={open}
        className="inline-flex h-10 items-center gap-2 rounded-full border border-line bg-surface px-4 text-sm font-medium transition hover:bg-surface-2"
      >
        <CalendarDays className="size-4" />
        <span className="hidden sm:inline">{formatFeed(selected || today)}</span>
        <span className="sm:hidden">Jump to a day</span>
      </button>

      {open && (
        <div className="absolute right-0 top-12 z-40 w-[288px] rounded-2xl border border-line bg-surface p-4 shadow-[0_24px_60px_-20px_rgba(0,0,0,0.7)]">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setMonth(shiftMonth(month, -1))}
              aria-label="Previous month"
              disabled={month <= firstOfMonth(min)}
              className="grid size-8 place-items-center rounded-full transition hover:bg-surface-2 disabled:opacity-30"
            >
              <ChevronLeft className="size-4" />
            </button>
            <p className="text-sm font-medium">
              {MONTHS[Number(month.slice(5, 7)) - 1]} {month.slice(0, 4)}
            </p>
            <button
              onClick={() => setMonth(shiftMonth(month, 1))}
              aria-label="Next month"
              disabled={month >= firstOfMonth(max)}
              className="grid size-8 place-items-center rounded-full transition hover:bg-surface-2 disabled:opacity-30"
            >
              <ChevronRight className="size-4" />
            </button>
          </div>

          <div className="mt-3 grid grid-cols-7 gap-1 text-center text-[11px] font-semibold uppercase text-ink-faint">
            {WEEKDAYS.map((d, i) => (
              <span key={i}>{d}</span>
            ))}
          </div>
          <div className="mt-1 grid grid-cols-7 gap-1">
            {cells.map((date, i) => {
              if (!date) return <span key={`e${i}`} />;
              const outside = date < min || date > max;
              return (
                <button
                  key={date}
                  disabled={outside}
                  onClick={() => {
                    onPick(date);
                    setOpen(false);
                  }}
                  className={clsx(
                    "relative grid size-9 place-items-center rounded-lg text-sm transition",
                    outside
                      ? "text-ink-faint/40"
                      : date === selected
                        ? "bg-orange font-medium text-bg"
                        : date === today
                          ? "border border-orange/60 font-medium"
                          : "hover:bg-surface-2",
                  )}
                >
                  {Number(date.slice(8))}
                  {!outside && hasTasks(date) && (
                    <span className={clsx("absolute bottom-1 size-1 rounded-full", date === selected ? "bg-bg" : "bg-orange")} />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
