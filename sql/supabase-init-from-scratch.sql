-- ============================================================
-- SHOP MANAGER - SUPABASE INIT (FROM SCRATCH)
-- Run this in Supabase SQL Editor on a fresh project.
-- ============================================================

create extension if not exists pgcrypto;

-- ------------------------------------------------------------
-- Core user tables
-- ------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  email text unique,
  role text not null default 'business' check (lower(role) in ('admin', 'business', 'staff')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.user_roles (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  role text not null check (lower(role) in ('admin', 'business', 'staff')),
  created_at timestamptz not null default now()
);

create table if not exists public.staff_permissions (
  id uuid primary key default gen_random_uuid(),
  staff_user_id uuid not null unique references public.profiles(id) on delete cascade,
  business_owner_id uuid not null references public.profiles(id) on delete cascade,
  can_create_bill boolean not null default true,
  can_update_stock boolean not null default true,
  can_view_reports boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint staff_not_owner check (staff_user_id <> business_owner_id)
);

create index if not exists idx_staff_permissions_owner on public.staff_permissions (business_owner_id);
create index if not exists idx_staff_permissions_staff on public.staff_permissions (staff_user_id);

-- ------------------------------------------------------------
-- Helper auth/permission functions
-- ------------------------------------------------------------
create or replace function public.current_user_role()
returns text
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  profile_role text;
  metadata_role text;
begin
  select lower(p.role) into profile_role
  from public.profiles p
  where p.id = auth.uid();

  metadata_role := lower(coalesce(auth.jwt() -> 'user_metadata' ->> 'role', ''));

  if profile_role in ('admin', 'business', 'staff') then
    return profile_role;
  end if;

  if metadata_role = 'bussiness' then
    return 'business';
  end if;

  if metadata_role in ('admin', 'business', 'staff') then
    return metadata_role;
  end if;

  return 'business';
end;
$$;

create or replace function public.current_business_owner_id()
returns uuid
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  role text := public.current_user_role();
  owner_id uuid;
begin
  if uid is null then
    return null;
  end if;

  if role = 'business' then
    return uid;
  end if;

  if role = 'staff' then
    select sp.business_owner_id
    into owner_id
    from public.staff_permissions sp
    where sp.staff_user_id = uid
    limit 1;
    return owner_id;
  end if;

  return uid;
end;
$$;

create or replace function public.staff_can_create_bill()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select sp.can_create_bill from public.staff_permissions sp where sp.staff_user_id = auth.uid() limit 1),
    false
  );
$$;

create or replace function public.staff_can_update_stock()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select sp.can_update_stock from public.staff_permissions sp where sp.staff_user_id = auth.uid() limit 1),
    false
  );
$$;

create or replace function public.staff_can_view_reports()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select sp.can_view_reports from public.staff_permissions sp where sp.staff_user_id = auth.uid() limit 1),
    false
  );
$$;

grant execute on function public.current_user_role() to authenticated;
grant execute on function public.current_business_owner_id() to authenticated;
grant execute on function public.staff_can_create_bill() to authenticated;
grant execute on function public.staff_can_update_stock() to authenticated;
grant execute on function public.staff_can_view_reports() to authenticated;

