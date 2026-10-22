-- ============================================================================
-- NOCTURNA · lo que falta por aplicar en Supabase
--
-- Pega este archivo en Supabase → SQL Editor → New query → Run.
-- Es idempotente: se puede ejecutar las veces que haga falta.
--
-- Contiene:
--   1. El bucket de miniaturas 'thumbnails' y sus cuatro políticas.
--   2. El alta del administrador en la tabla `admins` (cambia el correo).
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. Bucket de miniaturas
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('thumbnails', 'thumbnails', true)
on conflict (id) do update set public = true;

update storage.buckets
   set file_size_limit = 5242880,
       allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp', 'image/avif']
 where id = 'thumbnails';

drop policy if exists "miniaturas_lectura" on storage.objects;
create policy "miniaturas_lectura"
  on storage.objects
  for select
  to anon, authenticated
  using (bucket_id = 'thumbnails');

drop policy if exists "miniaturas_alta" on storage.objects;
create policy "miniaturas_alta"
  on storage.objects
  for insert
  to authenticated
  with check (bucket_id = 'thumbnails' and public.is_admin());

drop policy if exists "miniaturas_actualizacion" on storage.objects;
create policy "miniaturas_actualizacion"
  on storage.objects
  for update
  to authenticated
  using (bucket_id = 'thumbnails' and public.is_admin())
  with check (bucket_id = 'thumbnails' and public.is_admin());

drop policy if exists "miniaturas_borrado" on storage.objects;
create policy "miniaturas_borrado"
  on storage.objects
  for delete
  to authenticated
  using (bucket_id = 'thumbnails' and public.is_admin());

-- ---------------------------------------------------------------------------
-- 2. Administrador autorizado
--
-- Cambia 'TU_CORREO@gmail.com' por el correo con el que creaste el usuario en
-- Authentication → Users. El usuario debe existir YA (si no, el INSERT
-- funciona pero el login fallará).
-- ---------------------------------------------------------------------------
insert into public.admins (email)
values ('TU_CORREO@gmail.com')
on conflict (email) do nothing;

-- ---------------------------------------------------------------------------
-- 3. Comprobación: debe devolver 1 bucket, 1 admin y 10 categorías
-- ---------------------------------------------------------------------------
select 'buckets' as qué, count(*)::text as valor from storage.buckets
union all
select 'admins', count(*)::text from public.admins
union all
select 'categorias', count(*)::text from public.categories;

select email from public.admins;
