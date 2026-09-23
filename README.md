# LockedIn

A day-by-day challenge journal. You sign up with your birthday, and the app counts down to your next one: *165 days left to become 22*. Under that sits this year's goals and **today's task list — only today**.

Days in the past drop out of view once they're over, and days ahead are never shown, so there is nothing to plan around or scroll through. The calendar can look back at an earlier day in this chapter (with a "Back to today" link), but it cannot reach into the future.

Each chapter runs birthday to birthday and has its own goals; a task can point at the goal it works towards. When a birthday closes a chapter, the finished year appears at the top as a summary — tasks added, tasks completed, goals achieved — with a letter to yourself about how the year went. It collapses once written.

## Stack

- Next.js 16 (App Router, Server Actions, `proxy.ts`), React 19, Tailwind CSS v4
- Neon Postgres via `@neondatabase/serverless`
- Email + password auth: bcrypt hashes, and a signed JWT in an httpOnly cookie (`jose`)

## Look

Dark UI on `#121212` using the MetEngine palette: orange `#FF9125` for accents and today, green `#45D09D` for completed, red `#F16056` for destructive, `#EFEFEF` text. Headings are Clash Grotesk (loaded from Fontshare in `src/app/layout.tsx`), body is Plus Jakarta Sans at -2% tracking via `next/font`. Only the palette and typography are borrowed; the logo is LockedIn's own.

## Setup

1. Create a Neon project and copy the **pooled** connection string.
2. `cp .env.example .env.local`, then fill in `DATABASE_URL` and a long random `SESSION_SECRET` (`openssl rand -base64 32`).
3. Create the tables: `npm run db:migrate` (safe to run again).
4. `npm run dev` and open http://localhost:3000.

## Routes

| Route | What |
| --- | --- |
| `/` | The day feed. Signed-out visitors go to `/login` |
| `/signup` | Name, email, password, birthday |
| `/login` | Email and password |
| `/profile` | Change your name or birthday |

## Where things live

| Path | What |
| --- | --- |
| `db/schema.sql` | `users`, `goals`, `tasks` (optional `goal_id`) and `year_reviews` |
| `src/app/(app)/YearReview.tsx` | End-of-year numbers and the letter to yourself |
| `db/drop-legacy.sql` | Optional: removes the old book/chapter tables. **Deletes their data** |
| `src/app/(app)/Feed.tsx` | Countdown header, chapter goals, and today's task list |
| `src/app/(app)/useTasks.ts` | Optimistic task edits with debounced autosave |
| `src/components/Calendar.tsx` | Month picker that jumps the feed to a day |
| `src/app/actions/` | Server actions. Every write is scoped to the signed-in user |
