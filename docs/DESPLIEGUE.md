# Despliegue con presupuesto cero

Guía completa, de principio a fin, para tener NOCTURNA en producción usando
únicamente planes gratuitos.

---

## 0. Requisitos

- Node.js 20.9 o superior (probado con Node 26).
- Una cuenta de GitHub/GitLab (para Vercel) o una cuenta de Vercel con Git
  integrado.
- Una cuenta de Supabase (plan Free).
- Una cuenta de YouTube para subir los videos.

No hace falta tarjeta, dominio ni ningún servicio de pago.

---

## 1. Código local

```bash
npm install
cp .env.example .env.local
```

Edita `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://TU-PROYECTO.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...
```

Comprueba que todo está en su sitio:

```bash
npm run lint
npm run typecheck
npm test:unit
npm run dev
```

> Las variables `NEXT_PUBLIC_*` se incrustan durante la compilación. Si cambias
> una después de compilar, vuelve a compilar para que el cambio llegue al
> navegador.

---

## 2. Supabase: proyecto, base de datos y políticas

1. **Supabase → New project**. Elige una región cercana (la copia gratuita
   se pausa tras una semana de inactividad, pero puedes restaurarla cuando
   quieras).
2. **SQL Editor → New query**: ejecuta `supabase/migrations/0001_esquema_y_politicas.sql`.
3. Ejecuta también `supabase/migrations/0002_categorias_iniciales.sql` (los
   temas del curso) y, si venías de una versión anterior del proyecto,
   `supabase/migrations/0003_temas_del_curso.sql`.

   **Atajo**: `supabase/instalar-todo.sql` contiene las tres migraciones
   concatenadas y se pega de una vez. Se regenera con `npm run sql` y se puede
   comprobar antes de pegarlo con `npm run sql:validar`, que las ejecuta
   contra un PostgreSQL real (PGlite) y verifica tablas, políticas RLS,
   `is_admin()`, la columna de búsqueda y el bucket.

   Todos los scripts son idempotentes: si algo falla a mitad, puedes corregirlo
   y volver a lanzar el archivo completo sin romper nada.
4. **Storage**: el primer script crea el bucket público `thumbnails` con un
   límite de 5 MB por archivo y los MIME types permitidos. Puedes revisarlo en
   **Storage → Buckets**.

### 2.1. Comprobar que las políticas funcionan

En el SQL Editor:

```sql
-- 1. Un anónimo sólo debe ver lo publicado
set local role anon;
select id, title, status from public.videos;   -- status siempre 'published'
reset role;

-- 2. Escrituras anónimas: deben fallar
set local role anon;
insert into public.videos (youtube_video_id, title, slug)
values ('aaaaaaaaaaa', 'Prueba', 'prueba');
-- ERROR: new row violates row-level security policy
reset role;
```

O bien, desde la terminal:

```bash
curl "$NEXT_PUBLIC_SUPABASE_URL/rest/v1/videos?select=title,status" \
  -H "apikey: $NEXT_PUBLIC_SUPABASE_ANON_KEY"
```

Sólo debe devolver filas con `status = published`.

---

## 3. Supabase Auth

1. **Authentication → Sign In / Providers**:
   - Desactiva **Enable email signup** (registro público). Es importante: la
     plataforma sólo admite el administrador creado a mano.
   - Deja activado el proveedor **Email**.
2. **Authentication → Users → Add user**: crea el administrador con una
   contraseña larga y única y confirma su correo.
3. **SQL Editor**:

```sql
insert into public.admins (email) values ('tu@correo.com')
on conflict (email) do nothing;
```

4. Opcional: **Authentication → URL Configuration → Redirect URLs** añade
   `https://TU-PROYECTO.vercel.app/**` cuando ya tengas el dominio de Vercel.

> La tabla `admins` no admite inserciones desde la web: no existe ninguna
> política RLS que lo permita. Es la lista de administradores y sólo se
> modifica desde el panel de Supabase o desde el SQL Editor.

---

## 4. Variables de entorno

Las mismas en local y en producción:

| Variable | ¿Pública? | Para qué sirve |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | sí | URL del proyecto (va al navegador: es pública por diseño) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | sí | Clave anónima: sólo puede leer lo que RLS permita |
| `NEXT_PUBLIC_SITE_NAME` | sí | Nombre de la plataforma (por defecto `NOCTURNA`) |
| `NEXT_PUBLIC_SITE_TAGLINE` | sí | Lema corto |
| `NEXT_PUBLIC_SITE_DESCRIPTION` | sí | Descripción para metadatos y Open Graph |
| `NEXT_PUBLIC_SITE_URL` | sí | URL pública (metadatos, sitemap) |
| `ALLOWED_THUMBNAIL_HOSTS` | no | Dominios extra permitidos para miniaturas |

