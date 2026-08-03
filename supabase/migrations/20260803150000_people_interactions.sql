create table public.person_interactions (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  person_id uuid not null references public.people (id) on delete cascade,
  summary text not null check (char_length(summary) between 1 and 4_000),
  follow_up_task_id uuid references public.tasks (id) on delete set null,
  occurred_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index person_interactions_person_idx on public.person_interactions (person_id, occurred_at desc);

alter table public.person_interactions enable row level security;
create policy "users manage their own person interactions" on public.person_interactions for all to authenticated
  using ((select auth.uid()) = owner_id) with check ((select auth.uid()) = owner_id);
revoke all on table public.person_interactions from anon;
grant select, insert, update, delete on table public.person_interactions to authenticated;
