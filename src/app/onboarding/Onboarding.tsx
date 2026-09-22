"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import clsx from "clsx";
import { ArrowLeft } from "lucide-react";
import { Logo } from "@/components/Logo";
import { PillButton } from "@/components/PillButton";
import { BookCover, COVER_COLORS } from "@/components/BookCover";
import { ImagePicker } from "@/components/ImagePicker";
import { ChapterFields, fieldInput, fieldLabel, pageCount, type ChapterDraft } from "@/components/ChapterFields";
import { completeOnboarding } from "@/app/actions/journal";
import { ageOn, diffDays, formatLong, localToday, nextBirthday } from "@/lib/dates";
import type { CoverColor } from "@/lib/types";

const STEPS = ["About you", "Your letter", "Your book", "First chapter"];

const PROMPTS = [
  "Why are you here?",
  "Who do you want to be by your next birthday?",
  "What would make you — and your family — proud?",
  "What keeps stealing your time?",
  "What will you say to yourself on a hard day?",
];

export function Onboarding({ name: initialName }: { name: string }) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [today, setToday] = useState("");
  const [name, setName] = useState(initialName);
  const [birthday, setBirthday] = useState("");
  const [letter, setLetter] = useState("");
  const [book, setBook] = useState({ title: "", subtitle: "", cover_image: null as string | null, cover_color: "kraft" as CoverColor });
  const [chapter, setChapter] = useState<ChapterDraft>({
    title: "",
    label: "",
    motto: "",
    cover_image: null,
    start_date: "",
    end_date: "",
    goals: [
      { id: "g1", text: "" },
      { id: "g2", text: "" },
      { id: "g3", text: "" },
    ],
  });

  useEffect(() => {
    const t = localToday();
    // eslint-disable-next-line react-hooks/set-state-in-effect -- the local date is only known in the browser
    setToday(t);
    setChapter((c) => ({ ...c, start_date: c.start_date || t, goals: c.goals.map((g) => ({ ...g, id: crypto.randomUUID() })) }));
  }, []);

  // Once the birthday is known, pre-fill the chapter: today → next birthday.
  function goToChapter() {
    if (birthday && today) {
      const end = nextBirthday(birthday, today);
      const age = ageOn(birthday, end);
      setChapter((c) => ({
        ...c,
        start_date: c.start_date || today,
        end_date: c.end_date || end,
        label: c.label || `Year ${age}`,
        title: c.title || `Year ${age}`,
      }));
    }
    setStep(3);
  }

  const canNext = [
    name.trim().length > 0 && /^\d{4}-\d{2}-\d{2}$/.test(birthday),
    letter.trim().length >= 20,
    book.title.trim().length > 0,
    chapter.title.trim().length > 0 && pageCount(chapter.start_date, chapter.end_date) > 0 && chapter.goals.some((g) => g.text.trim()),
  ][step];

  function next() {
    setError(null);
    if (step === 2) return goToChapter();
    if (step < 3) return setStep(step + 1);
    start(async () => {
      try {
        await completeOnboarding({ name, birthday, letter, book, chapter });
        router.push("/book?open=today");
      } catch (e) {
        setError(e instanceof Error ? e.message : "Something went wrong. Please try again.");
      }
    });
  }

  const nextBday = birthday && today ? nextBirthday(birthday, today) : null;

  return (
    <div className="min-h-dvh">
      <header className="mx-auto flex max-w-5xl items-center justify-between px-6 py-6">
        <Logo className="h-5 text-ink" />
        <ol className="flex items-center gap-2">
          {STEPS.map((s, i) => (
            <li key={s} className="flex items-center gap-2">
              <span
                className={clsx(
                  "h-1.5 rounded-full transition-all",
                  i === step ? "w-8 bg-orange" : i < step ? "w-4 bg-ink" : "w-4 bg-line",
                )}
                aria-current={i === step ? "step" : undefined}
              />
            </li>
          ))}
          <span className="ml-2 hidden text-sm text-ink-soft sm:inline">{STEPS[step]}</span>
        </ol>
      </header>

      <main className="mx-auto grid max-w-5xl gap-12 px-6 pb-24 pt-6 lg:grid-cols-[1fr_380px]">
        <section>
          {step === 0 && (
            <div>
              <Heading hand="hello there," title="First, a little about you" sub="Your book runs from one birthday to the next." />
              <div className="mt-8 space-y-5">
                <label className="block">
                  <span className={fieldLabel}>Your name</span>
                  <input className={fieldInput} value={name} onChange={(e) => setName(e.target.value)} maxLength={80} />
                </label>
                <label className="block">
                  <span className={fieldLabel}>Your birthday</span>
                  <input type="date" className={fieldInput} value={birthday} max={today} onChange={(e) => setBirthday(e.target.value)} />
                </label>
                {nextBday && (
                  <p className="rounded-xl bg-sun/50 px-4 py-3 text-[15px]">
                    Your next birthday is <strong>{formatLong(nextBday)}</strong> — that&apos;s{" "}
                    <span className="font-hand text-2xl">{diffDays(today, nextBday)} days</span> to make count.
                  </p>
                )}
              </div>
            </div>
          )}

          {step === 1 && (
            <div>
              <Heading
                hand="before any goals…"
                title="Write a letter to yourself"
                sub="This opens your book. Read it on the days you forget why you started."
              />
              <div className="mt-6 flex flex-wrap gap-2">
                {PROMPTS.map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setLetter((l) => (l ? `${l.trimEnd()}\n\n${p} ` : `${p} `))}
                    className="rounded-full border border-line bg-page px-3 py-1.5 text-sm text-ink-soft hover:border-kraft/40 hover:text-ink"
                  >
                    {p}
                  </button>
                ))}
              </div>
              <div className="relative mt-5 overflow-hidden rounded-2xl book-shadow">
                <textarea
                  value={letter}
                  onChange={(e) => setLetter(e.target.value)}
                  rows={12}
                  autoFocus
                  placeholder={`Dear ${name.split(" ")[0] || "me"},\n\nYou have air in your lungs and work to do…`}
                  className="field ruled block min-h-[420px] px-8 pt-[14px] font-hand text-[24px] leading-[32px]"
                />
              </div>
              <p className="mt-2 text-sm text-ink-faint">{letter.trim().length < 20 ? "Write at least a few lines." : "Beautiful. You can edit this any time."}</p>
            </div>
          )}

          {step === 2 && (
            <div>
              <Heading hand="make it yours" title="Design your book cover" sub="A title, a subtitle, a photo and a colour." />
              <div className="mt-8 space-y-5">
                <label className="block">
                  <span className={fieldLabel}>Title</span>
                  <input className={fieldInput} value={book.title} placeholder="e.g. The Year I Showed Up" onChange={(e) => setBook({ ...book, title: e.target.value })} maxLength={80} />
                </label>
                <label className="block">
                  <span className={fieldLabel}>Subtitle</span>
                  <input className={fieldInput} value={book.subtitle} placeholder="Small steps, every single day." onChange={(e) => setBook({ ...book, subtitle: e.target.value })} maxLength={160} />
                </label>
                <div>
                  <span className={fieldLabel}>Cover colour</span>
                  <div className="flex flex-wrap gap-3">
                    {(Object.keys(COVER_COLORS) as CoverColor[]).map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setBook({ ...book, cover_color: c })}
                        aria-label={COVER_COLORS[c].name}
                        aria-pressed={book.cover_color === c}
                        className={clsx(
                          "size-11 rounded-full ring-offset-2 ring-offset-paper transition",
                          book.cover_color === c ? "ring-2 ring-ink" : "ring-1 ring-line hover:scale-105",
                        )}
                        style={{ background: COVER_COLORS[c].bg }}
                      />
                    ))}
                  </div>
                </div>
                <div>
                  <span className={fieldLabel}>Cover photo (optional)</span>
                  <ImagePicker value={book.cover_image} onChange={(v) => setBook({ ...book, cover_image: v })} className="h-40" />
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div>
              <Heading
                hand="chapter one"
                title="What do you want to achieve?"
                sub="Every day between the start and end date becomes a page in your book."
              />
              <div className="mt-8">
                <ChapterFields value={chapter} onChange={setChapter} />
              </div>
            </div>
          )}

          {error && <p className="mt-6 rounded-lg bg-rose/25 px-3 py-2 text-sm text-[#8a2e22]">{error}</p>}

          <div className="mt-10 flex items-center justify-between">
            {step > 0 ? (
              <button type="button" onClick={() => setStep(step - 1)} className="inline-flex items-center gap-2 text-sm font-medium text-ink-soft hover:text-ink">
                <ArrowLeft className="size-4" /> Back
              </button>
            ) : (
              <span />
            )}
            <PillButton type="button" onClick={next} disabled={!canNext || pending}>
              {step === 3 ? (pending ? "Binding your book…" : "Open my book") : "Continue"}
            </PillButton>
          </div>
        </section>

        <aside className="hidden lg:block">
          <div className="sticky top-10">
            <p className="mb-4 text-center font-hand text-xl text-ink-soft">your book, so far</p>
            <BookCover
              title={book.title || "Untitled"}
              subtitle={book.subtitle}
              color={book.cover_color}
              image={book.cover_image}
              owner={name.split(" ")[0]}
              label={chapter.label || "Days"}
              days={pageCount(chapter.start_date, chapter.end_date) || (nextBday && today ? diffDays(today, nextBday) + 1 : "—")}
              pencil
              className="mx-auto w-[300px] rotate-[3deg]"
            />
          </div>
        </aside>
      </main>
    </div>
  );
}

function Heading({ hand, title, sub }: { hand: string; title: string; sub: string }) {
  return (
    <>
      <p className="font-hand text-2xl text-orange -rotate-1">{hand}</p>
      <h1 className="mt-1 font-display text-[40px] font-semibold leading-tight tracking-[-0.02em]">{title}</h1>
      <p className="mt-2 text-lg text-ink-soft">{sub}</p>
    </>
  );
}
