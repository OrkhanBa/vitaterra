-- Qusar shop (Dükan) sub-ledger. Aygun moves some warehouse stock to a physical
-- shop in Qusar and sells it there to end customers. The transfer itself is
-- recorded as a normal sale to the "Dükan (Qusar)" customer on the main sales
-- page (so it decrements warehouse stock and counts in our finance exactly once).
--
-- This table is a SEPARATE ledger for the shop's own stock + its end-customer
-- sales. It never feeds into the main sales/activity tables, so it has no effect
-- on company finance/KPIs. Prices here are set/edited by hand in the Dükan tab.
--
-- Singleton JSONB snapshot (id = 1), same shape/pattern as site_catalog:
--   data = { "inventory": [ { productId, name, qty, price, unit } ],
--            "sales":     [ { id, ts, customer, items:[...], total } ] }

create table if not exists public.shop_ledger (
  id         integer primary key default 1,
  data       jsonb not null default '{"inventory":[],"sales":[]}'::jsonb,
  updated_at timestamptz not null default now(),
  constraint shop_ledger_singleton check (id = 1)
);

alter table public.shop_ledger enable row level security;

drop policy if exists shop_ledger_select_auth on public.shop_ledger;
drop policy if exists shop_ledger_insert_auth on public.shop_ledger;
drop policy if exists shop_ledger_update_auth on public.shop_ledger;

create policy shop_ledger_select_auth on public.shop_ledger
  for select to authenticated using (true);
create policy shop_ledger_insert_auth on public.shop_ledger
  for insert to authenticated with check (true);
create policy shop_ledger_update_auth on public.shop_ledger
  for update to authenticated using (true) with check (true);

-- Seed the singleton row so the first client upsert is a plain update.
insert into public.shop_ledger (id, data)
values (1, '{"inventory":[],"sales":[]}'::jsonb)
on conflict (id) do nothing;
