# Supabase: esquema, seguridad y verificación

Referencia técnica de la base de datos de NOCTURNA. Todo lo que hay aquí está
aplicado por `supabase/migrations/0001_esquema_y_politicas.sql`.

---

## 1. Esquema

### `public.videos`

| Columna | Tipo | Notas |
| --- | --- | --- |
| `id` | `uuid` | Clave primaria, `gen_random_uuid()` |
| `youtube_video_id` | `text` | Identificador de 11 caracteres, único, con `CHECK` de formato |
| `title` | `text` | Obligatorio, no puede estar vacío |
| `slug` | `text` | Único, `CHECK` de formato `^[a-z0-9]+(-[a-z0-9]+)*$` |
| `title_search` | `text` | **Generada**: `lower(unaccent(title))` para buscar sin acentos |
| `description` | `text` | Texto libre (texto plano, nunca HTML) |
| `thumbnail_url` | `text` | Miniatura propia (URL validada) |
| `thumbnail_path` | `text` | Ruta en Supabase Storage (para poder borrarla) |
| `category` | `text` | Nombre de la categoría |
| `tags` | `text[]` | Etiquetas normalizadas en minúsculas |
| `status` | `text` | `draft` o `published` (`CHECK`) |
| `is_featured` | `boolean` | Pieza de portada (sólo una a la vez) |
| `created_at` | `timestamptz` | Alta |
| `updated_at` | `timestamptz` | Mantenido por un trigger |
| `published_at` | `timestamptz` | Fecha de publicación en NOCTURNA |

### `public.categories`

`id`, `slug`, `name`, `created_at`. Catálogo editorial de categorías.

### `public.admins`

`id`, `email` (único), `created_at`. **La lista de administradores.**
No hay ninguna política RLS que permita insertar, actualizar o borrar filas
aquí: sólo se modifica desde el panel de Supabase o desde el SQL Editor.

### Índices y extensiones

- `pgcrypto` (UUID), `unaccent` (búsqueda sin acentos) y `pg_trgm` (índice de
  similitud para la búsqueda por título).
- `videos_title_search_trgm`: índice GIN de trigramas sobre la columna
  generada, para que `LIKE '%texto%'` no recorra la tabla entera.

---

## 2. Funciones

### `public.is_admin() → boolean`

```sql
exists (select 1 from public.admins a
        where lower(a.email) = lower(coalesce(auth.jwt() ->> 'email', '')))
or coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') = 'admin'
```

Es `SECURITY DEFINER` para poder leer `admins` sin provocar recursión con la
política de esa misma tabla. Se ejecuta con `search_path = public, extensions`
y se le revoca el acceso al rol `public` antes de dárselo sólo a `anon` y
`authenticated`.

### `public.immutable_unaccent(text) → text`

Envoltorio inmutable de `unaccent` (la versión de una sola argumento es
`STABLE` y no se puede usar en columnas generadas). El esquema real de la
extensión se resuelve en tiempo de instalación, así que la migración no
depende del `search_path`.

### `public.tocar_updated_at()`

Trigger `BEFORE UPDATE` que mantiene `updated_at` al día.

---

## 3. Políticas RLS

| Tabla | Política | Operación | Quién | Condición |
| --- | --- | --- | --- | --- |
| `videos` | `videos_publicados` | `select` | `anon`, `authenticated` | `status = 'published'` |
| `videos` | `videos_administracion` | `all` | `authenticated` | `public.is_admin()` |
| `categories` | `categorias_publicas` | `select` | `anon`, `authenticated` | `true` |
| `categories` | `categorias_administracion` | `all` | `authenticated` | `public.is_admin()` |
| `admins` | `admins_lectura_limitada` | `select` | `authenticated` | su propio correo o `is_admin()` |
| `admins` | — | `insert`/`update`/`delete` | nadie | sólo el rol propietario (SQL Editor) |
| `storage.objects` | `miniaturas_lectura` | `select` | `anon`, `authenticated` | `bucket_id = 'thumbnails'` |
| `storage.objects` | `miniaturas_alta` | `insert` | `authenticated` | bucket y `is_admin()` |
| `storage.objects` | `miniaturas_actualizacion` | `update` | `authenticated` | bucket y `is_admin()` |
| `storage.objects` | `miniaturas_borrado` | `delete` | `authenticated` | bucket y `is_admin()` |

Las políticas permisivas se combinan con OR: un administrador cumple las dos
condiciones de `videos` y por eso ve también los borradores; un anónimo sólo
puede cumplir `videos_publicados`.

### Privilegios (GRANT)

```sql
grant select on public.videos to anon, authenticated;
grant insert, update, delete on public.videos to authenticated;
grant select on public.categories to anon, authenticated;
grant insert, update, delete on public.categories to authenticated;
grant select on public.admins to authenticated;
revoke all on public.admins from anon;
```

RLS es la barrera real; los `GRANT` sólo evitan errores de permisos.

---

## 4. Storage

Bucket `thumbnails`:

- Público para lectura (las miniaturas se sirven como `<img>` sin firmar).
- `file_size_limit = 5 MB`.
- `allowed_mime_types = image/jpeg, image/png, image/webp, image/avif`
  (SVG queda fuera a propósito: puede contener JavaScript).
- Escritura, edición y borrado sólo para el administrador.

En la aplicación, la subida se hace desde el servidor con la sesión del
administrador (`supabase.storage.from("thumbnails").upload(...)`), de modo que
aplican las políticas de `storage.objects`.

---

## 5. Cómo se autoriza en el código

```
Servidor (Next.js)
  ├─ cliente público  → clave anon, sin sesión  → sólo lee lo publicado
  └─ cliente de sesión → cookie de Supabase SSR → JWT del administrador
        └─ cada INSERT/UPDATE/DELETE pasa por RLS
```

La aplicación **no** utiliza `service_role`. La lista de administradores y las
políticas son la única fuente de autoridad, y ninguna de las dos se expone al
navegador.

---

## 6. Verificación manual de la seguridad

```sql
-- Un anónimo no ve borradores
set local role anon;
select count(*) from public.videos where status <> 'published';  -- 0
reset role;

-- Un anónimo no puede escribir
set local role anon;
update public.videos set title = 'hack' where true;  -- ERROR 42501
reset role;

-- La función de autorización responde false sin sesión
select public.is_admin();  -- false
```

Y desde la aplicación, con `npm run verificar`, que además comprueba que el
bucket existe y que el registro público de usuarios está desactivado.

---

## 7. Copias y mantenimiento

- El plan Free **no incluye copias de seguridad automáticas**. Exporta el
  proyecto desde el panel de Supabase (*Database → Backups*) de vez en cuando
  si te importa el catálogo.
- Los proyectos gratuitos se **pausan tras una semana de inactividad**. La web
  muestra un error claro y basta con restaurarlos desde el panel.
- Si añades una columna, actualiza también `src/types/database.ts` y el tipo
  de la fila en `src/lib/catalogo.ts`.
