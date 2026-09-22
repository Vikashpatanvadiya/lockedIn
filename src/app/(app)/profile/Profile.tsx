"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import clsx from "clsx";
import { Check } from "lucide-react";
import { BookCover, COVER_COLORS } from "@/components/BookCover";
import { ImagePicker } from "@/components/ImagePicker";
import { PillButton } from "@/components/PillButton";
import { AutoTextarea } from "@/components/AutoTextarea";
import { fieldInput, fieldLabel } from "@/components/ChapterFields";
import { updateBook, updateLetter, updateProfile } from "@/app/actions/journal";
import { formatLong } from "@/lib/dates";
import type { Book, CoverColor, User } from "@/lib/types";

export function Profile({ user, book: initialBook }: { user: User; book: Book }) {
  const router = useRouter();
  const [profile, setProfile] = useState({ name: user.name, birthday: user.birthday ?? "", bio: user.bio, avatar: user.avatar });
  const [book, setBook] = useState(initialBook);
  const [letter, setLetter] = useState(user.letter);

  return (
    <div className="mx-auto max-w-[1100px] px-4 pb-24 sm:px-6">
      <div className="pt-6">
        <p className="font-hand text-2xl text-orange">it&apos;s all you</p>
        <h1 className="font-display text-[clamp(36px,5vw,56px)] font-semibold leading-none tracking-[-0.02em]">Profile</h1>
        <p className="mt-2 text-ink-soft">
          {user.email} · writing since {formatLong(user.created_at.slice(0, 10))}
        </p>
      </div>

      <div className="mt-10 grid gap-6 lg:grid-cols-2">
        <Card title="About you" onSave={async () => { await updateProfile({ ...profile, birthday: profile.birthday || null }); router.refresh(); }}>
          <div className="grid gap-5 sm:grid-cols-[120px_1fr]">
            <div>
              <span className={fieldLabel}>Photo</span>
              <ImagePicker value={profile.avatar} onChange={(v) => setProfile({ ...profile, avatar: v })} className="size-[120px] [&>button]:rounded-full" label="Add" max={400} />
            </div>
            <div className="space-y-4">
              <label className="block">
                <span className={fieldLabel}>Name</span>
                <input className={fieldInput} value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })} maxLength={80} />
              </label>
              <label className="block">
                <span className={fieldLabel}>Birthday</span>
                <input type="date" className={fieldInput} value={profile.birthday} onChange={(e) => setProfile({ ...profile, birthday: e.target.value })} />
              </label>
            </div>
          </div>
          <label className="mt-4 block">
            <span className={fieldLabel}>A line about you</span>
            <input className={fieldInput} value={profile.bio} placeholder="Student. Builder. Early riser in training." onChange={(e) => setProfile({ ...profile, bio: e.target.value })} maxLength={500} />
          </label>
        </Card>

        <Card title="Book cover" onSave={async () => { await updateBook(book); router.refresh(); }}>
          <div className="grid gap-6 sm:grid-cols-[160px_1fr]">
            <BookCover title={book.title} subtitle={book.subtitle} color={book.cover_color} image={book.cover_image} className="w-40 rotate-[-2deg]" />
            <div className="space-y-4">
              <label className="block">
                <span className={fieldLabel}>Title</span>
                <input className={fieldInput} value={book.title} onChange={(e) => setBook({ ...book, title: e.target.value })} maxLength={80} />
              </label>
              <label className="block">
                <span className={fieldLabel}>Subtitle</span>
                <input className={fieldInput} value={book.subtitle} onChange={(e) => setBook({ ...book, subtitle: e.target.value })} maxLength={160} />
              </label>
              <div className="flex flex-wrap gap-2.5">
                {(Object.keys(COVER_COLORS) as CoverColor[]).map((c) => (
                  <button
                    key={c}
                    type="button"
                    aria-label={COVER_COLORS[c].name}
                    aria-pressed={book.cover_color === c}
                    onClick={() => setBook({ ...book, cover_color: c })}
                    className={clsx("size-9 rounded-full ring-offset-2 ring-offset-page", book.cover_color === c ? "ring-2 ring-ink" : "ring-1 ring-line")}
                    style={{ background: COVER_COLORS[c].bg }}
                  />
                ))}
              </div>
            </div>
          </div>
          <div className="mt-5">
            <span className={fieldLabel}>Cover photo</span>
            <ImagePicker value={book.cover_image} onChange={(v) => setBook({ ...book, cover_image: v })} className="h-36" />
          </div>
        </Card>

        <Card title="Your letter" className="lg:col-span-2" onSave={() => updateLetter(letter)}>
          <div className="overflow-hidden rounded-2xl ring-1 ring-line">
            <AutoTextarea value={letter} onChange={(e) => setLetter(e.target.value)} rows={8} className="bg-page px-6 py-2" />
          </div>
        </Card>
      </div>
    </div>
  );
}

function Card({ title, children, onSave, className }: { title: string; children: React.ReactNode; onSave: () => Promise<unknown>; className?: string }) {
  const [pending, start] = useTransition();
  const [state, setState] = useState<"idle" | "saved" | "error">("idle");
  return (
    <section className={clsx("rounded-[24px] bg-page p-6 ring-1 ring-line sm:p-8", className)}>
      <h2 className="font-display text-2xl font-semibold tracking-[-0.01em]">{title}</h2>
      <div className="mt-6">{children}</div>
      <div className="mt-6 flex items-center justify-end gap-4">
        {state === "saved" && (
          <span className="flex items-center gap-1.5 text-sm text-forest">
            <Check className="size-4" /> Saved
          </span>
        )}
        {state === "error" && <span className="text-sm text-orange">Couldn&apos;t save. Try again.</span>}
        <PillButton
          type="button"
          tone="ink"
          disabled={pending}
          onClick={() =>
            start(async () => {
              try {
                await onSave();
                setState("saved");
              } catch {
                setState("error");
              }
            })
          }
        >
          {pending ? "Saving…" : "Save"}
        </PillButton>
      </div>
    </section>
  );
}
