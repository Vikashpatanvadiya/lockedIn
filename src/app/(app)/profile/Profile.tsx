"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Check } from "lucide-react";
import { PillButton } from "@/components/PillButton";
import { updateProfile } from "@/app/actions/journal";
import { deleteAccount } from "@/app/actions/auth";
import { ageOn, diffDays, formatFeed, localToday, nextBirthday } from "@/lib/dates";
import type { User } from "@/lib/types";

const input =
  "h-12 w-full rounded-xl border border-line bg-surface px-4 text-[15px] outline-none transition focus:border-orange/60";
const label = "mb-1.5 block text-xs font-medium text-ink-soft";

export function Profile({ user }: { user: User }) {
  const router = useRouter();
  const [name, setName] = useState(user.name);
  const [birthday, setBirthday] = useState(user.birthday ?? "");
  const [pending, start] = useTransition();
  const [state, setState] = useState<"idle" | "saved" | "error">("idle");
  const [deleteState, setDeleteState] = useState<"idle" | "confirm">("idle");

  const today = localToday();
  const next = birthday ? nextBirthday(birthday, today) : null;

  return (
    <div className="mx-auto max-w-xl px-5 pb-24">
      <Link href="/" className="inline-flex items-center gap-2 text-sm font-medium text-ink-soft hover:text-ink">
        <ArrowLeft className="size-4" /> Back to my days
      </Link>
      <h1 className="mt-6 text-3xl font-medium">Profile</h1>
      <p className="mt-2 text-sm text-ink-soft">{user.email}</p>

      <div className="mt-8 space-y-5">
        <label className="block">
          <span className={label}>Your name</span>
          <input className={input} value={name} onChange={(e) => setName(e.target.value)} maxLength={80} />
        </label>
        <label className="block">
          <span className={label}>Your birthday</span>
          <input type="date" className={input} value={birthday} max={today} onChange={(e) => setBirthday(e.target.value)} />
        </label>
        {next && (
          <p className="rounded-xl border border-line bg-surface px-4 py-3 text-sm">
            Next birthday: <strong>{formatFeed(next)}</strong> — {diffDays(today, next)} days until you turn {ageOn(birthday, next)}.
          </p>
        )}
      </div>

      <div className="mt-8 flex items-center justify-end gap-4">
        {state === "saved" && (
          <span className="flex items-center gap-1.5 text-sm text-green">
            <Check className="size-4" /> Saved
          </span>
        )}
        {state === "error" && <span className="text-sm text-red">Couldn&apos;t save. Try again.</span>}
        <PillButton
          type="button"
          tone="light"
          disabled={pending}
          onClick={() =>
            start(async () => {
              try {
                await updateProfile({ name, birthday: birthday || null });
                setState("saved");
                router.refresh();
              } catch {
                setState("error");
              }
            })
          }
        >
          {pending ? "Saving…" : "Save"}
        </PillButton>
      </div>

      {/* Danger zone */}
      <div className="mt-12 border-t border-line pt-8">
        <p className="text-sm font-medium text-ink">Danger zone</p>
        <p className="mt-1 text-sm text-ink-soft">
          Deleting your account is permanent. All your tasks, goals, and journal entries will be gone forever.
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          {deleteState === "idle" && (
            <PillButton
              type="button"
              tone="ghost"
              disabled={pending}
              onClick={() => setDeleteState("confirm")}
            >
              Delete account
            </PillButton>
          )}
          {deleteState === "confirm" && (
            <>
              <PillButton
                type="button"
                tone="ghost"
                disabled={pending}
                className="border-red/60 text-red hover:bg-red/5"
                onClick={() =>
                  start(async () => {
                    await deleteAccount();
                  })
                }
              >
                {pending ? "Deleting…" : "Yes, delete everything"}
              </PillButton>
              <PillButton
                type="button"
                tone="light"
                disabled={pending}
                onClick={() => setDeleteState("idle")}
              >
                Cancel
              </PillButton>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
