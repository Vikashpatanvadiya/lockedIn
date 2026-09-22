"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { sql, assertDb } from "@/lib/db";
import { createSession, deleteSession } from "@/lib/session";

export type AuthState = { error?: string; email?: string; name?: string } | undefined;

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function signup(_: AuthState, form: FormData): Promise<AuthState> {
  const name = String(form.get("name") ?? "").trim();
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  const password = String(form.get("password") ?? "");

  if (!name) return { error: "What should we call you?", email, name };
  if (!EMAIL.test(email)) return { error: "That email doesn't look right.", email, name };
  if (password.length < 8) return { error: "Use at least 8 characters for your password.", email, name };

  assertDb();
  const existing = await sql`select 1 from users where email = ${email}`;
  if (existing.length) return { error: "An account with this email already exists. Try logging in.", email, name };

  const hash = await bcrypt.hash(password, 10);
  const rows = await sql`
    insert into users (email, password_hash, name) values (${email}, ${hash}, ${name.slice(0, 80)})
    returning id`;
  await createSession(rows[0].id as string);
  redirect("/onboarding");
}

export async function login(_: AuthState, form: FormData): Promise<AuthState> {
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  const password = String(form.get("password") ?? "");

  assertDb();
  const rows = await sql`select id, password_hash, onboarded from users where email = ${email}`;
  const user = rows[0];
  if (!user || !(await bcrypt.compare(password, user.password_hash as string))) {
    return { error: "Email or password is incorrect.", email };
  }
  await createSession(user.id as string);
  redirect(user.onboarded ? "/book" : "/onboarding");
}

export async function logout() {
  await deleteSession();
  redirect("/");
}
