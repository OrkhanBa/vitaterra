-- Atomic stock adjustment by delta. Fixes the client read-modify-write race
-- that could lose a stock increment/decrement (e.g. voiding a sale left stock
-- one short) and cross-device drift. Also makes writes fail loudly instead of
-- silently updating 0 rows when there is no valid session.
--
-- Callers pass a delta: negative for a sale, positive for a void/restock.
-- SECURITY DEFINER so it can write under RLS, but EXECUTE is granted only to
-- authenticated users (anon is rejected).

create or replace function public.adjust_stock(
  p_product_id bigint,
  p_delta numeric,
  p_product_name text default null
) returns numeric
language plpgsql
security definer
set search_path = public
as $$
declare new_stock numeric;
begin
  insert into public.inventory (product_id, product_name, stock, updated_at)
  values (p_product_id, coalesce(p_product_name, p_product_id::text), p_delta, now())
  on conflict (product_id) do update
    set stock = public.inventory.stock + excluded.stock,
        product_name = coalesce(p_product_name, public.inventory.product_name),
        updated_at = now()
  returning stock into new_stock;
  return new_stock;
end $$;

revoke all on function public.adjust_stock(bigint, numeric, text) from public;
revoke all on function public.adjust_stock(bigint, numeric, text) from anon;
grant execute on function public.adjust_stock(bigint, numeric, text) to authenticated;

-- One-off correction: ZILAR 250 SC lost a void restore before this fix.
update public.inventory set stock = 1000, updated_at = now()
where product_id = 1 and stock = 999;
