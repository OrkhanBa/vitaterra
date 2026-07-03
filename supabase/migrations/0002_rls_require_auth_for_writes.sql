-- Lock down Row Level Security so ONLY authenticated users (logged-in sales /
-- finance / admin) can read/write business data. The public storefront stays
-- anonymous and may only READ the inventory table (to show stock).
--
-- IMPORTANT: apply this ONLY after the new authenticating client is deployed
-- and verified live, otherwise the currently-deployed anon-key client breaks.

-- inventory: public may read stock; writes require a logged-in user.
drop policy if exists inventory_insert_anon on public.inventory;
drop policy if exists inventory_update_anon on public.inventory;
drop policy if exists inventory_select_anon on public.inventory;
create policy inventory_select_all   on public.inventory for select to anon, authenticated using (true);
create policy inventory_insert_auth  on public.inventory for insert to authenticated with check (true);
create policy inventory_update_auth  on public.inventory for update to authenticated using (true) with check (true);

-- sales: authenticated only (no public access at all).
drop policy if exists sales_insert_anon on public.sales;
drop policy if exists sales_select_anon on public.sales;
drop policy if exists sales_update_anon on public.sales;
create policy sales_select_auth on public.sales for select to authenticated using (true);
create policy sales_insert_auth on public.sales for insert to authenticated with check (true);
create policy sales_update_auth on public.sales for update to authenticated using (true) with check (true);

-- activity_log: authenticated only; append + read (no update/delete).
drop policy if exists activity_log_insert_anon on public.activity_log;
drop policy if exists activity_log_select_anon on public.activity_log;
create policy activity_log_select_auth on public.activity_log for select to authenticated using (true);
create policy activity_log_insert_auth on public.activity_log for insert to authenticated with check (true);

-- expenses: authenticated only.
drop policy if exists expenses_insert_anon on public.expenses;
drop policy if exists expenses_select_anon on public.expenses;
drop policy if exists expenses_update_anon on public.expenses;
create policy expenses_select_auth on public.expenses for select to authenticated using (true);
create policy expenses_insert_auth on public.expenses for insert to authenticated with check (true);
create policy expenses_update_auth on public.expenses for update to authenticated using (true) with check (true);

-- warehouse_status_log: authenticated only; append + read.
drop policy if exists warehouse_status_log_insert_anon on public.warehouse_status_log;
drop policy if exists warehouse_status_log_select_anon on public.warehouse_status_log;
create policy warehouse_status_log_select_auth on public.warehouse_status_log for select to authenticated using (true);
create policy warehouse_status_log_insert_auth on public.warehouse_status_log for insert to authenticated with check (true);
