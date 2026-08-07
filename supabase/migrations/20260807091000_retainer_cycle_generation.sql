-- Atomic, idempotent, resumable retainer cycle generation. See plan.md Phase 3 + 4.
--
-- The route handler still does the "what should exist" computation in TypeScript (which
-- templates apply, what a carried-forward item's title/date should be — logic already covered by
-- src/lib/retainers.ts and its tests) and hands the resulting rows to this function, which does
-- only the "make it exist" part as one statement-level transaction. Because it is a single plpgsql
-- call, a failure partway through rolls the whole attempt back automatically — there is no
-- code path that can leave a half-populated cycle. The `on conflict do nothing` upserts below
-- exist for a different reason: they make a *retried* call (same or resumed state) converge on
-- the same end result instead of erroring or duplicating, whether that retry is a network-level
-- double-submit or a resume against a cycle some other process left partially populated.
create or replace function public.generate_retainer_cycle(
  p_retainer_id uuid,
  p_cycle_start date,
  p_cycle_end date,
  p_idempotency_key text,
  p_new_items jsonb,
  p_carry_forward_items jsonb
) returns table (out_cycle_id uuid, out_cycle_start date, out_generation_status text)
language plpgsql
security invoker
as $$
declare
  v_cycle_id uuid;
begin
  insert into public.retainer_cycles (retainer_id, cycle_start, cycle_end, idempotency_key, generation_status)
  values (p_retainer_id, p_cycle_start, p_cycle_end, p_idempotency_key, 'pending')
  on conflict (retainer_id, cycle_start) do update set idempotency_key = excluded.idempotency_key, generation_status = 'pending'
  returning id into v_cycle_id;

  insert into public.retainer_cycle_items (cycle_id, source_template_item_id, source_template_version, title, expected_on)
  select v_cycle_id, (item->>'sourceTemplateItemId')::uuid, (item->>'sourceTemplateVersion')::integer, item->>'title', (item->>'expectedOn')::date
  from jsonb_array_elements(p_new_items) as item
  on conflict (cycle_id, source_template_item_id) where carried_from_item_id is null do nothing;

  insert into public.retainer_cycle_items (cycle_id, source_template_item_id, source_template_version, carried_from_item_id, title, expected_on)
  select v_cycle_id, (item->>'sourceTemplateItemId')::uuid, (item->>'sourceTemplateVersion')::integer, (item->>'carriedFromItemId')::uuid, item->>'title', (item->>'expectedOn')::date
  from jsonb_array_elements(p_carry_forward_items) as item
  on conflict (cycle_id, carried_from_item_id) where carried_from_item_id is not null do nothing;

  -- Re-derive which prior items were actually carried from this cycle's own rows rather than
  -- trusting the caller-supplied list, so a resumed run flips the same set every time.
  update public.retainer_cycle_items
  set status = 'carried_forward'
  where status = 'open'
    and id in (select carried_from_item_id from public.retainer_cycle_items where cycle_id = v_cycle_id and carried_from_item_id is not null);

  update public.retainer_cycles set generation_status = 'complete' where id = v_cycle_id;

  return query select v_cycle_id, p_cycle_start, 'complete'::text;
end;
$$;

revoke all on function public.generate_retainer_cycle(uuid, date, date, text, jsonb, jsonb) from public, anon;
grant execute on function public.generate_retainer_cycle(uuid, date, date, text, jsonb, jsonb) to authenticated;
