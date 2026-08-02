create extension if not exists pgcrypto;

create type public.capture_status as enum (
  'queued',
  'interpreting',
  'needs_review',
  'filed',
  'failed',
  'discarded'
);

create type public.proposal_status as enum (
  'ready',
  'accepted',
  'superseded',
  'discarded',
  'failed'
);

create type public.prototype_record_type as enum ('task', 'note', 'retainer_update');
create type public.retainer_status as enum ('active', 'paused', 'ended');
create type public.cycle_item_status as enum ('open', 'completed', 'carried_forward', 'canceled');
create type public.slipping_outcome as enum ('open', 'marked_attention', 'deferred', 'dismissed');

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.captures (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  original_text text not null check (char_length(original_text) between 1 and 10000),
  status public.capture_status not null default 'queued',
  idempotency_key text not null,
  failure_code text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (owner_id, idempotency_key)
);

create table public.proposals (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  capture_id uuid not null references public.captures (id) on delete cascade,
  schema_version text not null default '1',
  status public.proposal_status not null default 'ready',
  proposal_json jsonb not null,
  model_id text,
  latency_ms integer check (latency_ms is null or latency_ms >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.prototype_records (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  proposal_id uuid references public.proposals (id) on delete set null,
  record_type public.prototype_record_type not null,
  title text not null check (char_length(title) between 1 and 280),
  body text,
  destination_name text,
  due_on date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.activity_events (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  entity_type text not null,
  entity_id uuid not null,
  event_type text not null,
  metadata jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default now()
);

create table public.retainers (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 160),
  timezone text not null default 'America/Vancouver',
  cycle_day smallint not null check (cycle_day between 1 and 31),
  status public.retainer_status not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.retainer_deliverable_templates (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  retainer_id uuid not null references public.retainers (id) on delete cascade,
  title text not null check (char_length(title) between 1 and 280),
  expected_day smallint not null check (expected_day between 1 and 31),
  carry_forward boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.retainer_cycles (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  retainer_id uuid not null references public.retainers (id) on delete cascade,
  cycle_start date not null,
  cycle_end date not null check (cycle_end >= cycle_start),
  created_at timestamptz not null default now(),
  unique (retainer_id, cycle_start)
);

create table public.retainer_cycle_items (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  cycle_id uuid not null references public.retainer_cycles (id) on delete cascade,
  template_id uuid references public.retainer_deliverable_templates (id) on delete set null,
  carried_from_item_id uuid references public.retainer_cycle_items (id) on delete set null,
  title text not null check (char_length(title) between 1 and 280),
  expected_on date not null,
  status public.cycle_item_status not null default 'open',
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

create table public.slipping_signals (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  retainer_id uuid not null references public.retainers (id) on delete cascade,
  cycle_item_id uuid references public.retainer_cycle_items (id) on delete set null,
  reason text not null,
  severity text not null check (severity in ('informational', 'attention', 'urgent')),
  outcome public.slipping_outcome not null default 'open',
  outcome_note text,
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);

create index captures_owner_created_idx on public.captures (owner_id, created_at desc);
create index proposals_capture_idx on public.proposals (capture_id, created_at desc);
create index activity_events_entity_idx on public.activity_events (owner_id, entity_type, entity_id, occurred_at desc);
create index retainer_cycles_retainer_idx on public.retainer_cycles (retainer_id, cycle_start desc);
create index cycle_items_cycle_idx on public.retainer_cycle_items (cycle_id, status);
create index slipping_signals_retainer_idx on public.slipping_signals (retainer_id, outcome, created_at desc);

alter table public.profiles enable row level security;
alter table public.captures enable row level security;
alter table public.proposals enable row level security;
alter table public.prototype_records enable row level security;
alter table public.activity_events enable row level security;
alter table public.retainers enable row level security;
alter table public.retainer_deliverable_templates enable row level security;
alter table public.retainer_cycles enable row level security;
alter table public.retainer_cycle_items enable row level security;
alter table public.slipping_signals enable row level security;

create policy "users manage their own profiles" on public.profiles
  for all to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

create policy "users manage their own captures" on public.captures
  for all to authenticated
  using ((select auth.uid()) = owner_id)
  with check ((select auth.uid()) = owner_id);

create policy "users manage their own proposals" on public.proposals
  for all to authenticated
  using ((select auth.uid()) = owner_id)
  with check ((select auth.uid()) = owner_id);

create policy "users manage their own prototype records" on public.prototype_records
  for all to authenticated
  using ((select auth.uid()) = owner_id)
  with check ((select auth.uid()) = owner_id);

create policy "users manage their own activity events" on public.activity_events
  for all to authenticated
  using ((select auth.uid()) = owner_id)
  with check ((select auth.uid()) = owner_id);

create policy "users manage their own retainers" on public.retainers
  for all to authenticated
  using ((select auth.uid()) = owner_id)
  with check ((select auth.uid()) = owner_id);

create policy "users manage their own retainer templates" on public.retainer_deliverable_templates
  for all to authenticated
  using ((select auth.uid()) = owner_id)
  with check ((select auth.uid()) = owner_id);

create policy "users manage their own retainer cycles" on public.retainer_cycles
  for all to authenticated
  using ((select auth.uid()) = owner_id)
  with check ((select auth.uid()) = owner_id);

create policy "users manage their own retainer cycle items" on public.retainer_cycle_items
  for all to authenticated
  using ((select auth.uid()) = owner_id)
  with check ((select auth.uid()) = owner_id);

create policy "users manage their own slipping signals" on public.slipping_signals
  for all to authenticated
  using ((select auth.uid()) = owner_id)
  with check ((select auth.uid()) = owner_id);

revoke all on all tables in schema public from anon;
grant select, insert, update, delete on all tables in schema public to authenticated;
