alter table public.tasks
  add column slipping_cadence_days smallint check (slipping_cadence_days between 1 and 365);

update public.slipping_signals
  set entity_type = 'retainer_cycle_item'
  where entity_type = 'retainer';
