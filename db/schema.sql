-- LockedIn schema (Neon Postgres). Safe to run multiple times.
create extension if not exists pgcrypto;

create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  password_hash text not null,
  name text not null,
  birthday date,
  created_at timestamptz not null default now()
);
-- Older databases created these; keep them nullable so inserts don't need them.
alter table users add column if not exists birthday date;

create table if not exists goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  text text not null,
  done boolean not null default false,
  chapter_start date,
  position int not null default 0,
  created_at timestamptz not null default now()
);
-- Reshape the goals table left over from the earlier book version, keeping its rows.
alter table goals drop column if exists chapter_id;
alter table goals drop column if exists done_at;
alter table goals add column if not exists chapter_start date;
alter table goals add column if not exists created_at timestamptz not null default now();
create index if not exists goals_user_idx on goals(user_id, chapter_start);

create table if not exists tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  date date not null,
  text text not null,
  done boolean not null default false,
  position int not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists tasks_user_date_idx on tasks(user_id, date);

-- A task can point at the goal it works towards.
alter table tasks add column if not exists goal_id uuid references goals(id) on delete set null;

-- One review per finished chapter: the numbers are derived, the letter is yours.
create table if not exists year_reviews (
  user_id uuid not null references users(id) on delete cascade,
  chapter_start date not null,
  letter text not null default '',
  updated_at timestamptz not null default now(),
  primary key (user_id, chapter_start)
);
