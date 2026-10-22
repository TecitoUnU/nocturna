-- ============================================================================
-- NOCTURNA · esquema, funciones y políticas de seguridad (Supabase / Postgres)
--
-- Cómo aplicarlo:
--   1. Abre el proyecto en Supabase → SQL Editor → New query.
--   2. Pega este archivo completo y pulsa Run.
--   3. Después ejecuta 0002_categorias_iniciales.sql.
--
-- El script es idempotente: se puede volver a ejecutar sin romper nada.
-- ============================================================================

-- Extensiones usadas: uuid y similitud de trigramas.
-- La búsqueda sin acentos no depende de `unaccent`: se resuelve con
-- `translate`, que es inmutable y no necesita extensiones.
create extension if not exists "pgcrypto" with schema extensions;
create extension if not exists "pg_trgm" with schema extensions;

-- ---------------------------------------------------------------------------
-- Tablas
-- ---------------------------------------------------------------------------

-- Administradores autorizados. Sólo se rellena a mano (panel de Supabase o el
-- script seed/crear-administrador.sql): no hay ninguna política que permita
-- escribir en esta tabla desde la aplicación.
create table if not exists public.admins (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  created_at timestamptz not null default now(),
  constraint admins_email_unico unique (email)
);

-- Categorías editoriales del catálogo.
create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null unique,
  created_at timestamptz not null default now()
);

-- Catálogo de videos. YouTube es el alojamiento; aquí sólo viven los metadatos.
create table if not exists public.videos (
  id uuid primary key default gen_random_uuid(),
  youtube_video_id text not null unique,
  title text not null,
  slug text not null unique,
  description text not null default '',
  thumbnail_url text,
  thumbnail_path text,
  category text,
  tags text[] not null default '{}',
  status text not null default 'draft',
  is_featured boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  published_at timestamptz,
  constraint videos_titulo_no_vacio check (length(btrim(title)) > 0),
  constraint videos_estado_valido check (status in ('draft', 'published')),
  constraint videos_id_youtube_formato check (youtube_video_id ~ '^[A-Za-z0-9_-]{11}$'),
  constraint videos_slug_formato check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$')
);

-- ---------------------------------------------------------------------------
-- Búsqueda: columna normalizada (sin acentos y en minúsculas)
-- ---------------------------------------------------------------------------

-- `translate` es IMMUTABLE (a diferencia de `unaccent`, que es STABLE y no
-- se puede usar en columnas generadas). La tabla de caracteres cubre el
-- español, que es el idioma del proyecto.
create or replace function public.quitar_acentos(texto text)
returns text
language sql
immutable
parallel safe
as $$
  select translate(
    texto,
    'áàäâãéèëêíìïîóòöôõúùüûñçÁÀÄÂÃÉÈËÊÍÌÏÎÓÒÖÔÕÚÙÜÛÑÇ',
    'aaaaaeeeeiiiiooooouuuuncAAAAAEEEEIIIIOOOOOUUUUNC'
  )
$$;

alter table public.videos
  add column if not exists title_search text
  generated always as (lower(public.quitar_acentos(title))) stored;

-- Índice de trigramas para las búsquedas por título (contiene, no prefijo).
do $$
declare
  esquema text;
begin
  select n.nspname
    into esquema
    from pg_extension e
    join pg_namespace n on n.oid = e.extnamespace
   where e.extname = 'pg_trgm';

  if esquema is not null then
    execute format(
      'create index if not exists videos_title_search_trgm
         on public.videos using gin (title_search %I.gin_trgm_ops)',
      esquema
    );
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- Funciones
-- ---------------------------------------------------------------------------

-- Marca updated_at automáticamente.
create or replace function public.tocar_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists videos_tocar_updated_at on public.videos;
create trigger videos_tocar_updated_at
  before update on public.videos
  for each row
  execute function public.tocar_updated_at();

-- Función de autorización. SECURITY DEFINER para poder leer `admins` sin
-- provocar recursión con la política de esa misma tabla.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public, extensions
as $$
  select exists (
           select 1
             from public.admins a
            where lower(a.email) = lower(coalesce(auth.jwt() ->> 'email', ''))
         )
      or coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') = 'admin'
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Row Level Security
--
-- Idea central:
--   · Visitantes anónimos  → sólo videos publicados.
--   · Administrador        → todo (incluidos borradores).
--   · Cualquier otro      → nada.
-- Ocultar la ruta /studio no sustituye estas políticas.
-- ---------------------------------------------------------------------------

alter table public.videos enable row level security;
alter table public.categories enable row level security;
alter table public.admins enable row level security;

-- policies ------------------------------------------------------------------

drop policy if exists "videos_publicados" on public.videos;
create policy "videos_publicados"
  on public.videos
  for select
  to anon, authenticated
  using (status = 'published');

drop policy if exists "videos_administracion" on public.videos;
create policy "videos_administracion"
  on public.videos
  for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "categorias_publicas" on public.categories;
create policy "categorias_publicas"
  on public.categories
  for select
  to anon, authenticated
  using (true);

drop policy if exists "categorias_administracion" on public.categories;
create policy "categorias_administracion"
  on public.categories
  for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "admins_lectura_limitada" on public.admins;
create policy "admins_lectura_limitada"
  on public.admins
  for select
  to authenticated
  using (
    lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
    or public.is_admin()
  );

-- No hay políticas de inserción, actualización ni borrado en `admins`:
-- la única forma de dar de alta un administrador es el panel de Supabase
-- o el script seed/crear-administrador.sql.

-- privileges ---------------------------------------------------------------

grant usage on schema public to anon, authenticated;

grant select on public.videos to anon, authenticated;
grant insert, update, delete on public.videos to authenticated;

grant select on public.categories to anon, authenticated;
grant insert, update, delete on public.categories to authenticated;

grant select on public.admins to authenticated;
revoke all on public.admins from anon;

-- ---------------------------------------------------------------------------
-- Almacenamiento de miniaturas propias (bucket público de sólo lectura)
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'thumbnails',
  'thumbnails',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'image/avif']
)
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

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
