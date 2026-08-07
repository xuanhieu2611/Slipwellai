-- Template items can now be edited and removed. A hard delete is not viable once
-- an item has been applied to a project: project_checklist_items.source_template_item_id
-- references this table with `on delete restrict`, and the whole point of that
-- constraint is to keep an applied checklist's provenance intact. Soft-delete via
-- archived_at, matching every other entity in this schema, sidesteps the FK entirely
-- and lets "removed from the template" and "still real history on past projects"
-- both be true at once.
alter table public.project_checklist_template_items add column archived_at timestamptz;
