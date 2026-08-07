alter table public.tasks
  add column recurrence_interval smallint check (recurrence_interval is null or recurrence_interval between 1 and 30),
  add column recurrence_unit text check (recurrence_unit is null or recurrence_unit in ('days', 'weeks'));

-- A custom cadence needs both fields to compute its next date; every other cadence (including no
-- recurrence at all) leaves them null rather than inventing a default interval.
alter table public.tasks
  add constraint custom_recurrence_needs_interval check (
    recurrence_rule is distinct from 'custom' or (recurrence_interval is not null and recurrence_unit is not null)
  );
