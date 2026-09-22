"use client";

import Link from "next/link";
import { useActionState } from "react";
import { login, signup, type AuthState } from "@/app/actions/auth";
import { PillButton } from "./PillButton";

const input =
  "h-12 w-full rounded-xl border border-line bg-page px-4 text-[15px] outline-none transition focus:border-kraft/60 focus:bg-white focus:ring-4 focus:ring-sun/50";

export function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const [state, action, pending] = useActionState<AuthState, FormData>(mode === "login" ? login : signup, undefined);
  const isSignup = mode === "signup";

  return (
    <div>
      <p className="font-hand text-2xl text-orange -rotate-1">{isSignup ? "a fresh first page" : "welcome back"}</p>
      <h1 className="mt-1 font-display text-4xl font-semibold tracking-[-0.02em]">
        {isSignup ? "Start your book" : "Open your book"}
      </h1>
      <p className="mt-2 text-ink-soft">
        {isSignup ? "Takes a minute. The letter to yourself comes next." : "Today’s page is waiting for you."}
      </p>

      <form action={action} className="mt-8 space-y-3">
        {isSignup && (
          <label className="block">
            <span className="sr-only">Your name</span>
            <input name="name" placeholder="Your name" autoComplete="name" defaultValue={state?.name} className={input} required />
          </label>
        )}
        <label className="block">
          <span className="sr-only">Email</span>
          <input name="email" type="email" placeholder="Email" autoComplete="email" defaultValue={state?.email} className={input} required />
        </label>
        <label className="block">
          <span className="sr-only">Password</span>
          <input
            name="password"
            type="password"
            placeholder={isSignup ? "Password (8+ characters)" : "Password"}
            autoComplete={isSignup ? "new-password" : "current-password"}
            minLength={isSignup ? 8 : undefined}
            className={input}
            required
          />
        </label>
        {state?.error && (
          <p role="alert" className="rounded-lg bg-rose/25 px-3 py-2 text-sm text-[#8a2e22]">
            {state.error}
          </p>
        )}
        <PillButton type="submit" disabled={pending} className="mt-3 w-full justify-between">
          {pending ? "One moment…" : isSignup ? "Create my account" : "Log in"}
        </PillButton>
      </form>

      <p className="mt-8 text-sm text-ink-soft">
        {isSignup ? "Already have a book? " : "New here? "}
        <Link href={isSignup ? "/login" : "/signup"} className="font-medium text-ink underline decoration-orange/60 underline-offset-4">
          {isSignup ? "Log in" : "Start your book"}
        </Link>
      </p>
    </div>
  );
}
