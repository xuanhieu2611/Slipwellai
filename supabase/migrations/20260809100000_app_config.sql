-- Centrally managed feature flags and remotely configurable product defaults
-- (MVP-BUILD-TRACKER.md Step 1, "Application and environments"). A generic
-- key/value table rather than one column per setting, because the set of
-- flags/defaults is expected to grow across unrelated areas of the product
-- over time (search today; Slipping cadence defaults and others later), and
-- each needs its own JSON shape and its own rollout schedule.
--
-- This is an account-wide product configuration table, not a per-user
-- preference (see public.user_preferences for those), so it has no owner_id
-- and no per-row RLS policy. There is no admin UI yet, so a value is changed
-- by a new migration or a direct edit via the Supabase dashboard/service-role
-- connection, which keeps every change a reviewable, auditable diff by
-- construction rather than a silent runtime mutation.
--
-- Deliberately no RLS policies: RLS is enabled with zero policies, which
-- denies every row to every role except the table owner and service_role by
-- default, regardless of that role's table-level grants. That makes this
-- readable only through a server-only service-role client
-- (src/lib/supabase/admin.ts) and never through the publishable-key client
-- used in the browser or in ordinary request-scoped server code, satisfying
-- AGENTS.md's "do not connect browser code directly to privileged
-- operations" rule for this table. See
-- 20260809100001_app_config_revoke_grants.sql for why the table-level grants
-- also had to be revoked explicitly on top of that.
create table public.app_config (
  key text primary key,
  value jsonb not null,
  description text not null,
  updated_at timestamptz not null default now()
);

alter table public.app_config enable row level security;

-- One trivial real example so the wiring is proven end to end rather than
-- left as inert infrastructure: the global search result cap, previously the
-- hardcoded RESULT_LIMIT constant in src/lib/search.ts, now has a remotely
-- configurable row here. The value matches the old hardcoded default, so this
-- migration does not change current search behavior by itself.
insert into public.app_config (key, value, description)
values (
  'search.result_limit',
  '30',
  'Maximum number of results a global search query returns (src/lib/search.ts).'
);
