-- Two capture-trust gaps, closed together because they share the review surface.
--
-- 1. Interpretation used to run inside the capture request. A closed tab or a lost
--    connection left the source stored but the capture stuck mid-flight with nothing
--    to act on. `interpretation_claimed_at` lets a later request see that a claim is
--    stale and take the work over, so a capture is always either finished or
--    re-runnable.
-- 2. One capture may propose up to three records, but only the first could ever be
--    filed. `proposal_applications` records the outcome of each proposal item, so the
--    remaining intents stay reachable and the database — not the browser — is what
--    makes a repeated apply impossible.

alter table public.captures
  add column if not exists interpretation_claimed_at timestamptz;

create table if not exists public.proposal_applications (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  proposal_id uuid not null references public.proposals (id) on delete cascade,
  item_index smallint not null check (item_index between 0 and 2),
  outcome text not null check (outcome in ('filed', 'dismissed')),
  record_type public.prototype_record_type,
  record_id uuid,
  created_at timestamptz not null default now(),
  -- The idempotency guarantee for review: one outcome per proposed item, so a retried
  -- accept reconciles against the existing record instead of filing a second one.
  unique (proposal_id, item_index)
);

create index if not exists proposal_applications_proposal_idx on public.proposal_applications (proposal_id);
create index if not exists proposal_applications_owner_idx on public.proposal_applications (owner_id, created_at desc);

alter table public.proposal_applications enable row level security;

create policy "users manage their own proposal applications" on public.proposal_applications for all to authenticated
  using ((select auth.uid()) = owner_id) with check ((select auth.uid()) = owner_id);

revoke all on table public.proposal_applications from anon;
grant select, insert, update, delete on table public.proposal_applications to authenticated;

-- A capture that proposes two tasks could not file the second one: `proposal_id` was
-- unique on both record tables. Per-item uniqueness now lives in
-- proposal_applications, so the record tables only need the lookup index that the
-- dropped constraint used to provide.
alter table public.tasks drop constraint if exists tasks_proposal_id_key;
alter table public.notes drop constraint if exists notes_proposal_id_key;
create index if not exists tasks_proposal_idx on public.tasks (proposal_id);
create index if not exists notes_proposal_idx on public.notes (proposal_id);
