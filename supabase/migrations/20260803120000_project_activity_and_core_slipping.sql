-- Project progress and generic Slipping episodes build on the working-prototype
-- core. Activity events remain append-only and never use updated_at as attention.

do $$ begin create type public.milestone_status as enum ('open', 'completed'); exception when duplicate_object then null; end $$;

create table public.project_milestones (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  project_id uuid not null references public.projects (id) on delete cascade,
  title text not null check (char_length(title) between 1 and 280),
  position smallint not null check (position >= 1),
  status public.milestone_status not null default 'open',
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (project_id, position)
);

create index project_milestones_project_idx on public.project_milestones (project_id, position);

alter table public.project_milestones enable row level security;
create policy "users manage their own project milestones" on public.project_milestones for all to authenticated
  using ((select auth.uid()) = owner_id) with check ((select auth.uid()) = owner_id);
revoke all on table public.project_milestones from anon;
grant select, insert, update, delete on table public.project_milestones to authenticated;

-- Retainer signals are preserved and backfilled into a generic entity episode
-- shape. A single active signal per source record prevents unchanged repeats.
alter table public.slipping_signals
  alter column retainer_id drop not null,
  add column entity_type text,
  add column entity_id uuid,
  add column cadence_days smallint check (cadence_days between 1 and 365);

update public.slipping_signals
set entity_type = 'retainer', entity_id = retainer_id
where entity_type is null;

alter table public.slipping_signals
  alter column entity_type set not null,
  alter column entity_id set not null;

create unique index slipping_signals_open_entity_idx
  on public.slipping_signals (owner_id, entity_type, entity_id)
  where outcome = 'open';
