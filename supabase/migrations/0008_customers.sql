-- Customers + accounts-receivable (payments) for the portals.
--
-- Sales already store a free-text `customer` name on each row. We keep that as
-- the identity key (trimmed name) instead of migrating every historical sale to
-- a foreign key. `customers` holds the extra managed info (phone/note/address);
-- `customer_payments` records money received against a customer.
--
-- Per the chosen model, EVERY non-voided sale is a receivable, so a customer's
-- outstanding balance = SUM(their non-voided sale totals) - SUM(their payments).
-- Payments are AR bookkeeping only — revenue is already counted at sale time, so
-- recording a payment must NOT change company finance/revenue KPIs.

create table if not exists public.customers (
  name       text primary key,
  phone      text,
  note       text,
  address    text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.customer_payments (
  id          text primary key,
  customer    text not null,
  amount      numeric not null,
  method      text not null default 'cash',
  note        text,
  ts          bigint not null,
  recorded_by text,
  created_at  timestamptz not null default now()
);

create index if not exists customer_payments_customer_idx on public.customer_payments (customer);

alter table public.customers enable row level security;
alter table public.customer_payments enable row level security;

drop policy if exists customers_select_auth on public.customers;
drop policy if exists customers_insert_auth on public.customers;
drop policy if exists customers_update_auth on public.customers;
drop policy if exists customers_delete_auth on public.customers;
create policy customers_select_auth on public.customers for select to authenticated using (true);
create policy customers_insert_auth on public.customers for insert to authenticated with check (true);
create policy customers_update_auth on public.customers for update to authenticated using (true) with check (true);
create policy customers_delete_auth on public.customers for delete to authenticated using (true);

drop policy if exists cust_pay_select_auth on public.customer_payments;
drop policy if exists cust_pay_insert_auth on public.customer_payments;
drop policy if exists cust_pay_update_auth on public.customer_payments;
drop policy if exists cust_pay_delete_auth on public.customer_payments;
create policy cust_pay_select_auth on public.customer_payments for select to authenticated using (true);
create policy cust_pay_insert_auth on public.customer_payments for insert to authenticated with check (true);
create policy cust_pay_update_auth on public.customer_payments for update to authenticated using (true) with check (true);
create policy cust_pay_delete_auth on public.customer_payments for delete to authenticated using (true);
