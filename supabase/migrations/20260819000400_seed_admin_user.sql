-- Grants Super Admin to the account requested for console access, and confirms its
-- email so it can sign in immediately without waiting on the verification email.
update auth.users
set email_confirmed_at = coalesce(email_confirmed_at, now())
where email = 'adenugaadewumi01@gmail.com';

update public.profiles
set role = 'admin',
    admin_role_id = (select id from public.admin_roles where slug = 'super-admin')
where email = 'adenugaadewumi01@gmail.com';
