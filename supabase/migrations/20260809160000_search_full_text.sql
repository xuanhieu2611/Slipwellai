/* Step 9 (Search) follow-up: Postgres full-text indexing.
   Adds a generated tsvector column plus a GIN index on each searchable-text table already
   surfaced by global search (src/lib/search.ts) — tasks, projects, people, notes, domains, and
   captures. This is purely additive: STORED generated columns backfill themselves from existing
   rows at ALTER TABLE time and stay in sync automatically on every future insert/update, so there
   is no data-loss risk and no application code has to remember to maintain them. RLS already
   enforces per-owner isolation on every one of these tables (see 20260803110000 and
   20260802224924); a generated column and an index built on it do not change what a policy allows
   a role to see, so no new RLS policy is needed here.

   Each table contributes its two most relevant free-text fields to search_vector, matching what
   src/lib/search.ts already treats as a record's title/context: name-or-title (unweighted 'A') and
   the longer description/body/context field ('B'). captures only has one text field
   (original_text), matching what search.ts already searches for that type.

   No CONCURRENTLY: no other migration in this repo uses it (see supabase/migrations/*), and every
   affected table is small (dozens to low hundreds of rows on the linked pilot project), so a brief
   ACCESS EXCLUSIVE lock during CREATE INDEX is consistent with the existing convention and not a
   real availability risk at this scale. */

alter table public.tasks
  add column search_vector tsvector
  generated always as (
    setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(details, '')), 'B')
  ) stored;

alter table public.projects
  add column search_vector tsvector
  generated always as (
    setweight(to_tsvector('english', coalesce(name, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(description, '')), 'B')
  ) stored;

alter table public.people
  add column search_vector tsvector
  generated always as (
    setweight(to_tsvector('english', coalesce(name, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(context, '')), 'B')
  ) stored;

alter table public.notes
  add column search_vector tsvector
  generated always as (
    setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(body, '')), 'B')
  ) stored;

alter table public.domains
  add column search_vector tsvector
  generated always as (
    setweight(to_tsvector('english', coalesce(name, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(description, '')), 'B')
  ) stored;

alter table public.captures
  add column search_vector tsvector
  generated always as (
    to_tsvector('english', coalesce(original_text, ''))
  ) stored;

create index tasks_search_vector_idx on public.tasks using gin (search_vector);
create index projects_search_vector_idx on public.projects using gin (search_vector);
create index people_search_vector_idx on public.people using gin (search_vector);
create index notes_search_vector_idx on public.notes using gin (search_vector);
create index domains_search_vector_idx on public.domains using gin (search_vector);
create index captures_search_vector_idx on public.captures using gin (search_vector);
