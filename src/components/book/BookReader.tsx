"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import clsx from "clsx";
import { AnimatePresence, motion } from "motion/react";
import { BookOpen, ChevronLeft, ChevronRight, ListOrdered, Loader2, Check, AlertCircle, Sun } from "lucide-react";
import { BookCover } from "@/components/BookCover";
import { Modal } from "@/components/Modal";
import { PillButton } from "@/components/PillButton";
import { ChapterFields, pageCount, type ChapterDraft } from "@/components/ChapterFields";
import { addDays, ageOn, diffDays, localToday, nextBirthday } from "@/lib/dates";
import type { Chapter, Journal } from "@/lib/types";
import { useJournal } from "./useJournal";
import { ReaderContext, renderPage, type Spread, type Target } from "./pages";

const keyOf = (s: Spread) => (s.kind === "front" ? "front" : s.kind === "chapter" ? `ch:${s.chapter.id}` : `d:${s.chapter.id}:${s.date}`);
const FLIP_MS = 850;
const EASE = [0.645, 0.045, 0.355, 1] as const;

function useIsDesktop() {
  const [desktop, setDesktop] = useState(true);
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 960px)");
    const update = () => setDesktop(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);
  return desktop;
}

export function BookReader({ journal, at, autoOpen }: { journal: Journal; at?: string; autoOpen?: boolean }) {
  const j = useJournal(journal);
  const desktop = useIsDesktop();
  const [today, setToday] = useState("");
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- the local date is only known in the browser
    setToday(localToday());
  }, []);

  // ---------- Spreads: front (letter + index), then per chapter an opener and one spread per day.
  const spreads = useMemo(() => {
    const list: Spread[] = [{ kind: "front" }];
    j.chapters.forEach((c, i) => {
      list.push({ kind: "chapter", chapter: c, number: i + 1 });
      const total = diffDays(c.start_date, c.end_date) + 1;
      for (let k = 0; k < total; k++) {
        list.push({ kind: "day", chapter: c, number: i + 1, date: addDays(c.start_date, k), n: k + 1, total });
      }
    });
    return list;
  }, [j.chapters]);

  const indexOfKey = useMemo(() => new Map(spreads.map((s, i) => [keyOf(s), i])), [spreads]);

  const resolve = useCallback(
    (t: Target): number | null => {
      if (t.kind === "front") return 0;
      if (t.kind === "chapter") return indexOfKey.get(`ch:${t.id}`) ?? null;
      const chapter =
        j.chapters.find((c) => c.id === t.chapterId && t.date >= c.start_date && t.date <= c.end_date) ??
        j.chapters.find((c) => t.date >= c.start_date && t.date <= c.end_date);
      return chapter ? (indexOfKey.get(`d:${chapter.id}:${t.date}`) ?? null) : null;
    },
    [indexOfKey, j.chapters],
  );

  const currentChapter = useCallback(
    (date: string) => j.chapters.find((c) => date >= c.start_date && date <= c.end_date) ?? null,
    [j.chapters],
  );

  // ---------- Position & view
  const [closed, setClosed] = useState(!at);
  const [opening, setOpening] = useState(false);
  const [currentKey, setCurrentKey] = useState<string>("front");
  const current = indexOfKey.get(currentKey) ?? 0;
  const [flip, setFlip] = useState<{ from: number; to: number } | null>(null);
  const queue = useRef<number[]>([]);
  const [toast, setToast] = useState<string | null>(null);

  // Resolve the ?at= param once today is known.
  const initialised = useRef(false);
  useEffect(() => {
    if (!today || initialised.current) return;
    initialised.current = true;
    if (!at) return;
    const target: Target =
      at === "index" ? { kind: "front" } : at.startsWith("chapter-") ? { kind: "chapter", id: at.slice(8) } : { kind: "date", date: at === "today" ? today : at };
    const idx = resolve(target);
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time sync from the URL
    if (idx != null) setCurrentKey(keyOf(spreads[idx]));
  }, [today, at, resolve, spreads]);

  // Keep the URL in sync so a refresh returns to the same page.
  useEffect(() => {
    if (!initialised.current) return;
    const s = spreads[current];
    const param = closed ? null : s.kind === "front" ? "index" : s.kind === "chapter" ? `chapter-${s.chapter.id}` : s.date;
    const url = param ? `/book?at=${param}` : "/book";
    window.history.replaceState(null, "", url);
  }, [current, closed, spreads]);

  const startFlip = useCallback(
    (to: number) => {
      if (to === current || to < 0 || to >= spreads.length) return;
      if (!desktop) {
        setCurrentKey(keyOf(spreads[to]));
        window.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }
      setFlip({ from: current, to });
    },
    [current, desktop, spreads],
  );

  // Land the flip on a timer rather than the animation callback, which never
  // fires if animation frames pause (e.g. the tab is hidden mid-turn).
  useEffect(() => {
    if (!flip) return;
    const t = setTimeout(() => {
      setCurrentKey(keyOf(spreads[flip.to]));
      setFlip(null);
    }, FLIP_MS + 40);
    return () => clearTimeout(t);
  }, [flip, spreads]);

  // Continue a queued sequence (cover → index → chapter → today).
  useEffect(() => {
    if (flip || closed || !queue.current.length) return;
    const t = setTimeout(() => {
      const next = queue.current.shift();
      if (next != null) startFlip(next);
    }, 450);
    return () => clearTimeout(t);
  }, [flip, closed, current, startFlip]);

  const go = useCallback(
    (t: Target) => {
      queue.current = [];
      if (closed) setClosed(false);
      const idx = resolve(t);
      if (idx == null) {
        setToast("That day isn't inside any chapter yet. Start a new chapter from the index.");
        startFlip(0);
        return;
      }
      startFlip(idx);
    },
    [closed, resolve, startFlip],
  );

  const step = useCallback(
    (dir: 1 | -1) => {
      if (flip) return;
      queue.current = [];
      startFlip(current + dir);
    },
    [current, flip, startFlip],
  );

  function openBook() {
    if (opening) return;
    setOpening(true);
    const chapter = today ? currentChapter(today) : null;
    const plan: number[] = [];
    if (chapter) {
      const ch = resolve({ kind: "chapter", id: chapter.id });
      const day = resolve({ kind: "date", date: today, chapterId: chapter.id });
      if (ch != null) plan.push(ch);
      if (day != null) plan.push(day);
    }
    setTimeout(
      () => {
        setCurrentKey("front");
        setClosed(false);
        setOpening(false);
        queue.current = desktop ? plan : plan.slice(-1);
      },
      desktop ? 900 : 300,
    );
  }

  useEffect(() => {
    if (autoOpen && today && closed && !opening) {
      const t = setTimeout(openBook, 700);
      return () => clearTimeout(t);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run once when today becomes known
  }, [today]);

  // Keyboard navigation.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement;
      if (el.closest("input, textarea, select, [contenteditable], [role=dialog]")) return;
      if (e.key === "ArrowRight") step(1);
      if (e.key === "ArrowLeft") step(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [step]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(t);
  }, [toast]);

  // Navigate once a just-created chapter's pages exist.
  const [pendingGo, setPendingGo] = useState<Target | null>(null);
  useEffect(() => {
    if (!pendingGo) return;
    const idx = resolve(pendingGo);
    if (idx == null) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- consume the pending navigation
    setPendingGo(null);
    startFlip(idx);
  }, [pendingGo, resolve, startFlip]);

  // ---------- Chapter modals
  const [newOpen, setNewOpen] = useState(false);
  const [editing, setEditing] = useState<Chapter | null>(null);

  const ctx = useMemo(
    () => ({
      j,
      today,
      name: journal.user.name,
      go,
      newChapter: () => setNewOpen(true),
      editChapter: (c: Chapter) => setEditing(c),
    }),
    [j, today, journal.user.name, go],
  );

  const spread = spreads[current];
  const todayIdx = today ? resolve({ kind: "date", date: today }) : null;

  return (
    <ReaderContext.Provider value={ctx}>
      <div className="flex min-h-[calc(100dvh-88px)] flex-col items-center px-3 pb-10 sm:px-6">
        {closed ? (
          <ClosedBook journal={journal} opening={opening} onOpen={openBook} desktop={desktop} today={today} />
        ) : (
          <>
            <Toolbar
              chapters={j.chapters}
              spread={spread}
              current={current}
              count={spreads.length}
              status={j.status}
              onCover={() => {
                queue.current = [];
                setClosed(true);
              }}
              onIndex={() => go({ kind: "front" })}
              onChapter={(id) => go({ kind: "chapter", id })}
              onToday={() => (todayIdx != null ? go({ kind: "date", date: today }) : setToast("Today isn't inside any chapter yet."))}
              onStep={step}
              busy={Boolean(flip)}
            />
            {desktop ? (
              <DesktopBook spreads={spreads} current={current} flip={flip} />
            ) : (
              <MobileBook spread={spread} current={current} />
            )}
            <div className="mt-5 flex items-center gap-3 lg:hidden">
              <NavButton dir={-1} onClick={() => step(-1)} disabled={current === 0} />
              <NavButton dir={1} onClick={() => step(1)} disabled={current === spreads.length - 1} />
            </div>
          </>
        )}
      </div>

      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 20, opacity: 0 }}
            className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-full bg-ink px-5 py-3 text-sm text-paper shadow-xl"
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>

      <NewChapterModal
        open={newOpen}
        onClose={() => setNewOpen(false)}
        chapters={j.chapters}
        birthday={journal.user.birthday}
        today={today}
        onCreate={async (draft) => {
          const id = await j.createChapter(draft);
          setNewOpen(false);
          setPendingGo({ kind: "chapter", id });
        }}
      />
      <EditChapterModal
        chapter={editing}
        onClose={() => setEditing(null)}
        onSave={async (id, draft) => {
          await j.updateChapter(id, draft);
          setEditing(null);
        }}
        onDelete={async (id) => {
          setCurrentKey("front");
          await j.deleteChapter(id);
          setEditing(null);
        }}
      />
    </ReaderContext.Provider>
  );
}

