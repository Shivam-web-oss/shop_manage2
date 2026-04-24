-- Add shop-level scoping for products, stock logs, bills, and staff access.
-- Run this after sql/staff-permissions.sql in the Supabase SQL editor.

begin;

alter table if exists public.staff_permissions
  add column if not exists assigned_shop_id uuid references public.business(id) on delete set null;

create index if not exists idx_staff_permissions_assigned_shop on public.staff_permissions (assigned_shop_id);

update public.staff_permissions sp
set assigned_shop_id = (
  select b.id
  from public.business b
  where b.user_id = sp.business_owner_id
  order by b.created_at asc, b.id asc
  limit 1
)
where sp.assigned_shop_id is null;

alter table if exists public.products
  add column if not exists shop_id uuid references public.business(id) on delete cascade;

update public.products p
set shop_id = (
  select b.id
  from public.business b
  where b.user_id = p.business_owner_id
  order by b.created_at asc, b.id asc
  limit 1
)
where p.shop_id is null;

alter table if exists public.products
  alter column shop_id set not null;

drop index if exists idx_products_owner_sku_unique;
create unique index if not exists idx_products_shop_sku_unique
  on public.products (shop_id, sku)
  where sku is not null and btrim(sku) <> '';

create index if not exists idx_products_shop on public.products (shop_id);

alter table if exists public.stock_logs
  add column if not exists shop_id uuid references public.business(id) on delete cascade;

update public.stock_logs sl
set shop_id = coalesce(
  (
    select p.shop_id
    from public.products p
    where p.id = sl.product_id
    limit 1
  ),
  (
    select b.id
    from public.business b
    where b.user_id = sl.business_owner_id
    order by b.created_at asc, b.id asc
    limit 1
  )
)
where sl.shop_id is null;

alter table if exists public.stock_logs
  alter column shop_id set not null;

create index if not exists idx_stock_logs_shop on public.stock_logs (shop_id);

alter table if exists public.bills
  add column if not exists shop_id uuid references public.business(id) on delete cascade;

update public.bills b
set shop_id = (
  select business_row.id
  from public.business business_row
  where business_row.user_id = b.business_owner_id
  order by business_row.created_at asc, business_row.id asc
  limit 1
)
where b.shop_id is null;

alter table if exists public.bills
  alter column shop_id set not null;

create index if not exists idx_bills_shop_created_at on public.bills (shop_id, created_at desc);

create or replace function public.current_staff_shop_id()
returns uuid
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  owner_id uuid := public.current_business_owner_id();
  assigned_id uuid;
  fallback_id uuid;
  owned_shop_count integer := 0;
begin
  if uid is null or public.current_user_role() <> 'staff' then
    return null;
  end if;

  select sp.assigned_shop_id
  into assigned_id
  from public.staff_permissions sp
  where sp.staff_user_id = uid
  limit 1;

  if assigned_id is not null then
    return assigned_id;
  end if;

  select count(*)
  into owned_shop_count
  from public.business b
  where b.user_id = owner_id;

  if owned_shop_count = 1 then
    select b.id
    into fallback_id
    from public.business b
    where b.user_id = owner_id
    order by b.created_at asc, b.id asc
    limit 1;

    return fallback_id;
  end if;

  return null;
end;
$$;

grant execute on function public.current_staff_shop_id() to authenticated;

drop policy if exists "business_select" on public.business;
create policy "business_select"
on public.business
for select
to authenticated
using (
  public.current_user_role() = 'admin'
  or user_id = auth.uid()
  or (
    public.current_user_role() = 'staff'
    and id = public.current_staff_shop_id()
  )
);

drop policy if exists "products_select" on public.products;
create policy "products_select"
on public.products
for select
to authenticated
using (
  public.current_user_role() = 'admin'
  or (
    public.current_user_role() = 'business'
    and business_owner_id = auth.uid()
    and exists (
      select 1
      from public.business b
      where b.id = products.shop_id
        and b.user_id = auth.uid()
    )
  )
  or (
    public.current_user_role() = 'staff'
    and business_owner_id = public.current_business_owner_id()
    and shop_id = public.current_staff_shop_id()
  )
);

drop policy if exists "products_insert" on public.products;
create policy "products_insert"
on public.products
for insert
to authenticated
with check (
  public.current_user_role() = 'admin'
  or (
    public.current_user_role() = 'business'
    and business_owner_id = auth.uid()
    and exists (
      select 1
      from public.business b
      where b.id = products.shop_id
        and b.user_id = auth.uid()
    )
  )
);

