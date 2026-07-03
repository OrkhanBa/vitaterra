-- Seed Supabase Auth accounts for the sales/finance/admin logins.
-- Applied to project gqhjntqfgwvyqpynfzut (VitaTerra) on 2026-07-03.
-- Sales & finance sign in with username+password; admin@ is the bridge account
-- the Netlify admin-session function signs into after verifying a Clerk admin.
--
-- Login usernames map to emails as <username>@users.vitaterra.az.
-- Roles live in raw_app_meta_data.role ('sales' | 'finance' | 'admin').

create or replace function public._vt_seed_user(
  p_email text, p_password text, p_role text, p_name text, p_username text
) returns void
language plpgsql
security definer
set search_path = auth, extensions, public
as $$
declare uid uuid;
begin
  select id into uid from auth.users where email = lower(p_email);
  if uid is null then
    uid := gen_random_uuid();
    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, created_at, updated_at,
      raw_app_meta_data, raw_user_meta_data, is_sso_user, is_anonymous
    ) values (
      '00000000-0000-0000-0000-000000000000', uid, 'authenticated', 'authenticated', lower(p_email),
      extensions.crypt(p_password, extensions.gen_salt('bf')),
      now(), now(), now(),
      jsonb_build_object('provider','email','providers',jsonb_build_array('email'),'role',p_role,'name',p_name,'username',p_username),
      jsonb_build_object('role',p_role,'name',p_name,'username',p_username),
      false, false
    );
    insert into auth.identities (provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
    values (uid::text, uid, jsonb_build_object('sub',uid::text,'email',lower(p_email),'email_verified',true), 'email', now(), now(), now());
  else
    update auth.users set
      encrypted_password = extensions.crypt(p_password, extensions.gen_salt('bf')),
      raw_app_meta_data = jsonb_build_object('provider','email','providers',jsonb_build_array('email'),'role',p_role,'name',p_name,'username',p_username),
      raw_user_meta_data = jsonb_build_object('role',p_role,'name',p_name,'username',p_username),
      email_confirmed_at = coalesce(email_confirmed_at, now()),
      updated_at = now()
    where id = uid;
  end if;
end $$;

-- NOTE: passwords below are the initial migrated values; rotate in-app.
select public._vt_seed_user('sales@users.vitaterra.az',   'sales123',        'sales',   'Sales Team',    'sales');
select public._vt_seed_user('aygun@users.vitaterra.az',   'Aygun123456789',  'sales',   'Aygun',         'Aygun');
select public._vt_seed_user('finance@users.vitaterra.az', 'finance123',      'finance', 'Finance',       'finance');
-- admin@ password must match SUPABASE_ADMIN_PASSWORD env var on Netlify.
select public._vt_seed_user('admin@users.vitaterra.az',   'vT#Adm7Qz2Lp9Rk4Xn8Wb6Yc3', 'admin', 'Administrator', 'admin');

drop function public._vt_seed_user(text, text, text, text, text);

-- GoTrue rejects logins when these token columns are NULL; normalize to ''.
update auth.users set
  confirmation_token = coalesce(confirmation_token, ''),
  recovery_token = coalesce(recovery_token, ''),
  email_change = coalesce(email_change, ''),
  email_change_token_new = coalesce(email_change_token_new, ''),
  email_change_token_current = coalesce(email_change_token_current, ''),
  phone_change = coalesce(phone_change, ''),
  phone_change_token = coalesce(phone_change_token, ''),
  reauthentication_token = coalesce(reauthentication_token, '')
where email like '%@users.vitaterra.az';
