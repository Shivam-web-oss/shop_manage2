-- ============================================================
-- FIX LEGACY ROLE SCHEMA (existing Supabase project)
-- Use this when you see:
-- invalid input value for enum user_role: "business"
-- ============================================================

-- 1) Convert role columns to TEXT so app is not blocked by old enums.
do $$
declare
  rec record;
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'profiles'
      and column_name = 'role'
  ) then
    -- Drop old check constraints related to role (unknown names).
    for rec in
      select c.conname
      from pg_constraint c
      join pg_class t on t.oid = c.conrelid
      join pg_namespace n on n.oid = t.relnamespace
      where n.nspname = 'public'
        and t.relname = 'profiles'
        and c.contype = 'c'
        and pg_get_constraintdef(c.oid) ilike '%role%'
    loop
      execute format('alter table public.profiles drop constraint %I', rec.conname);
    end loop;

    alter table public.profiles alter column role drop default;
    alter table public.profiles alter column role type text using lower(role::text);
    update public.profiles set role = 'business' where lower(role) in ('bussiness', 'business owner', 'owner');
    update public.profiles set role = 'business' where role not in ('admin', 'business', 'staff');
    alter table public.profiles alter column role set default 'business';
    alter table public.profiles
      add constraint profiles_role_check
      check (lower(role) in ('admin', 'business', 'staff'));
  end if;

  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'user_roles'
      and column_name = 'role'
  ) then
    for rec in
      select c.conname
      from pg_constraint c
      join pg_class t on t.oid = c.conrelid
      join pg_namespace n on n.oid = t.relnamespace
      where n.nspname = 'public'
        and t.relname = 'user_roles'
        and c.contype = 'c'
        and pg_get_constraintdef(c.oid) ilike '%role%'
    loop
      execute format('alter table public.user_roles drop constraint %I', rec.conname);
    end loop;

    alter table public.user_roles alter column role type text using lower(role::text);
    update public.user_roles set role = 'business' where lower(role) in ('bussiness', 'business owner', 'owner');
    update public.user_roles set role = 'business' where role not in ('admin', 'business', 'staff');
    alter table public.user_roles
      add constraint user_roles_role_check
      check (lower(role) in ('admin', 'business', 'staff'));
  end if;
end $$;

-- 2) Optional cleanup: remove old enum type if not used by any column.
do $$
begin
  if exists (select 1 from pg_type where typnamespace = 'public'::regnamespace and typname = 'user_role')
     and not exists (
       select 1
       from pg_attribute a
       join pg_class c on c.oid = a.attrelid
       join pg_namespace n on n.oid = c.relnamespace
       join pg_type t on t.oid = a.atttypid
       where n.nspname = 'public'
         and t.typname = 'user_role'
         and a.attnum > 0
         and not a.attisdropped
     ) then
    drop type public.user_role;
  end if;
end $$;

-- 3) Ensure typo values are normalized.
update public.profiles set role = 'business' where lower(role) = 'bussiness';
update public.user_roles set role = 'business' where lower(role) = 'bussiness';

-- ============================================================
-- END
-- ============================================================
