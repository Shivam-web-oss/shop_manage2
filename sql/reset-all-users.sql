begin;

delete from public.order_items;
delete from public.orders;
delete from public.products;
delete from public.customers;
delete from public.business;
delete from public.shops;
delete from public.user_roles;
delete from public.profiles;
delete from auth.users;

commit;
