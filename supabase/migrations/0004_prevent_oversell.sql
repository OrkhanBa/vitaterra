-- Prevent overselling: add an optional guard to adjust_stock so a decrement can
-- never drive stock below zero. Sales pass p_allow_negative = false; concurrent
-- sales that would oversell are rejected atomically (the row-level UPDATE holds a
-- lock, so the check sees a consistent value) instead of both succeeding and
-- driving inventory negative.
--
-- Voids / restocks / admin edits keep the previous behaviour via the default
-- (p_allow_negative = true). The 4th parameter has a default so the currently
-- deployed client (which calls with 3 args) keeps working after this migration
-- with no downtime.

drop function if exists public.adjust_stock(bigint, numeric, text);

create or replace function public.adjust_stock(
  p_product_id bigint,
  p_delta numeric,
  p_product_name text default null,
  p_allow_negative boolean default true
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

  if (not p_allow_negative) and new_stock < 0 then
    raise exception 'insufficient_stock' using errcode = 'check_violation';
  end if;

  return new_stock;
end $$;

revoke all on function public.adjust_stock(bigint, numeric, text, boolean) from public;
revoke all on function public.adjust_stock(bigint, numeric, text, boolean) from anon;
grant execute on function public.adjust_stock(bigint, numeric, text, boolean) to authenticated;
