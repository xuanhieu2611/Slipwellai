do $$ begin create type public.recurrence_frequency as enum ('daily', 'weekly', 'monthly'); exception when duplicate_object then null; end $$;

alter table public.tasks
  add column recurrence_rule public.recurrence_frequency,
  add column recurrence_root_id uuid references public.tasks (id) on delete set null,
  add column recurrence_anchor date;

alter table public.tasks
  add constraint recurring_tasks_need_anchor check (recurrence_rule is null or recurrence_anchor is not null);

create unique index tasks_recurrence_occurrence_idx
  on public.tasks (recurrence_root_id, recurrence_anchor)
  where recurrence_root_id is not null and recurrence_anchor is not null;
