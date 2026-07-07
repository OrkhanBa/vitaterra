-- Stock integrity: make every inventory change safe and auditable.
--
-- Root cause this fixes: voiding a sale used to reverse stock only on the app
-- code path (undoSale/adminDeleteSale -> adjust_stock RPC). A direct DB void
-- (e.g. a bulk "AI reconciliation" that set voided = true) never returned the
-- stock, so inventory silently drifted (Predador 220 lost ~1700 L).
--
-- Now a database TRIGGER is the single authority for reversing stock on
-- void / un-void / delete, no matter how the change is made (app, raw SQL,
-- bulk job). The app must therefore stop reversing stock itself on those paths.

-- 1) pack_mult: lets the DB convert a sale's package qty -> base units (kg/L).
alter table public.inventory add column if not exists pack_mult numeric not null default 1;

update public.inventory i set pack_mult = m.mult from (values
  (1,1.0),(2,1.0),(3,1.0),(4,1.0),(5,1.0),(6,0.5),(7,1.0),(8,1.0),(9,1.0),(10,0.5),
  (11,1.0),(12,10.0),(13,0.5),(14,5.0),(15,1.0),(16,1.0),(17,1.0),(18,1.0),(19,1.0),(20,0.5),
  (21,1.0),(22,1.0),(23,1.0),(24,0.5),(25,1.0),(26,1.0),(27,5.0),(28,1.0),(29,1.0),(30,1.0),
  (31,0.5),(32,1.0),(33,1.0),(34,1.0),(35,0.5),(36,1.0),(37,1.0),(38,1.0),(39,1.0),(40,1.0),
  (41,1.0),(42,1.0),(43,1.0),(44,0.5),(45,1.0),(46,1.0),(47,1.0)
) as m(product_id, mult) where i.product_id = m.product_id;

-- 2) stock_movements: append-only ledger of every inventory change.
create table if not exists public.stock_movements (
  id bigserial primary key,
  product_id bigint not null,
  product_name text,
  delta numeric not null,
  new_stock numeric,
  reason text not null default 'adjust',
  sale_ts bigint,
  actor text,
  created_at timestamptz not null default now()
);
create index if not exists stock_movements_product_idx on public.stock_movements (product_id, created_at desc);

alter table public.stock_movements enable row level security;
drop policy if exists stock_movements_select on public.stock_movements;
create policy stock_movements_select on public.stock_movements for select to authenticated using (true);
drop policy if exists stock_movements_insert on public.stock_movements;
create policy stock_movements_insert on public.stock_movements for insert to authenticated with check (true);

-- 3) adjust_stock now records a ledger row for every change it makes.
--    Signature unchanged (4 args) so the deployed client keeps working.
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

  insert into public.stock_movements (product_id, product_name, delta, new_stock, reason)
  values (p_product_id, coalesce(p_product_name, p_product_id::text), p_delta, new_stock,
          case when p_delta < 0 then 'sale' else 'adjust' end);

  return new_stock;
end $$;

revoke all on function public.adjust_stock(bigint, numeric, text, boolean) from public;
revoke all on function public.adjust_stock(bigint, numeric, text, boolean) from anon;
grant execute on function public.adjust_stock(bigint, numeric, text, boolean) to authenticated;

-- 4) Trigger: reverse inventory whenever a sale is voided / un-voided / deleted.
--    This is the single source of truth for those reversals.
create or replace function public.sales_stock_reverse()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  mult numeric; base numeric; ns numeric;
  v_reason text; v_delta numeric;
  v_pid bigint; v_pname text; v_qty numeric; v_ts bigint; v_actor text;
begin
  if tg_op = 'UPDATE' then
    if OLD.voided is distinct from NEW.voided then
      v_pid := NEW.product_id; v_pname := NEW.product_name; v_qty := coalesce(NEW.qty,0);
      v_ts := NEW.ts; v_actor := NEW.voided_by;
      if NEW.voided then v_reason := 'void_restore'; else v_reason := 'unvoid_decrement'; end if;
    else
      return NEW;
    end if;
  elsif tg_op = 'DELETE' then
    if OLD.voided = false then
      v_pid := OLD.product_id; v_pname := OLD.product_name; v_qty := coalesce(OLD.qty,0);
      v_ts := OLD.ts; v_actor := 'deleted'; v_reason := 'delete_restore';
    else
      return OLD;
    end if;
  else
    return null;
  end if;

  select coalesce(pack_mult,1) into mult from public.inventory where product_id = v_pid;
  mult := coalesce(mult,1);
  base := v_qty * mult;
  if v_reason = 'unvoid_decrement' then v_delta := -base; else v_delta := base; end if;

  insert into public.inventory (product_id, product_name, stock, updated_at)
  values (v_pid, coalesce(v_pname, v_pid::text), v_delta, now())
  on conflict (product_id) do update
    set stock = public.inventory.stock + excluded.stock, updated_at = now()
  returning stock into ns;

  insert into public.stock_movements (product_id, product_name, delta, new_stock, reason, sale_ts, actor)
  values (v_pid, v_pname, v_delta, ns, v_reason, v_ts, v_actor);

  if tg_op = 'DELETE' then return OLD; end if;
  return NEW;
end $$;

drop trigger if exists trg_sales_stock_reverse on public.sales;
create trigger trg_sales_stock_reverse
after update or delete on public.sales
for each row execute function public.sales_stock_reverse();
