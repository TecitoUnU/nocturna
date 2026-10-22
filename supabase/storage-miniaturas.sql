-- ============================================================================
-- NOCTURNA · almacenamiento de miniaturas (bucket + políticas)
--
-- Archivo independiente para poder ejecutarlo por separado, sin repetir el
-- esquema completo. Es idempotente: se puede ejecutar varias veces.
--
-- Si ya aplicaste 0001_esquema_y_politicas.sql entero, esto no hace falta
-- (sólo refuerza las políticas).
--
-- Está escrito en dos pasos (bucket y luego límites) para que, si tu versión
-- de Supabase no tuviera alguna de esas columnas, el bucket se cree igualmente
-- y puedas ajustar el límite desde el panel.
-- ============================================================================

-- 1. Crear el bucket público de sólo lectura.
insert into storage.buckets (id, name, public)
values ('thumbnails', 'thumbnails', true)
on conflict (id) do update set public = true;

-- 2. Límites: 5 MB por archivo y sin SVG (los SVG pueden contener JavaScript).
update storage.buckets
   set file_size_limit = 5242880,
       allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp', 'image/avif']
 where id = 'thumbnails';

-- 3. Lectura pública de las miniaturas.
drop policy if exists "miniaturas_lectura" on storage.objects;
create policy "miniaturas_lectura"
  on storage.objects
  for select
  to anon, authenticated
  using (bucket_id = 'thumbnails');

-- 4. Escritura, edición y borrado: sólo el administrador (RLS).
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

-- Comprobación:
-- select id, name, public, file_size_limit, allowed_mime_types from storage.buckets;
-- select policyname from pg_policies where tablename = 'objects';
