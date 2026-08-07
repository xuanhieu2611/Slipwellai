-- Promotes retainers from the phase-0 prototype schema to the same soft-delete +
-- idempotency-key + versioned-template pattern already proven for tasks/projects/checklists.
-- See plan.md Phase 1.

-- retainers: explicit client/domain links, soft-delete, and a stable idempotency key for
-- create (mirrors projects.idempotency_key from 20260806110000_project_idempotency.sql).
alter table public.retainers add column client_person_id uuid references public.people (id) on delete set null;
alter table public.retainers add column domain_id uuid references public.domains (id) on delete set null;
alter table public.retainers add column archived_at timestamptz;
alter table public.retainers add column idempotency_key text;
alter table public.retainers add constraint retainers_owner_idempotency_key_key unique (owner_id, idempotency_key);

-- retainer_deliverable_templates: each row is a single deliverable definition, versioned and
-- orderable, mirroring project_checklist_template_items' shape (there is no separate wrapping
-- "template" object here — the retainer itself is the natural grouping). Editing bumps version so
-- generated cycle items can record exactly which version produced them. archived_at (not hard
-- delete) is what keeps retainer_cycle_items.source_template_item_id provenance intact once an
-- item has been used to generate cycle work.
alter table public.retainer_deliverable_templates add column version integer not null default 1 check (version >= 1);
alter table public.retainer_deliverable_templates add column archived_at timestamptz;
alter table public.retainer_deliverable_templates add column position smallint not null default 1 check (position >= 1);

-- retainer_cycles: an idempotency key makes a retried generation call safe to replay (in addition
-- to the existing (retainer_id, cycle_start) uniqueness, which prevents duplicate cycles for the
-- same period regardless of key). generation_status makes a failure partway through generation a
-- recognizable, resumable state instead of a silently half-populated cycle.
alter table public.retainer_cycles add column idempotency_key text;
alter table public.retainer_cycles add constraint retainer_cycles_retainer_idempotency_key_key unique (retainer_id, idempotency_key);
alter table public.retainer_cycles add column generation_status text not null default 'complete' check (generation_status in ('pending', 'complete', 'failed'));

-- retainer_cycle_items: replace the nullable, on-delete-set-null template_id with an
-- on-delete-restrict source_template_item_id, mirroring project_checklist_items' pattern —
-- restrict is what makes provenance durable and is why template item edits/deletes must be
-- soft-delete rather than hard delete. source_template_version records which version of that item
-- produced this row. cycle_item_status gains 'closed' for the explicit "resolved, not carried
-- forward" outcome (Phase 6) distinct from completed/carried_forward/canceled.
alter table public.retainer_cycle_items add column source_template_item_id uuid references public.retainer_deliverable_templates (id) on delete restrict;
alter table public.retainer_cycle_items add column source_template_version integer;
update public.retainer_cycle_items set source_template_item_id = template_id, source_template_version = 1 where template_id is not null;
alter table public.retainer_cycle_items drop column template_id;
alter table public.retainer_cycle_items alter column source_template_item_id set not null;
alter table public.retainer_cycle_items alter column source_template_version set not null;
alter type public.cycle_item_status add value if not exists 'closed';

-- Two dedup keys, not one: a cycle can hold both a fresh item generated straight from a template
-- this period and a carried-forward item whose *original* source happens to be that same
-- template, so "one row per (cycle, template item)" would wrongly collide the two. Partial unique
-- indexes split them by carried_from_item_id, and are what let the atomic generation function
-- (Phase 3) use `on conflict do nothing` to make a resumed/retried generation converge instead of
-- erroring or duplicating.
create unique index retainer_cycle_items_fresh_source_key on public.retainer_cycle_items (cycle_id, source_template_item_id) where carried_from_item_id is null;
create unique index retainer_cycle_items_carry_key on public.retainer_cycle_items (cycle_id, carried_from_item_id) where carried_from_item_id is not null;
create index retainer_cycle_items_source_idx on public.retainer_cycle_items (source_template_item_id);

-- tasks: retainer-scoped tasks, mirroring the existing project_id link exactly.
alter table public.tasks add column retainer_id uuid references public.retainers (id) on delete set null;
create index tasks_retainer_idx on public.tasks (retainer_id);

create index retainer_templates_status_idx on public.retainer_deliverable_templates (retainer_id, archived_at, position);
