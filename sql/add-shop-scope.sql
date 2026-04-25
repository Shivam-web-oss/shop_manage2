-- Add shop-level scoping for products, stock logs, bills, and staff access.
-- Run this after sql/staff-permissions.sql in the Supabase SQL editor.
-- The overall flow is:
-- 1. Add the new shop-related columns.
-- 2. Backfill old rows so existing data still works.
-- 3. Add indexes for faster shop-based lookups.
-- 4. Create a helper function to detect a staff member's active shop.
-- 5. Rebuild row-level security policies around that shop scope.

begin;

-- Staff can now be assigned directly to a single shop.
alter table if exists public.staff_permissions
  add column if not exists assigned_shop_id uuid references public.business(id) on delete set null;

-- Index the assignment column because permission checks will use it often.
create index if not exists idx_staff_permissions_assigned_shop on public.staff_permissions (assigned_shop_id);

-- Backfill old staff rows by linking them to the first business/shop owned by their owner account.
update public.staff_permissions sp
set assigned_shop_id = (
  select b.id
  from public.business b
  where b.user_id = sp.business_owner_id
  order by b.created_at asc, b.id asc
  limit 1
)
where sp.assigned_shop_id is null;

-- Products now need a `shop_id` so we can separate stock by shop.
alter table if exists public.products
  add column if not exists shop_id uuid references public.business(id) on delete cascade;

-- Backfill existing products using the old owner relationship.
update public.products p
set shop_id = (
  select b.id
  from public.business b
  where b.user_id = p.business_owner_id
  order by b.created_at asc, b.id asc
  limit 1
)
where p.shop_id is null;

-- After backfilling, every product must belong to a shop.
alter table if exists public.products
  alter column shop_id set not null;

-- Replace the old owner-based unique SKU rule with a shop-based one.
drop index if exists idx_products_owner_sku_unique;
create unique index if not exists idx_products_shop_sku_unique
  on public.products (shop_id, sku)
  where sku is not null and btrim(sku) <> '';

-- Common index for "products in this shop" queries.
create index if not exists idx_products_shop on public.products (shop_id);

-- Stock logs also need shop ownership.
alter table if exists public.stock_logs
  add column if not exists shop_id uuid references public.business(id) on delete cascade;

-- Backfill stock logs from the related product first, then fall back to the owner's business.
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

-- Once backfilled, every stock log must belong to a shop.
alter table if exists public.stock_logs
  alter column shop_id set not null;

-- Speed up stock-log lookups by shop.
create index if not exists idx_stock_logs_shop on public.stock_logs (shop_id);

-- Legacy bills need the same shop scoping.
alter table if exists public.bills
  add column if not exists shop_id uuid references public.business(id) on delete cascade;

-- Backfill old bills from the existing business-owner relation.
update public.bills b
set shop_id = (
  select business_row.id
  from public.business business_row
  where business_row.user_id = b.business_owner_id
  order by business_row.created_at asc, business_row.id asc
  limit 1
)
where b.shop_id is null;

-- After backfilling, every bill must point to a shop.
alter table if exists public.bills
  alter column shop_id set not null;

-- Bills are usually listed by shop and newest first.
create index if not exists idx_bills_shop_created_at on public.bills (shop_id, created_at desc);

-- Helper function: row-level security can call this to learn which shop a staff user belongs to.
create or replace function public.current_staff_shop_id()
returns uuid
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid(); -- Logged-in user's auth id.
  owner_id uuid := public.current_business_owner_id(); -- Business owner linked to the staff user.
  assigned_id uuid; -- Direct shop assignment from staff_permissions.
  fallback_id uuid; -- Backup shop id when there is exactly one possible shop.
  owned_shop_count integer := 0; -- Number of shops owned by the related business owner.
begin
  -- Only staff users should resolve to a staff shop. Everyone else returns null.
  if uid is null or public.current_user_role() <> 'staff' then
    return null;
  end if;

  -- Try the explicit staff-to-shop assignment first.
  select sp.assigned_shop_id
  into assigned_id
  from public.staff_permissions sp
  where sp.staff_user_id = uid
  limit 1;

  if assigned_id is not null then
    return assigned_id;
  end if;

  -- If there is no direct assignment, count how many shops the owner has.
  select count(*)
  into owned_shop_count
  from public.business b
  where b.user_id = owner_id;

  -- When there is exactly one shop, use it as the automatic fallback.
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

-- Allow authenticated users to call the helper function inside RLS policies.
grant execute on function public.current_staff_shop_id() to authenticated;

-- Business rows are visible to admins, the owning business user, or staff assigned to that shop.
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

-- Product reads are shop-scoped for admins, the owning business, and allowed staff.
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

-- Product inserts are limited to admins and the owning business account.
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

-- Product updates allow admins, the owning business, or staff with stock-update permission.
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

-- Product deletes stay restricted to admins and the owning business.
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

-- Stock-log reads follow reporting permissions inside the same shop.
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

-- Stock-log inserts follow stock-update permissions inside the same shop.
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

-- Bill reads are limited to admins, the owning business, or staff who can view reports.
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

-- Bill inserts are limited to admins, the owning business, or staff who can create bills.
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

-- Bill-item reads are allowed only when the parent bill is also visible to the user.
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

-- Bill-item inserts are allowed only when the parent bill could also be inserted by the user.
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