**No existe ninguna variable `service_role`.** La aplicación no la usa.

---

## 5. Publicar en Vercel (plan Hobby)

1. `git init`, `git add .`, `git commit -m "NOCTURNA"` y sube el proyecto a
   un repositorio.
2. Vercel → **Add New… → Project** → importa el repositorio.
3. Framework preset: **Next.js** (se detecta solo). Install command: `npm
   install`. Build command: `npm run build` (por defecto).
4. **Environment Variables**: añade `NEXT_PUBLIC_SUPABASE_URL` y
   `NEXT_PUBLIC_SUPABASE_ANON_KEY` para *Production*, *Preview* y
   *Development*. Añade también `NEXT_PUBLIC_SITE_URL` con el dominio final.
5. **Deploy**. Vercel asigna un subdominio gratuito tipo
   `https://nocturna-xyz.vercel.app`. No hay que comprar ningún dominio.
6. Vuelve a Supabase → **Authentication → URL Configuration** y añade ese
   dominio a las URLs permitidas.

### Notas sobre el plan Hobby

- 100 despliegues al día, 1 000 000 de invocaciones de funciones, 100 GB de
  transferencia y 5 000 transformaciones de imagen.
- El plan Hobby es de uso **personal y no comercial**. Una plataforma
  audiovisual personal cumple esta condición; si algún día se usara con fines
  comerciales, habría que pasar a un plan de pago.
- Si Vercel pide activar un pago para continuar, **no es un requisito del
  proyecto**: el despliegue funciona sin contracting nada. Revisa las
  condiciones de tu cuenta antes de añadir una tarjeta.

---

## 6. Lista de comprobaciones tras el despliegue

| # | Comprobación | Cómo |
| --- | --- | --- |
| 1 | La portada carga el catálogo desde Supabase | Abrir `/` y ver piezas publicadas |
| 2 | La búsqueda filtra por título | Escribir en el buscador de la cabecera |
| 3 | Los filtros por categoría y etiqueta funcionan | Pulsar una etiqueta del catálogo |
| 4 | La ficha reproduce el video | Abrir `/watch/<slug>` y pulsar reproducir |
| 5 | Un enlace de YouTube inválido se rechaza | En el panel, pegar una URL de Vimeo |
| 6 | Los borradores no aparecen en el catálogo | Crear un borrador y comprobar `/` |
| 7 | Un anónimo no entra al panel | `/studio` muestra el formulario de acceso |
| 8 | El panel permite registrar y publicar | Crear una pieza y verla en `/` |
| 9 | No hay credenciales privadas en el cliente | Ver el código fuente: sólo `anon` |
| 10 | El certificado y las cabeceras están activos | `curl -I https://tu-dominio.vercel.app` |

---

## 7. Operación diaria

- **Publicar una pieza**: YouTube Studio → subir → *No listado* → copiar enlace
  → `/studio/nuevo` → validar → *Publicar*.
- **Corregir metadatos**: `/studio` → *Editar*.
- **Retirar una pieza**: `/studio` → *Despublicar* (deja de salir en el
  catálogo) o *Eliminar* (la borra definitivamente).
- **Comprobar el servicio**: `npm run verificar` (con las variables de entorno
  del entorno donde se ejecuta).

---

## 8. Problemas frecuentes

**«No se pudo consultar el catálogo»**
El proyecto de Supabase_FREE está pausado por inactividad. Entra en el panel de
Supabase y pulsa *Restore*. Después, recarga la web.

**«Credenciales incorrectas»**
El correo no está en la tabla `admins` (aunque la contraseña sea correcta) o la
contraseña no es la del usuario creado en Authentication. Comprueba:

```sql
select email from public.admins;
```

**El panel entra en bucle al iniciar sesión**
Comprueba que la URL del sitio está en las URLs permitidas de Supabase Auth y
que el proyecto usa `https` en producción.

**El video no se reproduce en la ficha**
Lo más probable es que el propietario haya restringido la inserción en
YouTube. La ficha ofrece el enlace directo a YouTube. No es un error de
NOCTURNA.

**Error 500 al desplegar**
Revisa los registros del despliegue en Vercel. Lo más habitual es que falte
`NEXT_PUBLIC_SUPABASE_URL` o `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
