-- ============================================================
-- Vidyai — Full Supabase Schema
-- Run this entire file in the Supabase SQL Editor (once).
-- Supabase Dashboard → SQL Editor → New Query → Paste → Run
-- ============================================================

-- ── 1. Extensions ────────────────────────────────────────────
create extension if not exists vector;

-- ── 2. Boards ────────────────────────────────────────────────
create table if not exists public.boards (
  id          serial primary key,
  name        varchar(100) unique not null,
  code        varchar(20)  unique not null,
  description varchar(500),
  is_active   boolean default true not null,
  created_at  timestamptz default now()
);

-- ── 3. Classes ───────────────────────────────────────────────
create table if not exists public.classes (
  id           serial primary key,
  board_id     integer references public.boards(id) on delete cascade not null,
  class_number integer not null,
  display_name varchar(100) not null,
  is_active    boolean default true not null,
  created_at   timestamptz default now()
);

-- ── 4. Subjects ──────────────────────────────────────────────
create table if not exists public.subjects (
  id           serial primary key,
  class_id     integer references public.classes(id) on delete cascade not null,
  subject_name varchar(100) not null,
  subject_code varchar(20),
  is_active    boolean default true not null,
  created_at   timestamptz default now()
);

-- ── 5. Chapters ──────────────────────────────────────────────
create table if not exists public.chapters (
  id             serial primary key,
  subject_id     integer references public.subjects(id) on delete cascade not null,
  chapter_number integer not null,
  chapter_name   varchar(255) not null,
  description    varchar(1000),
  is_active      boolean default true not null,
  status         varchar(20) default 'ready'
                   check (status in ('pending','processing','ready','failed')),
  pdf_s3_key     text,
  error_message  text,
  created_at     timestamptz default now()
);

-- ── 6. Profiles (linked to Supabase Auth) ────────────────────
-- id matches auth.users.id — populated automatically via trigger below
create table if not exists public.profiles (
  id                uuid primary key references auth.users(id) on delete cascade,
  full_name         varchar(255),
  email             varchar(255),
  subscription_tier varchar(20) default 'free'
                      check (subscription_tier in ('free','basic','premium','enterprise')),
  is_admin          boolean default false not null,
  is_active         boolean default true  not null,
  created_at        timestamptz default now(),
  updated_at        timestamptz default now()
);

-- ── 7. Text Chunks (pgvector embeddings) ─────────────────────
create table if not exists public.text_chunks (
  id          serial primary key,
  chapter_id  integer references public.chapters(id) on delete cascade not null,
  content     text not null,
  chunk_index integer not null,
  page_number integer,
  embedding   vector(1536),
  created_at  timestamptz default now()
);

create index if not exists idx_text_chunks_chapter_id on public.text_chunks(chapter_id);
-- IVFFlat index for fast cosine similarity search
create index if not exists idx_text_chunks_embedding
  on public.text_chunks using ivfflat (embedding vector_cosine_ops)
  with (lists = 100);

-- ── 8. Generated Tests ───────────────────────────────────────
create table if not exists public.generated_tests (
  id             serial primary key,
  user_id        uuid references public.profiles(id) on delete cascade not null,
  chapter_id     integer references public.chapters(id) on delete set null,
  questions_json jsonb not null,
  score          float,
  completed_at   timestamptz,
  created_at     timestamptz default now()
);

create index if not exists idx_generated_tests_user_id    on public.generated_tests(user_id);
create index if not exists idx_generated_tests_chapter_id on public.generated_tests(chapter_id);

-- ── 9. Question Cache ────────────────────────────────────────
create table if not exists public.question_cache (
  id             serial primary key,
  chapter_id     integer references public.chapters(id) on delete cascade not null,
  num_questions  integer not null,
  questions_json jsonb not null,
  created_at     timestamptz default now(),
  expires_at     timestamptz not null,
  unique(chapter_id, num_questions)
);

create index if not exists idx_question_cache_chapter_id on public.question_cache(chapter_id);
create index if not exists idx_question_cache_expires_at on public.question_cache(expires_at);

-- ── 10. Usage Tracking ───────────────────────────────────────
create table if not exists public.usage_tracking (
  id              serial primary key,
  user_id         uuid references public.profiles(id) on delete cascade not null,
  week_start      date not null,
  tests_generated integer default 0 not null,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now(),
  unique(user_id, week_start)
);

create index if not exists idx_usage_tracking_user_id on public.usage_tracking(user_id);

-- ── 11. Ingestion Jobs ───────────────────────────────────────
create table if not exists public.ingestion_jobs (
  id            uuid primary key default gen_random_uuid(),
  chapter_id    integer references public.chapters(id) on delete cascade,
  status        varchar(20) default 'pending'
                  check (status in ('pending','processing','completed','failed')),
  pdf_s3_key    text not null,
  error_message text,
  started_at    timestamptz,
  completed_at  timestamptz,
  created_at    timestamptz default now()
);

create index if not exists idx_ingestion_jobs_chapter_id on public.ingestion_jobs(chapter_id);

-- ── 12. Auto-create profile on signup ────────────────────────
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    new.email
  )
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ── 13. Row Level Security ───────────────────────────────────
-- Profiles: users see/update only their own row
alter table public.profiles enable row level security;

drop policy if exists "Users can view own profile"   on public.profiles;
drop policy if exists "Users can update own profile" on public.profiles;

create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Generated tests: users see only their own
alter table public.generated_tests enable row level security;

drop policy if exists "Users can view own tests" on public.generated_tests;

create policy "Users can view own tests"
  on public.generated_tests for select
  using (auth.uid() = user_id);

-- Usage tracking: users see only their own
alter table public.usage_tracking enable row level security;

drop policy if exists "Users can view own usage" on public.usage_tracking;

create policy "Users can view own usage"
  on public.usage_tracking for select
  using (auth.uid() = user_id);

-- NOTE: The FastAPI backend uses the SERVICE ROLE KEY which bypasses all RLS.
-- All backend writes (tests, usage, profiles) go through the service role.

-- ── 14. Seed: CBSE Class 10 Mathematics ─────────────────────
-- (Safe to re-run — uses ON CONFLICT DO NOTHING)
insert into public.boards (name, code, description)
values ('CBSE', 'CBSE', 'Central Board of Secondary Education')
on conflict (code) do nothing;

with board as (select id from public.boards where code = 'CBSE')
insert into public.classes (board_id, class_number, display_name)
select board.id, 10, 'Class 10' from board
on conflict do nothing;

with cls as (
  select c.id from public.classes c
  join public.boards b on b.id = c.board_id
  where b.code = 'CBSE' and c.class_number = 10
)
insert into public.subjects (class_id, subject_name, subject_code)
select cls.id, 'Mathematics', 'MATH' from cls
on conflict do nothing;

-- Chapters will be created automatically when PDFs are uploaded via the admin UI.