// ---------------------------------------------------------------- Closed cover

function ClosedBook({ journal, opening, onOpen, desktop, today }: { journal: Journal; opening: boolean; onOpen: () => void; desktop: boolean; today: string }) {
  const { book, user, chapters } = journal;
  const chapter = today ? chapters.find((c) => today >= c.start_date && today <= c.end_date) : null;
  const total = chapter ? diffDays(chapter.start_date, chapter.end_date) + 1 : undefined;
  return (
    <div className="flex flex-1 flex-col items-center justify-center py-8">
      <div className="relative" style={{ perspective: 2200 }}>
        {/* the page block behind the cover */}
        <div className="absolute inset-y-[1.5%] left-[2%] right-[-2.5%] rounded-r-[24px] bg-page shadow-[inset_-2px_0_0_#e8dfd1,inset_-5px_0_0_#fff,inset_-7px_0_0_#e8dfd1]" />
        <motion.button
          onClick={onOpen}
          aria-label="Open your book"
          className="relative block w-[min(78vw,380px)] origin-left cursor-pointer preserve-3d"
          animate={opening ? { rotateY: desktop ? -165 : 0, opacity: desktop ? 0.2 : 0, x: desktop ? 0 : -40 } : { rotateY: 0, opacity: 1 }}
          whileHover={opening ? undefined : { rotateY: -8, x: -4 }}
          transition={{ duration: opening ? 0.9 : 0.35, ease: EASE }}
        >
          <BookCover
            title={book.title}
            subtitle={book.subtitle}
            color={book.cover_color}
            image={book.cover_image}
            owner={user.name.split(" ")[0]}
            label={chapter?.label || "Days"}
            days={total ?? "—"}
            stickers
            className="w-full"
          />
        </motion.button>
      </div>
      <div className="mt-10 flex flex-col items-center gap-3">
        <PillButton onClick={onOpen} disabled={opening}>
          {opening ? "Opening…" : "Open my book"}
        </PillButton>
        <p className="font-hand text-xl text-ink-soft">{chapter ? "we'll take you straight to today's page" : "tap the cover to open"}</p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------- Desktop book with page-turn

function DesktopBook({
  spreads,
  current,
  flip,
}: {
  spreads: Spread[];
  current: number;
  flip: { from: number; to: number } | null;
}) {
  const forward = flip ? flip.to > flip.from : true;
  const from = flip ? spreads[flip.from] : spreads[current];
  const to = flip ? spreads[flip.to] : spreads[current];
  const page = (i: number, side: "left" | "right") => i * 2 + (side === "left" ? 1 : 2);

  // Underneath the turning leaf: the pages that stay put.
  const baseLeft = flip ? (forward ? { s: from, n: page(flip.from, "left") } : { s: to, n: page(flip.to, "left") }) : { s: to, n: page(current, "left") };
  const baseRight = flip ? (forward ? { s: to, n: page(flip.to, "right") } : { s: from, n: page(flip.from, "right") }) : { s: to, n: page(current, "right") };

  return (
    <div className="relative mt-5 w-full max-w-[1180px]">
      <div className="absolute inset-x-[-10px] bottom-[-12px] top-[8px] rounded-[26px] bg-kraft-dark book-shadow" />
      <div className="absolute inset-x-[-4px] bottom-[-5px] top-[3px] rounded-[22px] bg-[#efe6d6]" />
      <div className="relative grid h-[min(calc(100dvh-190px),820px)] min-h-[560px] grid-cols-2 overflow-visible rounded-[18px]" style={{ perspective: 2600 }}>
        <div className="overflow-hidden rounded-l-[18px]">
          <div key={keyOf(baseLeft.s) + "L"} className="h-full">{renderPage(baseLeft.s, "left", baseLeft.n)}</div>
        </div>
        <div className="overflow-hidden rounded-r-[18px]">
          <div key={keyOf(baseRight.s) + "R"} className="h-full">{renderPage(baseRight.s, "right", baseRight.n)}</div>
        </div>
        <div className="pointer-events-none absolute inset-y-0 left-1/2 w-10 -translate-x-1/2 bg-[linear-gradient(90deg,transparent,rgba(42,29,18,0.12)_45%,rgba(42,29,18,0.2)_50%,rgba(42,29,18,0.12)_55%,transparent)]" />

        {flip && (
          <motion.div
            key={`${flip.from}-${flip.to}`}
            className={clsx("pointer-events-none absolute inset-y-0 w-1/2 preserve-3d", forward ? "left-1/2 origin-left" : "left-0 origin-right")}
            initial={{ rotateY: 0 }}
            animate={{ rotateY: forward ? -180 : 180 }}
            transition={{ duration: FLIP_MS / 1000, ease: EASE }}
          >
            <div className={clsx("absolute inset-0 overflow-hidden backface-hidden", forward ? "rounded-r-[18px]" : "rounded-l-[18px]")}>
              {forward ? renderPage(from, "right", page(flip.from, "right")) : renderPage(from, "left", page(flip.from, "left"))}
              <motion.div
                className="absolute inset-0 bg-gradient-to-l from-black/0 to-black/25"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: FLIP_MS / 2000 }}
              />
            </div>
            <div
              className={clsx("absolute inset-0 overflow-hidden backface-hidden", forward ? "rounded-l-[18px]" : "rounded-r-[18px]")}
              style={{ transform: "rotateY(180deg)" }}
            >
              {forward ? renderPage(to, "left", page(flip.to, "left")) : renderPage(to, "right", page(flip.to, "right"))}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------- Mobile: both pages stacked

function MobileBook({ spread, current }: { spread: Spread; current: number }) {
  return (
    <div className="mt-4 w-full max-w-xl">
      <AnimatePresence mode="wait">
        <motion.div
          key={keyOf(spread)}
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -24 }}
          transition={{ duration: 0.25 }}
          className="overflow-hidden rounded-[20px] book-shadow"
        >
          <div className="[&_.page-left]:shadow-none">{renderPage(spread, "left", current * 2 + 1)}</div>
          <div className="border-t border-dashed border-line [&_.page-right]:shadow-none">{renderPage(spread, "right", current * 2 + 2)}</div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

// ---------------------------------------------------------------- Toolbar

function Toolbar(props: {
  chapters: Chapter[];
  spread: Spread;
  current: number;
  count: number;
  status: ReturnType<typeof useJournal>["status"];
  onCover: () => void;
  onIndex: () => void;
  onChapter: (id: string) => void;
  onToday: () => void;
  onStep: (dir: 1 | -1) => void;
  busy: boolean;
}) {
  const { chapters, spread, current, count, status } = props;
  const chapterId = spread.kind === "front" ? "" : spread.chapter.id;
  return (
    <div className="flex w-full max-w-[1180px] flex-wrap items-center justify-between gap-3 rounded-full border border-line bg-page/80 p-1.5 shadow-[0_8px_30px_-16px_rgba(42,29,18,0.25)] backdrop-blur max-lg:rounded-3xl">
      <div className="flex items-center gap-1">
        <ToolButton onClick={props.onCover} icon={<BookOpen className="size-4" />}>
          Cover
        </ToolButton>
        <ToolButton onClick={props.onIndex} icon={<ListOrdered className="size-4" />} active={spread.kind === "front"}>
          Index
        </ToolButton>
        {chapters.length > 0 && (
          <select
            value={chapterId}
            onChange={(e) => e.target.value && props.onChapter(e.target.value)}
            aria-label="Go to chapter"
            className="h-9 max-w-[180px] cursor-pointer truncate rounded-full border-0 bg-transparent pl-3 pr-8 text-sm font-medium text-ink-soft outline-none hover:bg-paper-2 hover:text-ink"
          >
            <option value="" disabled>
              Chapters
            </option>
            {chapters.map((c, i) => (
              <option key={c.id} value={c.id}>
                {i + 1}. {c.title}
              </option>
            ))}
          </select>
        )}
      </div>

      <div className="flex items-center gap-2">
        <span className="hidden items-center gap-1.5 text-xs text-ink-faint sm:flex" aria-live="polite">
          {status === "saving" && (
            <>
              <Loader2 className="size-3.5 animate-spin" /> Saving
            </>
          )}
          {status === "saved" && (
            <>
              <Check className="size-3.5 text-forest" /> Saved
            </>
          )}
          {status === "error" && (
            <span className="flex items-center gap-1.5 text-orange">
              <AlertCircle className="size-3.5" /> Not saved — check your connection
            </span>
          )}
        </span>
        <span className="hidden font-hand text-lg text-ink-soft md:inline">
          pages {current * 2 + 1}–{current * 2 + 2} of {count * 2}
        </span>
        <div className="hidden items-center lg:flex">
          <NavButton dir={-1} onClick={() => props.onStep(-1)} disabled={current === 0 || props.busy} small />
          <NavButton dir={1} onClick={() => props.onStep(1)} disabled={current === count - 1 || props.busy} small />
        </div>
        <button onClick={props.onToday} className="inline-flex h-9 items-center gap-1.5 rounded-full bg-sun px-4 text-sm font-semibold hover:bg-[#f9d968]">
          <Sun className="size-4" /> Today
        </button>
      </div>
    </div>
  );
}

function ToolButton({ children, icon, onClick, active }: { children: React.ReactNode; icon: React.ReactNode; onClick: () => void; active?: boolean }) {
  return (
    <button
      onClick={onClick}
      aria-label={typeof children === "string" ? children : undefined}
      className={clsx(
        "inline-flex h-9 items-center gap-1.5 rounded-full px-3.5 text-sm font-medium transition",
        active ? "bg-ink text-paper" : "text-ink-soft hover:bg-paper-2 hover:text-ink",
      )}
    >
      {icon}
      <span className="hidden sm:inline">{children}</span>
    </button>
  );
}

function NavButton({ dir, onClick, disabled, small }: { dir: 1 | -1; onClick: () => void; disabled?: boolean; small?: boolean }) {
  const Icon = dir === 1 ? ChevronRight : ChevronLeft;
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={dir === 1 ? "Next page" : "Previous page"}
      className={clsx(
        "grid place-items-center rounded-full text-ink transition hover:bg-paper-2 disabled:opacity-30",
        small ? "size-9" : "size-12 border border-line bg-page",
      )}
    >
      <Icon className="size-5" />
    </button>
  );
}

// ---------------------------------------------------------------- Chapter modals

function NewChapterModal({
  open,
  onClose,
  chapters,
  birthday,
  today,
  onCreate,
}: {
  open: boolean;
  onClose: () => void;
  chapters: Chapter[];
  birthday: string | null;
  today: string;
  onCreate: (draft: ChapterDraft) => Promise<void>;
}) {
  const [draft, setDraft] = useState<ChapterDraft | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !today) return;
    const last = chapters.at(-1);
    const start = last && last.end_date >= today ? addDays(last.end_date, 1) : today;
    const end = birthday ? nextBirthday(birthday, start) : addDays(start, 364);
    const age = birthday ? ageOn(birthday, end) : null;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fresh defaults each time the modal opens
    setDraft({
      title: age ? `Year ${age}` : "",
      label: age ? `Year ${age}` : "",
      motto: "",
      cover_image: null,
      start_date: start,
      end_date: end,
      goals: [{ id: crypto.randomUUID(), text: "" }],
    });
    setError(null);
  }, [open, today, chapters, birthday]);

  const valid = draft && draft.title.trim() && pageCount(draft.start_date, draft.end_date) > 0;
  const overlaps = draft ? chapters.some((c) => draft.start_date <= c.end_date && draft.end_date >= c.start_date) : false;

  return (
    <Modal open={open} onClose={onClose} title="Start a new chapter">
      {draft && (
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            if (!valid) return;
            setPending(true);
            try {
              await onCreate(draft);
            } catch {
              setError("Couldn't create the chapter. Please try again.");
            } finally {
              setPending(false);
            }
          }}
        >
          <ChapterFields value={draft} onChange={setDraft} />
          {overlaps && <p className="mt-4 rounded-lg bg-periwinkle/40 px-3 py-2 text-sm">Heads up: these dates overlap another chapter. Shared days will show the same page in both.</p>}
          {error && <p className="mt-4 rounded-lg bg-rose/25 px-3 py-2 text-sm text-[#8a2e22]">{error}</p>}
          <div className="mt-7 flex justify-end">
            <PillButton type="submit" disabled={!valid || pending}>
              {pending ? "Adding pages…" : "Add chapter"}
            </PillButton>
          </div>
        </form>
      )}
    </Modal>
  );
}

