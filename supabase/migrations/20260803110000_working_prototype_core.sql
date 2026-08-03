-- This additive schema powers the working-prototype record surfaces. The Phase 0
-- tables remain in place while the capture pipeline is migrated incrementally.

do $$ begin create type public.task_status as enum ('open', 'completed', 'canceled', 'archived'); exception when duplicate_object then null; end $$;
do $$ begin create type public.project_status as enum ('planned', 'active', 'paused', 'completed', 'canceled', 'archived'); exception when duplicate_object then null; end $$;
do $$ begin create type public.routine_period as enum ('morning', 'afternoon', 'evening', 'anytime'); exception when duplicate_object then null; end $$;
do $$ begin create type public.routine_outcome as enum ('completed', 'skipped'); exception when duplicate_object then null; end $$;

create table public.domains (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 80),
  description text,
  color text not null default '#215944' check (color ~ '^#[0-9A-Fa-f]{6}$'),
  slipping_cadence_days smallint check (slipping_cadence_days between 1 and 365),
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (owner_id, name)
);

create table public.people (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 160),
  context text,
  pronouns text,
  tags text[] not null default '{}',
  domain_id uuid references public.domains (id) on delete set null,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.projects (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 160),
  description text,
  status public.project_status not null default 'active',
  domain_id uuid references public.domains (id) on delete set null,
  person_id uuid references public.people (id) on delete set null,
  start_on date,
  target_on date,
  slipping_cadence_days smallint check (slipping_cadence_days between 1 and 365),
  source_capture_id uuid references public.captures (id) on delete set null,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  title text not null check (char_length(title) between 1 and 280),
  details text,
  status public.task_status not null default 'open',
  priority smallint not null default 2 check (priority between 1 and 3),
  due_on date,
  scheduled_for date,
  deferred_until date,
  domain_id uuid references public.domains (id) on delete set null,
  project_id uuid references public.projects (id) on delete set null,
  person_id uuid references public.people (id) on delete set null,
  source_capture_id uuid references public.captures (id) on delete set null,
  proposal_id uuid unique references public.proposals (id) on delete set null,
  top_three_date date,
  top_three_order smallint check (top_three_order between 1 and 3),
  completed_at timestamptz,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check ((top_three_date is null) = (top_three_order is null))
);

create unique index tasks_top_three_unique_order_idx
  on public.tasks (owner_id, top_three_date, top_three_order)
  where top_three_date is not null;

create table public.notes (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  title text not null check (char_length(title) between 1 and 280),
  body text,
  tags text[] not null default '{}',
  domain_id uuid references public.domains (id) on delete set null,
  project_id uuid references public.projects (id) on delete set null,
  person_id uuid references public.people (id) on delete set null,
  source_capture_id uuid references public.captures (id) on delete set null,
  proposal_id uuid unique references public.proposals (id) on delete set null,
  review_on date,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.routines (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 160),
  description text,
  period public.routine_period not null default 'anytime',
  active_days smallint[] not null default '{0,1,2,3,4,5,6}' check (cardinality(active_days) between 1 and 7 and active_days <@ array[0,1,2,3,4,5,6]::smallint[]),
  domain_id uuid references public.domains (id) on delete set null,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.routine_completions (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  routine_id uuid not null references public.routines (id) on delete cascade,
  local_date date not null,
  outcome public.routine_outcome not null,
  created_at timestamptz not null default now(),
  unique (routine_id, local_date)
);

create index domains_owner_active_idx on public.domains (owner_id, archived_at, name);
create index people_owner_active_idx on public.people (owner_id, archived_at, name);
create index projects_owner_status_idx on public.projects (owner_id, status, target_on);
create index tasks_owner_status_dates_idx on public.tasks (owner_id, status, due_on, scheduled_for);
create index notes_owner_active_idx on public.notes (owner_id, archived_at, updated_at desc);
create index routines_owner_active_idx on public.routines (owner_id, archived_at, period);

alter table public.domains enable row level security;
alter table public.people enable row level security;
alter table public.projects enable row level security;
alter table public.tasks enable row level security;
alter table public.notes enable row level security;
alter table public.routines enable row level security;
alter table public.routine_completions enable row level security;

create policy "users manage their own domains" on public.domains for all to authenticated
  using ((select auth.uid()) = owner_id) with check ((select auth.uid()) = owner_id);
create policy "users manage their own people" on public.people for all to authenticated
  using ((select auth.uid()) = owner_id) with check ((select auth.uid()) = owner_id);
create policy "users manage their own projects" on public.projects for all to authenticated
  using ((select auth.uid()) = owner_id) with check ((select auth.uid()) = owner_id);
create policy "users manage their own tasks" on public.tasks for all to authenticated
  using ((select auth.uid()) = owner_id) with check ((select auth.uid()) = owner_id);
create policy "users manage their own notes" on public.notes for all to authenticated
  using ((select auth.uid()) = owner_id) with check ((select auth.uid()) = owner_id);
create policy "users manage their own routines" on public.routines for all to authenticated
  using ((select auth.uid()) = owner_id) with check ((select auth.uid()) = owner_id);
create policy "users manage their own routine completions" on public.routine_completions for all to authenticated
  using ((select auth.uid()) = owner_id) with check ((select auth.uid()) = owner_id);

revoke all on table public.domains, public.people, public.projects, public.tasks, public.notes, public.routines, public.routine_completions from anon;
grant select, insert, update, delete on table public.domains, public.people, public.projects, public.tasks, public.notes, public.routines, public.routine_completions to authenticated;
