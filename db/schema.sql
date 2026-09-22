-- LockedIn schema (Neon Postgres). Safe to run multiple times.
create extension if not exists pgcrypto;

create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  password_hash text not null,
  name text not null,
  birthday date,
  bio text not null default '',
  avatar text,
  letter text not null default '',
  onboarded boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists books (
  user_id uuid primary key references users(id) on delete cascade,
  title text not null default 'My Book',
  subtitle text not null default '',
  cover_image text,
  cover_color text not null default 'kraft',
  updated_at timestamptz not null default now()
);

create table if not exists chapters (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  title text not null,
  label text not null default '',
  motto text not null default '',
  cover_image text,
  start_date date not null,
  end_date date not null,
  created_at timestamptz not null default now()
);
create index if not exists chapters_user_idx on chapters(user_id, start_date);

create table if not exists goals (
  id uuid primary key default gen_random_uuid(),
  chapter_id uuid not null references chapters(id) on delete cascade,
  user_id uuid not null references users(id) on delete cascade,
  text text not null,
  done boolean not null default false,
  done_at date,
  position int not null default 0
);
create index if not exists goals_chapter_idx on goals(chapter_id);

create table if not exists days (
  user_id uuid not null references users(id) on delete cascade,
  date date not null,
  thought text not null default '',
  free_notes text not null default '',
  summary text not null default '',
  updated_at timestamptz not null default now(),
  primary key (user_id, date)
);

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
