# LockedIn

A digital journal for the year between one birthday and the next. You write a letter to yourself, design your book's cover, and open a chapter with goals. Every day in the chapter becomes a page: a thought for the day, today's tasks, a free corner for anything, and an end-of-day summary.

## Stack

- Next.js 16 (App Router, Server Actions, `proxy.ts`), React 19, Tailwind CSS v4
- Neon Postgres via `@neondatabase/serverless`
- Email + password auth: bcrypt hashes, and a signed JWT in an httpOnly cookie (`jose`)
- `motion` for the cover opening and page turns

## Setup

1. Create a Neon project and copy the **pooled** connection string.
2. `cp .env.example .env.local`, then fill in `DATABASE_URL` and a long random `SESSION_SECRET` (`openssl rand -base64 32`).
3. Create the tables: `npm run db:migrate` (safe to run again).
4. `npm run dev` and open http://localhost:3000.

Prefer a local Postgres for development? Set `NEON_FETCH_ENDPOINT` to a local Neon-compatible HTTP proxy. Both the app and `npm run db:migrate` follow it, so `DATABASE_URL` then names the database inside that proxy — not your Neon project.

## Where things live

| Path | What |
| --- | --- |
| `db/schema.sql` | Tables: users, books, chapters, goals, days, tasks |
| `src/app/actions/` | Server actions (auth, journal writes). Every write is scoped to the signed-in user |
| `src/components/book/` | The book reader: spreads, page turns, and day pages |
| `src/app/(app)/growth` | Streaks, heatmap, weekly completion, growth index |
| `src/lib/stats.ts` | Growth math (streak = days with a completed task or a written entry) |

Photos are resized in the browser (max 1200px JPEG) and stored as data URLs in Postgres. That works well at this scale. If you later want smaller rows, move them to object storage.