-- ------------------------------------------------------------
-- Business + inventory + billing tables
-- ------------------------------------------------------------
create table if not exists public.business (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  company_name text not null,
  shop_name text not null,
  location text not null,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_business_user_id on public.business (user_id);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  business_owner_id uuid not null default public.current_business_owner_id() references public.profiles(id) on delete cascade,
  name text not null,
  sku text,
  category text,
  price numeric(10,2) not null default 0 check (price >= 0),
  quantity integer not null default 0 check (quantity >= 0),
  unit text default 'pcs',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists idx_products_owner_sku_unique
  on public.products (business_owner_id, sku)
  where sku is not null and btrim(sku) <> '';

create index if not exists idx_products_owner on public.products (business_owner_id);

create table if not exists public.stock_logs (
  id uuid primary key default gen_random_uuid(),
  business_owner_id uuid not null default public.current_business_owner_id() references public.profiles(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  quantity_added integer not null,
  note text,
  updated_at timestamptz not null default now()
);

create index if not exists idx_stock_logs_owner on public.stock_logs (business_owner_id);
create index if not exists idx_stock_logs_product on public.stock_logs (product_id);

create table if not exists public.bills (
  id uuid primary key default gen_random_uuid(),
  business_owner_id uuid not null default public.current_business_owner_id() references public.profiles(id) on delete cascade,
  created_by uuid default auth.uid() references public.profiles(id) on delete set null,
  customer_name text default 'Walk-in',
  customer_phone text,
  subtotal numeric(10,2) not null default 0,
  discount_percent numeric(5,2) not null default 0,
  discount_amount numeric(10,2) not null default 0,
  gst_amount numeric(10,2) not null default 0,
  total_amount numeric(10,2) not null default 0,
  payment_method text not null default 'cash' check (lower(payment_method) in ('cash', 'upi', 'card', 'credit')),
  status text not null default 'paid' check (lower(status) in ('paid', 'pending', 'cancelled')),
  created_at timestamptz not null default now()
);

create index if not exists idx_bills_owner_created_at on public.bills (business_owner_id, created_at desc);

create table if not exists public.bill_items (
  id uuid primary key default gen_random_uuid(),
  bill_id uuid not null references public.bills(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  product_name text not null,
  quantity integer not null check (quantity > 0),
  unit_price numeric(10,2) not null check (unit_price >= 0),
  total_price numeric(10,2) not null check (total_price >= 0),
  created_at timestamptz not null default now()
);

create index if not exists idx_bill_items_bill_id on public.bill_items (bill_id);

-- ------------------------------------------------------------
-- Common triggers/functions
-- ------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create or replace function public.normalize_role_value(role_value text)
returns text
language sql
immutable
as $$
  select case
    when lower(coalesce(role_value, 'business')) = 'bussiness' then 'business'
    when lower(coalesce(role_value, 'business')) in ('admin', 'business', 'staff') then lower(role_value)
    else 'business'
  end;
$$;

create or replace function public.normalize_profile_role_trigger()
returns trigger
language plpgsql
as $$
begin
  new.role := public.normalize_role_value(new.role);
  return new;
end;
$$;

create or replace function public.prevent_non_admin_role_change()
returns trigger
language plpgsql
as $$
begin
  if new.role is distinct from old.role and public.current_user_role() <> 'admin' then
    new.role := old.role;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_profiles_normalize_role on public.profiles;
create trigger trg_profiles_normalize_role
before insert or update on public.profiles
for each row
execute function public.normalize_profile_role_trigger();

drop trigger if exists trg_profiles_prevent_role_change on public.profiles;
create trigger trg_profiles_prevent_role_change
before update on public.profiles
for each row
execute function public.prevent_non_admin_role_change();

drop trigger if exists trg_profiles_updated_at on public.profiles;
create trigger trg_profiles_updated_at
before update on public.profiles
for each row
execute function public.set_updated_at();

drop trigger if exists trg_business_updated_at on public.business;
create trigger trg_business_updated_at
before update on public.business
for each row
execute function public.set_updated_at();

drop trigger if exists trg_products_updated_at on public.products;
create trigger trg_products_updated_at
before update on public.products
for each row
execute function public.set_updated_at();

drop trigger if exists trg_staff_permissions_updated_at on public.staff_permissions;
create trigger trg_staff_permissions_updated_at
before update on public.staff_permissions
for each row
execute function public.set_updated_at();

-- ------------------------------------------------------------
-- RPC functions used by app
-- ------------------------------------------------------------
create or replace function public.increment_stock(product_id uuid, add_qty integer)
returns void
language plpgsql
as $$
begin
  if add_qty is null or add_qty <= 0 then
    return;
  end if;

  update public.products
  set quantity = quantity + add_qty,
      updated_at = now()
  where id = product_id;
end;
$$;

create or replace function public.decrement_stock(product_id uuid, remove_qty integer)
returns void
language plpgsql
as $$
begin
  if remove_qty is null or remove_qty <= 0 then
    return;
  end if;

  update public.products
  set quantity = greatest(quantity - remove_qty, 0),
      updated_at = now()
  where id = product_id;
end;
$$;

grant execute on function public.increment_stock(uuid, integer) to authenticated;
grant execute on function public.decrement_stock(uuid, integer) to authenticated;

-- ------------------------------------------------------------
-- Auto-create profile + user_roles when auth user is created
-- ------------------------------------------------------------
create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  new_role text;
begin
  new_role := public.normalize_role_value(new.raw_user_meta_data ->> 'role');

  insert into public.profiles (id, full_name, email, role, created_at, updated_at)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.email),
    new.email,
    new_role,
    now(),
    now()
  )
  on conflict (id) do update
    set full_name = excluded.full_name,
        email = excluded.email,
        role = excluded.role,
        updated_at = now();

  insert into public.user_roles (user_id, role, created_at)
  values (new.id, new_role, now())
  on conflict (user_id) do update
    set role = excluded.role;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row
execute function public.handle_new_auth_user();

-- ------------------------------------------------------------
-- RLS
-- ------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.user_roles enable row level security;
alter table public.staff_permissions enable row level security;
alter table public.business enable row level security;
alter table public.products enable row level security;
alter table public.stock_logs enable row level security;
alter table public.bills enable row level security;
alter table public.bill_items enable row level security;

-- profiles
drop policy if exists "profiles_select_own_or_admin" on public.profiles;
create policy "profiles_select_own_or_admin"
on public.profiles
for select
to authenticated
using (auth.uid() = id or public.current_user_role() = 'admin');

drop policy if exists "profiles_update_own_or_admin" on public.profiles;
create policy "profiles_update_own_or_admin"
on public.profiles
for update
to authenticated
using (auth.uid() = id or public.current_user_role() = 'admin')
with check (auth.uid() = id or public.current_user_role() = 'admin');

drop policy if exists "profiles_insert_self_or_admin" on public.profiles;
create policy "profiles_insert_self_or_admin"
on public.profiles
for insert
to authenticated
with check (auth.uid() = id or public.current_user_role() = 'admin');

-- user_roles
drop policy if exists "user_roles_select_own_or_admin" on public.user_roles;
create policy "user_roles_select_own_or_admin"
on public.user_roles
for select
to authenticated
using (auth.uid() = user_id or public.current_user_role() = 'admin');

-- staff_permissions
drop policy if exists "staff_permissions_select" on public.staff_permissions;
create policy "staff_permissions_select"
on public.staff_permissions
for select
to authenticated
using (
  public.current_user_role() = 'admin'
  or business_owner_id = auth.uid()
  or staff_user_id = auth.uid()
);

drop policy if exists "staff_permissions_insert" on public.staff_permissions;
create policy "staff_permissions_insert"
on public.staff_permissions
for insert
to authenticated
with check (
  public.current_user_role() = 'admin'
  or (public.current_user_role() = 'business' and business_owner_id = auth.uid())
);

drop policy if exists "staff_permissions_update" on public.staff_permissions;
create policy "staff_permissions_update"
on public.staff_permissions
for update
to authenticated
using (
  public.current_user_role() = 'admin'
  or (public.current_user_role() = 'business' and business_owner_id = auth.uid())
)
with check (
  public.current_user_role() = 'admin'
  or (public.current_user_role() = 'business' and business_owner_id = auth.uid())
);

drop policy if exists "staff_permissions_delete" on public.staff_permissions;
create policy "staff_permissions_delete"
on public.staff_permissions
for delete
to authenticated
using (
  public.current_user_role() = 'admin'
  or (public.current_user_role() = 'business' and business_owner_id = auth.uid())
);

-- business
drop policy if exists "business_select" on public.business;
create policy "business_select"
on public.business
for select
to authenticated
using (
  public.current_user_role() = 'admin'
  or user_id = auth.uid()
);

drop policy if exists "business_insert" on public.business;
create policy "business_insert"
on public.business
for insert
to authenticated
with check (
  public.current_user_role() = 'admin'
  or (public.current_user_role() = 'business' and user_id = auth.uid())
);

drop policy if exists "business_update" on public.business;
create policy "business_update"
on public.business
for update
to authenticated
using (
  public.current_user_role() = 'admin'
  or (public.current_user_role() = 'business' and user_id = auth.uid())
)
with check (
  public.current_user_role() = 'admin'
  or (public.current_user_role() = 'business' and user_id = auth.uid())
);

drop policy if exists "business_delete" on public.business;
create policy "business_delete"
on public.business
for delete
to authenticated
using (
  public.current_user_role() = 'admin'
  or (public.current_user_role() = 'business' and user_id = auth.uid())
);

-- products
drop policy if exists "products_select" on public.products;
create policy "products_select"
on public.products
for select
to authenticated
using (
  public.current_user_role() = 'admin'
  or business_owner_id = auth.uid()
  or (
    public.current_user_role() = 'staff'
    and business_owner_id = public.current_business_owner_id()
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
  )
  or (
    public.current_user_role() = 'staff'
    and public.staff_can_update_stock()
    and business_owner_id = public.current_business_owner_id()
  )
)
with check (
  public.current_user_role() = 'admin'
  or (
    public.current_user_role() = 'business'
    and business_owner_id = auth.uid()
  )
  or (
    public.current_user_role() = 'staff'
    and public.staff_can_update_stock()
    and business_owner_id = public.current_business_owner_id()
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
  )
);

-- stock_logs
drop policy if exists "stock_logs_select" on public.stock_logs;
create policy "stock_logs_select"
on public.stock_logs
for select
to authenticated
using (
  public.current_user_role() = 'admin'
  or business_owner_id = auth.uid()
  or (
    public.current_user_role() = 'staff'
    and public.staff_can_view_reports()
    and business_owner_id = public.current_business_owner_id()
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
  )
  or (
    public.current_user_role() = 'staff'
    and public.staff_can_update_stock()
    and business_owner_id = public.current_business_owner_id()
  )
);

-- bills
drop policy if exists "bills_select" on public.bills;
create policy "bills_select"
on public.bills
for select
to authenticated
using (
  public.current_user_role() = 'admin'
  or business_owner_id = auth.uid()
  or (
    public.current_user_role() = 'staff'
    and public.staff_can_view_reports()
    and business_owner_id = public.current_business_owner_id()
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
  )
  or (
    public.current_user_role() = 'staff'
    and public.staff_can_create_bill()
    and business_owner_id = public.current_business_owner_id()
  )
);

-- bill_items
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
        or b.business_owner_id = auth.uid()
        or (
          public.current_user_role() = 'staff'
          and public.staff_can_view_reports()
          and b.business_owner_id = public.current_business_owner_id()
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
        or b.business_owner_id = auth.uid()
        or (
          public.current_user_role() = 'staff'
          and public.staff_can_create_bill()
          and b.business_owner_id = public.current_business_owner_id()
        )
      )
  )
);

-- ------------------------------------------------------------
-- Optional: backfill profile rows for existing auth users
-- ------------------------------------------------------------
insert into public.profiles (id, full_name, email, role, created_at, updated_at)
select
  u.id,
  coalesce(u.raw_user_meta_data ->> 'full_name', u.email),
  u.email,
  public.normalize_role_value(u.raw_user_meta_data ->> 'role'),
  now(),
  now()
from auth.users u
on conflict (id) do nothing;

insert into public.user_roles (user_id, role, created_at)
select p.id, p.role, now()
from public.profiles p
on conflict (user_id) do nothing;

-- ============================================================
-- END
-- ============================================================
