-- Sales receivables: track per-sale payment status separate from method.
-- Every new sale is a receivable (debitor) until finance confirms payment.
alter table public.sales
  add column if not exists payment_status text not null default 'unpaid',
  add column if not exists paid_at bigint,
  add column if not exists paid_by text;

-- Default method is now bank transfer (cash is the exception).
alter table public.sales alter column payment_method set default 'bank';

-- Backfill existing rows: legacy credit sales stay unpaid (debitor), everything
-- else is treated as already settled so history doesn't suddenly show as debt.
update public.sales
  set payment_status = case when payment_method = 'credit' then 'unpaid' else 'paid' end
  where payment_status is null or payment_status = 'unpaid';

update public.sales set paid_at = coalesce(ts, extract(epoch from created_at)*1000)::bigint
  where payment_status = 'paid' and paid_at is null;

create index if not exists sales_payment_status_idx on public.sales (payment_status);
