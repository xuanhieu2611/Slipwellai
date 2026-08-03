alter table public.profiles
  add column if not exists company_name text check (company_name is null or char_length(company_name) between 1 and 160),
  add column if not exists work_type text check (
    work_type is null
    or work_type in (
      'creator_consultant',
      'freelancer_with_recurring_clients',
      'solo_founder_or_fractional_leader',
      'other_independent_professional'
    )
  ),
  add column if not exists onboarding_version smallint not null default 0 check (onboarding_version >= 0),
  add column if not exists onboarding_completed_at timestamptz;

create table if not exists public.user_preferences (
  owner_id uuid primary key references auth.users (id) on delete cascade,
  timezone text,
  locale text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (timezone is null or char_length(timezone) between 1 and 80),
  check (locale is null or char_length(locale) between 2 and 64)
);

alter table public.user_preferences enable row level security;

create policy "users manage their own preferences" on public.user_preferences
  for all to authenticated
  using ((select auth.uid()) = owner_id)
  with check ((select auth.uid()) = owner_id);

-- Preserve existing pilot data while making every account enter the new required-once setup.
insert into public.profiles (id)
select id from auth.users
on conflict (id) do nothing;

create or replace function public.create_profile_for_auth_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id)
  values (new.id)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created_create_profile on auth.users;
create trigger on_auth_user_created_create_profile
  after insert on auth.users
  for each row execute procedure public.create_profile_for_auth_user();

revoke all on function public.create_profile_for_auth_user() from public, anon, authenticated;
revoke all on table public.user_preferences from anon;
grant select, insert, update, delete on table public.user_preferences to authenticated;
