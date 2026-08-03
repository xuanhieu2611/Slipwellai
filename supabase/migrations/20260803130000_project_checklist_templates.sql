-- Saved checklists are templates; applying one produces an immutable project
-- snapshot. The unique keys make repeat application/recovery reconcile safely.

do $$ begin create type public.checklist_item_status as enum ('open', 'completed'); exception when duplicate_object then null; end $$;

create table public.project_checklist_templates (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 160),
  description text,
  version integer not null default 1 check (version >= 1),
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.project_checklist_template_items (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  template_id uuid not null references public.project_checklist_templates (id) on delete cascade,
  title text not null check (char_length(title) between 1 and 280),
  position smallint not null check (position >= 1),
  created_at timestamptz not null default now(),
  unique (template_id, position)
);

create table public.project_checklist_instances (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  project_id uuid not null references public.projects (id) on delete cascade,
  template_id uuid not null references public.project_checklist_templates (id) on delete restrict,
  template_version integer not null check (template_version >= 1),
  created_at timestamptz not null default now(),
  unique (project_id, template_id, template_version)
);

create table public.project_checklist_items (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  instance_id uuid not null references public.project_checklist_instances (id) on delete cascade,
  source_template_item_id uuid not null references public.project_checklist_template_items (id) on delete restrict,
  title text not null check (char_length(title) between 1 and 280),
  position smallint not null check (position >= 1),
  status public.checklist_item_status not null default 'open',
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (instance_id, source_template_item_id),
  unique (instance_id, position)
);

create index project_templates_owner_idx on public.project_checklist_templates (owner_id, archived_at, name);
create index project_checklist_instances_project_idx on public.project_checklist_instances (project_id);
create index project_checklist_items_instance_idx on public.project_checklist_items (instance_id, position);

alter table public.project_checklist_templates enable row level security;
alter table public.project_checklist_template_items enable row level security;
alter table public.project_checklist_instances enable row level security;
alter table public.project_checklist_items enable row level security;

create policy "users manage their own project checklist templates" on public.project_checklist_templates for all to authenticated
  using ((select auth.uid()) = owner_id) with check ((select auth.uid()) = owner_id);
create policy "users manage their own project checklist template items" on public.project_checklist_template_items for all to authenticated
  using ((select auth.uid()) = owner_id) with check ((select auth.uid()) = owner_id);
create policy "users manage their own project checklist instances" on public.project_checklist_instances for all to authenticated
  using ((select auth.uid()) = owner_id) with check ((select auth.uid()) = owner_id);
create policy "users manage their own project checklist items" on public.project_checklist_items for all to authenticated
  using ((select auth.uid()) = owner_id) with check ((select auth.uid()) = owner_id);

revoke all on table public.project_checklist_templates, public.project_checklist_template_items, public.project_checklist_instances, public.project_checklist_items from anon;
grant select, insert, update, delete on table public.project_checklist_templates, public.project_checklist_template_items, public.project_checklist_instances, public.project_checklist_items to authenticated;
