-- Staff ownership and access controls for business users
-- Run this once in Supabase SQL editor.

create table if not exists public.staff_permissions (
  id uuid primary key default gen_random_uuid(),
  staff_user_id uuid not null unique references public.profiles(id) on delete cascade,
  business_owner_id uuid not null references public.profiles(id) on delete cascade,
  can_create_bill boolean not null default true,
  can_update_stock boolean not null default true,
  can_view_reports boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_staff_permissions_owner on public.staff_permissions (business_owner_id);
create index if not exists idx_staff_permissions_staff on public.staff_permissions (staff_user_id);
