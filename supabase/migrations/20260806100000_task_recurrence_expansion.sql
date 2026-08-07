-- TSK-03: widen recurrence to daily, weekly, monthly, yearly, weekdays (Mon-Fri only), and a
-- limited custom interval, per the PRD wording. Existing daily/weekly/monthly rows are untouched.
-- Split into its own migration: Postgres will not let a later statement in the same transaction
-- reference a newly added enum value (a CHECK constraint added below, in the next migration, needs
-- to compare against 'custom').
alter type public.recurrence_frequency add value if not exists 'yearly';
alter type public.recurrence_frequency add value if not exists 'weekdays';
alter type public.recurrence_frequency add value if not exists 'custom';
