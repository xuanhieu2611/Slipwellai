-- Captures like "Change car oil at 2pm" need to keep the time-of-day, not just the date.
alter table public.tasks add column due_time time;
alter table public.prototype_records add column due_time time;
