-- Explicit rollover outcomes for retainer cycle items, beyond the default carry-forward. See
-- plan.md Phase 6. 'closed' (added to cycle_item_status back in 20260807090000) is the "resolved,
-- not carried forward" outcome. "Leave in prior cycle" needs a separate marker rather than a
-- status, because the item stays open (still incomplete, still visible as such) — it is only
-- excluded from the *next* generation's carry-forward selection, not resolved in any sense.
alter table public.retainer_cycle_items add column excluded_from_carry_forward boolean not null default false;
