-- ============================================================================
-- NOCTURNA · alta manual del administrador
--
-- Opción A (recomendada, sin tocar la base de datos):
--   Supabase → Authentication → Users → Add user
--     · Email: el que quieras usar para entrar al panel.
--     · Password: una contraseña larga y única.
--     · Deja marcada la confirmación automática del correo.
--   Después ejecuta sólo el INSERT de la sección 2.
--
-- Opción B: ejecuta este archivo entero desde el SQL Editor. Sustituye
--   ADMIN@EJEMPLO.COM y CONTRASEÑA_LARGA_Y_UNICA antes de ejecutarlo.
--
-- Importante: este archivo NO debe subirse a un repositorio con la contraseña
-- real. Está aquí como plantilla y para entornos de prueba.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. Crear el usuario de autenticación (si no existe)
-- ---------------------------------------------------------------------------
-- La contraseña se guarda cifrada con bcrypt (pgcrypto), nunca en claro.
-- En Supabase, el hash se genera con crypt('contraseña', gen_salt('bf')).

insert into auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
)
values (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'ADMIN@EJEMPLO.COM',
  crypt('CONTRASEÑA_LARGA_Y_UNICA', gen_salt('bf')),
  now(),
  '{"provider":"email","providers":["email"]}',
  '{}',
  now(),
  now(),
  '',
  '',
  '',
  ''
);

-- ---------------------------------------------------------------------------
-- 2. Autorizar al usuario como administrador del catálogo
-- ---------------------------------------------------------------------------
-- Esta tabla es la única fuente de verdad para las políticas RLS.

insert into public.admins (email)
values ('ADMIN@EJEMPLO.COM')
on conflict (email) do nothing;

-- ---------------------------------------------------------------------------
-- 3. Comprobación (opcional)
-- ---------------------------------------------------------------------------
-- select email from public.admins;
-- select email, email_confirmed_at from auth.users;