function EditChapterModal({
  chapter,
  onClose,
  onSave,
  onDelete,
}: {
  chapter: Chapter | null;
  onClose: () => void;
  onSave: (id: string, draft: Omit<ChapterDraft, "goals">) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}) {
  const [draft, setDraft] = useState<ChapterDraft | null>(null);
  const [pending, setPending] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- load the chapter being edited
    setDraft(chapter ? { ...chapter, goals: [] } : null);
    setConfirming(false);
    setError(null);
  }, [chapter]);

  const valid = draft && draft.title.trim() && pageCount(draft.start_date, draft.end_date) > 0;

  return (
    <Modal open={Boolean(chapter)} onClose={onClose} title="Edit chapter">
      {draft && chapter && (
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            if (!valid) return;
            setPending(true);
            try {
              const { title, label, motto, cover_image, start_date, end_date } = draft;
              await onSave(chapter.id, { title, label, motto, cover_image, start_date, end_date });
            } catch {
              setError("Couldn't save the chapter. Please try again.");
            } finally {
              setPending(false);
            }
          }}
        >
          <ChapterFields value={draft} onChange={setDraft} showGoals={false} />
          <p className="mt-4 text-sm text-ink-soft">Your day pages are kept by date, so changing the dates never deletes what you wrote.</p>
          {error && <p className="mt-4 rounded-lg bg-rose/25 px-3 py-2 text-sm text-[#8a2e22]">{error}</p>}
          <div className="mt-7 flex items-center justify-between gap-3">
            {confirming ? (
              <div className="flex items-center gap-2 text-sm">
                <span>Delete this chapter and its goals?</span>
                <button
                  type="button"
                  onClick={async () => {
                    setPending(true);
                    try {
                      await onDelete(chapter.id);
                    } catch {
                      setError("Couldn't delete the chapter.");
                    } finally {
                      setPending(false);
                    }
                  }}
                  className="rounded-full bg-orange px-3 py-1.5 font-medium text-white"
                >
                  Delete
                </button>
                <button type="button" onClick={() => setConfirming(false)} className="rounded-full px-3 py-1.5 text-ink-soft hover:bg-paper-2">
                  Cancel
                </button>
              </div>
            ) : (
              <button type="button" onClick={() => setConfirming(true)} className="text-sm font-medium text-orange hover:underline">
                Delete chapter
              </button>
            )}
            <PillButton type="submit" disabled={!valid || pending}>
              {pending ? "Saving…" : "Save"}
            </PillButton>
          </div>
        </form>
      )}
    </Modal>
  );
}
