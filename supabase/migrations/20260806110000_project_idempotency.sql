-- A stable idempotency key for manual project creation, mirroring
-- 20260806090000_task_tags_and_idempotency.sql's tasks.idempotency_key.
-- Deletion reuses the existing projects.archived_at column as its soft-delete
-- flag, matching every other entity in this schema, so no new column is needed.
alter table public.projects add column idempotency_key text;
alter table public.projects add constraint projects_owner_idempotency_key_key unique (owner_id, idempotency_key);
