-- TSK-01 tags, and a stable idempotency key for manual task creation (task plan 1, item D.1).
-- Deletion reuses the existing tasks.archived_at column as its soft-delete flag, matching every
-- other entity in this schema, so no new column is needed for delete/restore.
alter table public.tasks add column tags text[] not null default '{}';
alter table public.tasks add column idempotency_key text;
alter table public.tasks add constraint tasks_owner_idempotency_key_key unique (owner_id, idempotency_key);
