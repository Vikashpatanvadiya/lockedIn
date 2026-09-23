"use client";

import Link from "next/link";
import { useActionState } from "react";
import { login, signup, type AuthState } from "@/app/actions/auth";
import { PillButton } from "./PillButton";

const input =
  "h-12 w-full rounded-xl border border-line bg-surface px-4 text-[15px] outline-none transition placeholder:text-ink-faint focus:border-orange/60";
const label = "mb-1.5 block text-xs font-medium text-ink-soft";

export function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const [state, action, pending] = useActionState<AuthState, FormData>(mode === "login" ? login : signup, undefined);
  const isSignup = mode === "signup";
  const today = new Date().toISOString().slice(0, 10);

  return (
    <div>
      <h1 className="text-3xl font-medium">{isSignup ? "Start your year" : "Log in"}</h1>
      <p className="mt-2 text-sm text-ink-soft">
        {isSignup ? "Your birthday sets the challenge: this birthday to the next." : "Today’s list is waiting for you."}
      </p>

      <form action={action} className="mt-8 space-y-4">
        {isSignup && (
          <label className="block">
            <span className={label}>Your name</span>
            <input name="name" placeholder="Bansi" autoComplete="name" defaultValue={state?.name} className={input} required />
          </label>
        )}
        <label className="block">
          <span className={label}>Email</span>
          <input name="email" type="email" placeholder="you@mail.com" autoComplete="email" defaultValue={state?.email} className={input} required />
        </label>
        <label className="block">
          <span className={label}>Password</span>
          <input
            name="password"
            type="password"
            placeholder={isSignup ? "At least 8 characters" : "Your password"}
            autoComplete={isSignup ? "new-password" : "current-password"}
            minLength={isSignup ? 8 : undefined}
            className={input}
            required
          />
        </label>
        {isSignup && (
          <label className="block">
            <span className={label}>Your birthday</span>
            <input name="birthday" type="date" max={today} defaultValue={state?.birthday} className={input} required />
          </label>
        )}
        {state?.error && (
          <p role="alert" className="rounded-lg border border-red/40 bg-red/10 px-3 py-2 text-sm text-red">
            {state.error}
          </p>
        )}
        <PillButton type="submit" disabled={pending} className="mt-2 w-full">
          {pending ? "One moment…" : isSignup ? "Start" : "Log in"}
        </PillButton>
      </form>

      <p className="mt-8 text-sm text-ink-soft">
        {isSignup ? "Already started? " : "New here? "}
        <Link href={isSignup ? "/login" : "/signup"} className="font-medium text-orange hover:underline">
          {isSignup ? "Log in" : "Start your year"}
        </Link>
      </p>
    </div>
  );
}
