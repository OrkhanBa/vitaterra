-- Authoritative catalog snapshot in Supabase so admin/sales/finance portals
-- share one source of truth for product content instead of relying on each
-- device's localStorage draft + the last GitHub publish (which was
-- last-write-wins and did not propagate across devices until a redeploy).
--
-- The snapshot holds only public/non-sensitive catalog content (the same shape
-- written to products.json — no cost/markup). The public storefront keeps
-- reading the CDN products.json (fast + resilient); the portals prefer this
-- fresher snapshot and fall back to products.json if it is unavailable.

create table if not exists public.site_catalog (
  id         integer primary key default 1,
  data       jsonb not null,
  updated_at timestamptz not null default now(),
  constraint site_catalog_singleton check (id = 1)
);

alter table public.site_catalog enable row level security;

drop policy if exists site_catalog_select_auth on public.site_catalog;
drop policy if exists site_catalog_insert_auth on public.site_catalog;
drop policy if exists site_catalog_update_auth on public.site_catalog;

create policy site_catalog_select_auth on public.site_catalog
  for select to authenticated using (true);
create policy site_catalog_insert_auth on public.site_catalog
  for insert to authenticated with check (true);
create policy site_catalog_update_auth on public.site_catalog
  for update to authenticated using (true) with check (true);

-- Seeded on first admin visit (client upserts current products.json), then on
-- every publish thereafter.