drop policy if exists "products_update" on public.products;
create policy "products_update"
on public.products
for update
to authenticated
using (
  public.current_user_role() = 'admin'
  or (
    public.current_user_role() = 'business'
    and business_owner_id = auth.uid()
    and exists (
      select 1
      from public.business b
      where b.id = products.shop_id
        and b.user_id = auth.uid()
    )
  )
  or (
    public.current_user_role() = 'staff'
    and public.staff_can_update_stock()
    and business_owner_id = public.current_business_owner_id()
    and shop_id = public.current_staff_shop_id()
  )
)
with check (
  public.current_user_role() = 'admin'
  or (
    public.current_user_role() = 'business'
    and business_owner_id = auth.uid()
    and exists (
      select 1
      from public.business b
      where b.id = products.shop_id
        and b.user_id = auth.uid()
    )
  )
  or (
    public.current_user_role() = 'staff'
    and public.staff_can_update_stock()
    and business_owner_id = public.current_business_owner_id()
    and shop_id = public.current_staff_shop_id()
  )
);

drop policy if exists "products_delete" on public.products;
create policy "products_delete"
on public.products
for delete
to authenticated
using (
  public.current_user_role() = 'admin'
  or (
    public.current_user_role() = 'business'
    and business_owner_id = auth.uid()
    and exists (
      select 1
      from public.business b
      where b.id = products.shop_id
        and b.user_id = auth.uid()
    )
  )
);

drop policy if exists "stock_logs_select" on public.stock_logs;
create policy "stock_logs_select"
on public.stock_logs
for select
to authenticated
using (
  public.current_user_role() = 'admin'
  or (
    public.current_user_role() = 'business'
    and business_owner_id = auth.uid()
    and exists (
      select 1
      from public.business b
      where b.id = stock_logs.shop_id
        and b.user_id = auth.uid()
    )
  )
  or (
    public.current_user_role() = 'staff'
    and public.staff_can_view_reports()
    and business_owner_id = public.current_business_owner_id()
    and shop_id = public.current_staff_shop_id()
  )
);

drop policy if exists "stock_logs_insert" on public.stock_logs;
create policy "stock_logs_insert"
on public.stock_logs
for insert
to authenticated
with check (
  public.current_user_role() = 'admin'
  or (
    public.current_user_role() = 'business'
    and business_owner_id = auth.uid()
    and exists (
      select 1
      from public.business b
      where b.id = stock_logs.shop_id
        and b.user_id = auth.uid()
    )
  )
  or (
    public.current_user_role() = 'staff'
    and public.staff_can_update_stock()
    and business_owner_id = public.current_business_owner_id()
    and shop_id = public.current_staff_shop_id()
  )
);

drop policy if exists "bills_select" on public.bills;
create policy "bills_select"
on public.bills
for select
to authenticated
using (
  public.current_user_role() = 'admin'
  or (
    public.current_user_role() = 'business'
    and business_owner_id = auth.uid()
    and exists (
      select 1
      from public.business b
      where b.id = bills.shop_id
        and b.user_id = auth.uid()
    )
  )
  or (
    public.current_user_role() = 'staff'
    and public.staff_can_view_reports()
    and business_owner_id = public.current_business_owner_id()
    and shop_id = public.current_staff_shop_id()
  )
);

drop policy if exists "bills_insert" on public.bills;
create policy "bills_insert"
on public.bills
for insert
to authenticated
with check (
  public.current_user_role() = 'admin'
  or (
    public.current_user_role() = 'business'
    and business_owner_id = auth.uid()
    and exists (
      select 1
      from public.business b
      where b.id = bills.shop_id
        and b.user_id = auth.uid()
    )
  )
  or (
    public.current_user_role() = 'staff'
    and public.staff_can_create_bill()
    and business_owner_id = public.current_business_owner_id()
    and shop_id = public.current_staff_shop_id()
  )
);

drop policy if exists "bill_items_select" on public.bill_items;
create policy "bill_items_select"
on public.bill_items
for select
to authenticated
using (
  exists (
    select 1
    from public.bills b
    where b.id = bill_items.bill_id
      and (
        public.current_user_role() = 'admin'
        or (
          public.current_user_role() = 'business'
          and b.business_owner_id = auth.uid()
          and exists (
            select 1
            from public.business business_row
            where business_row.id = b.shop_id
              and business_row.user_id = auth.uid()
          )
        )
        or (
          public.current_user_role() = 'staff'
          and public.staff_can_view_reports()
          and b.business_owner_id = public.current_business_owner_id()
          and b.shop_id = public.current_staff_shop_id()
        )
      )
  )
);

drop policy if exists "bill_items_insert" on public.bill_items;
create policy "bill_items_insert"
on public.bill_items
for insert
to authenticated
with check (
  exists (
    select 1
    from public.bills b
    where b.id = bill_items.bill_id
      and (
        public.current_user_role() = 'admin'
        or (
          public.current_user_role() = 'business'
          and b.business_owner_id = auth.uid()
          and exists (
            select 1
            from public.business business_row
            where business_row.id = b.shop_id
              and business_row.user_id = auth.uid()
          )
        )
        or (
          public.current_user_role() = 'staff'
          and public.staff_can_create_bill()
          and b.business_owner_id = public.current_business_owner_id()
          and b.shop_id = public.current_staff_shop_id()
        )
      )
  )
);

commit;
