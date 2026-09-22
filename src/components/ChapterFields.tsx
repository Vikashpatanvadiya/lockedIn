"use client";

import { Plus, X } from "lucide-react";
import { diffDays, formatShort } from "@/lib/dates";
import { ImagePicker } from "./ImagePicker";

export type ChapterDraft = {
  title: string;
  label: string;
  motto: string;
  cover_image: string | null;
  start_date: string;
  end_date: string;
  goals: { id: string; text: string }[];
};

export const fieldInput =
  "h-12 w-full rounded-xl border border-line bg-page px-4 text-[15px] outline-none transition focus:border-kraft/60 focus:bg-white focus:ring-4 focus:ring-sun/50";
export const fieldLabel = "mb-1.5 block text-xs font-semibold uppercase tracking-widest text-ink-faint";

export function pageCount(start: string, end: string) {
  return start && end && end >= start ? diffDays(start, end) + 1 : 0;
}

export function ChapterFields({
  value,
  onChange,
  showGoals = true,
}: {
  value: ChapterDraft;
  onChange: (v: ChapterDraft) => void;
  showGoals?: boolean;
}) {
  const set = <K extends keyof ChapterDraft>(k: K, v: ChapterDraft[K]) => onChange({ ...value, [k]: v });
  const pages = pageCount(value.start_date, value.end_date);

  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-[1fr_140px]">
        <label>
          <span className={fieldLabel}>Chapter name</span>
          <input className={fieldInput} value={value.title} placeholder="e.g. Year 21 — The Builder" onChange={(e) => set("title", e.target.value)} maxLength={120} />
        </label>
        <label>
          <span className={fieldLabel}>Short label</span>
          <input className={fieldInput} value={value.label} placeholder="Year 21" onChange={(e) => set("label", e.target.value)} maxLength={60} />
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label>
          <span className={fieldLabel}>Starts</span>
          <input type="date" className={fieldInput} value={value.start_date} onChange={(e) => set("start_date", e.target.value)} />
        </label>
        <label>
          <span className={fieldLabel}>Ends (your birthday?)</span>
          <input type="date" className={fieldInput} value={value.end_date} min={value.start_date} onChange={(e) => set("end_date", e.target.value)} />
        </label>
      </div>
      <p className="-mt-2 rounded-xl bg-sun/50 px-4 py-2.5 text-sm">
        {pages > 0 ? (
          <>
            <span className="font-hand text-xl">{pages} pages</span> will be added to your book —{" "}
            {formatShort(value.start_date)} to {formatShort(value.end_date)}.
          </>
        ) : (
          "Pick an end date after the start date."
        )}
      </p>

      <label className="block">
        <span className={fieldLabel}>A line for the chapter&apos;s front page</span>
        <input className={fieldInput} value={value.motto} placeholder="The year I stop waiting and start doing." onChange={(e) => set("motto", e.target.value)} maxLength={280} />
      </label>

      <div>
        <span className={fieldLabel}>Front-page photo</span>
        <ImagePicker value={value.cover_image} onChange={(v) => set("cover_image", v)} className="h-40" label="A photo that reminds you why" />
      </div>

      {showGoals && (
        <div>
          <span className={fieldLabel}>What I want to achieve this chapter</span>
          <ul className="space-y-2">
            {value.goals.map((g, i) => (
              <li key={g.id} className="flex items-center gap-2">
                <span className="w-6 text-right font-hand text-xl text-ink-faint">{i + 1}.</span>
                <input
                  className={fieldInput}
                  value={g.text}
                  placeholder={["Ship my portfolio website", "Read 12 books", "Run a 10k", "Save ₹50,000"][i % 4]}
                  maxLength={200}
                  onChange={(e) => set("goals", value.goals.map((x) => (x.id === g.id ? { ...x, text: e.target.value } : x)))}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      set("goals", [...value.goals, { id: crypto.randomUUID(), text: "" }]);
                    }
                  }}
                />
                <button
                  type="button"
                  aria-label="Remove goal"
                  onClick={() => set("goals", value.goals.filter((x) => x.id !== g.id))}
                  className="grid size-10 shrink-0 place-items-center rounded-full text-ink-faint hover:bg-paper-2 hover:text-ink"
                >
                  <X className="size-4" />
                </button>
              </li>
            ))}
          </ul>
          <button
            type="button"
            onClick={() => set("goals", [...value.goals, { id: crypto.randomUUID(), text: "" }])}
            className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-dashed border-kraft/40 px-4 py-2 text-sm font-medium text-kraft-dark hover:bg-page"
          >
            <Plus className="size-4" /> Add a goal
          </button>
        </div>
      )}
    </div>
  );
}
