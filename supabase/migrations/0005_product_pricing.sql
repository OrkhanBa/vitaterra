-- Secret pricing inputs (cost + markup) live here, NOT in the public
-- products.json / products-data.js / index.html anymore. Only authenticated
-- users (sales / finance / admin) may read or write; anon has no access.
-- The public storefront uses the precomputed products.json `priceAznNet` and
-- never sees cost or margin.

create table if not exists public.product_pricing (
  product_id bigint primary key,
  cost       numeric not null default 0,
  markup     numeric not null default 30,
  updated_at timestamptz not null default now()
);

alter table public.product_pricing enable row level security;

drop policy if exists product_pricing_select_auth on public.product_pricing;
drop policy if exists product_pricing_insert_auth on public.product_pricing;
drop policy if exists product_pricing_update_auth on public.product_pricing;

create policy product_pricing_select_auth on public.product_pricing
  for select to authenticated using (true);
create policy product_pricing_insert_auth on public.product_pricing
  for insert to authenticated with check (true);
create policy product_pricing_update_auth on public.product_pricing
  for update to authenticated using (true) with check (true);

-- Seed from the values previously (and insecurely) committed in products.json.
insert into public.product_pricing (product_id, cost, markup) values
  (1, 6.74, 567.7),
  (2, 3.92, 180.6),
  (3, 6.14, 111.7),
  (4, 34.06, 46.8),
  (5, 9.34, 71.3),
  (6, 23, 30.4),
  (7, 21, 42.9),
  (8, 9.54, 109.6),
  (9, 12.56, 138.9),
  (10, 38.08, 31.3),
  (11, 6.25, 76),
  (12, 7.5, 46.7),
  (13, 18.65, 60.9),
  (14, 6, 33.3),
  (15, 7.38, 35.5),
  (16, 30, 33.3),
  (17, 6.82, 32),
  (18, 43.5, 19.5),
  (19, 11.91, 9.2),
  (20, 26, 92.3),
  (21, 8.64, 27.3),
  (22, 13.08, 37.6),
  (23, 28, 132.1),
  (24, 29.38, 36.1),
  (25, 8.87, 69.1),
  (26, 12.06, 41),
  (27, 9.85, 32),
  (28, 6.71, 49),
  (29, 8.38, 31.3),
  (30, 28, 132.1),
  (31, 7.54, 32.6),
  (32, 14.62, 36.8),
  (33, 22, 59.1),
  (34, 34.09, 32),
  (35, 59.89, 16.9),
  (36, 10.93, 83),
  (37, 8.1, 85.2),
  (38, 9.02, 66.3),
  (39, 16.92, 24.1),
  (40, 16.71, 19.7),
  (41, 17.03, 46.8),
  (42, 13.11, 37.3),
  (43, 13.63, 46.7),
  (44, 195, 23.1),
  (45, 16.51, 51.4)
on conflict (product_id) do update
  set cost = excluded.cost, markup = excluded.markup, updated_at = now();
