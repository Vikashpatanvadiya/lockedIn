"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { sql, assertDb } from "@/lib/db";
import { createSession, deleteSession, requireUserId } from "@/lib/session";

export type AuthState = { error?: string; email?: string; name?: string; birthday?: string } | undefined;

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function signup(_: AuthState, form: FormData): Promise<AuthState> {
  const name = String(form.get("name") ?? "").trim();
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  const password = String(form.get("password") ?? "");
  const birthday = String(form.get("birthday") ?? "");
  const state = { email, name, birthday };

  if (!name) return { error: "What should we call you?", ...state };
  if (!EMAIL.test(email)) return { error: "That email doesn't look right.", ...state };
  if (password.length < 8) return { error: "Use at least 8 characters for your password.", ...state };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(birthday)) return { error: "Pick your birthday.", ...state };
  if (birthday > new Date().toISOString().slice(0, 10)) return { error: "Your birthday can't be in the future.", ...state };

  assertDb();
  const existing = await sql`select 1 from users where email = ${email}`;
  if (existing.length) return { error: "An account with this email already exists. Try logging in.", ...state };

  const hash = await bcrypt.hash(password, 10);
  const rows = await sql`
    insert into users (email, password_hash, name, birthday)
    values (${email}, ${hash}, ${name.slice(0, 80)}, ${birthday})
    returning id`;
  await createSession(rows[0].id as string);
  redirect("/");
}

export async function login(_: AuthState, form: FormData): Promise<AuthState> {
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  const password = String(form.get("password") ?? "");

  assertDb();
  const rows = await sql`select id, password_hash from users where email = ${email}`;
  const user = rows[0];
  if (!user || !(await bcrypt.compare(password, user.password_hash as string))) {
    return { error: "Email or password is incorrect.", email };
  }
  await createSession(user.id as string);
  redirect("/");
}

export async function logout() {
  await deleteSession();
  redirect("/");
}

export async function deleteAccount() {
  assertDb();
  const userId = await requireUserId();
  // All child tables (goals, tasks, year_reviews) cascade on delete — one query is enough.
  await sql`delete from users where id = ${userId}`;
  await deleteSession();
  redirect("/login");
}
