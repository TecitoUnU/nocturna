# NOCTURNA

Plataforma audiovisual personal: catálogo propio, buscador, fichas de video con
reproductor integrado y un panel privado de administración.

🌐 **Desplegada en producción**: <https://nocturna-mu.vercel.app>
(plan Hobby de Vercel, subdominio gratuito, sin dominio comprado)

Todo el proyecto funciona con **presupuesto cero** usando servicios con plan
gratuito:

| Pieza | Servicio | Plan |
| --- | --- | --- |
| Web (frontend + backend) | Next.js 16 + TypeScript, desplegado en Vercel | Hobby (gratis) |
| Base de datos y metadatos | Supabase PostgreSQL | Free (gratis) |
| Autenticación del panel | Supabase Auth | Free (gratis) |
| Alojamiento y reproducción de video | YouTube (videos **no listados**) | Sin coste |
| Miniaturas propias | Supabase Storage | Free (1 GB) |

No hay pasarelas de pago, suscripciones, dominios comprados ni servicios
premium. La aplicación **no usa ninguna clave privilegiada**: todo pasa por la
clave pública y por las políticas de seguridad (RLS) de PostgreSQL.

---

## Índice

- [Qué hace](#qué-hace)
- [Arquitectura](#arquitectura)
- [Puesta en marcha (10 minutos)](#puesta-en-marcha-10-minutos)
- [Comandos](#comandos)
- [Estructura del proyecto](#estructura-del-proyecto)
- [Seguridad](#seguridad)
- [YouTube: cómo se publica](#youtube-cómo-se-publica)
- [Documentación](#documentación)
- [Límites conocidos](#límites-conocidos)

---

## Qué hace

**Sitio público**

- **Portada = presentación del proyecto**: nombre de la página, propósito,
  mensaje de bienvenida, presentación breve del curso de Precálculo, ficha del
  proyecto (institución, asignatura, docente) y los **nombres completos de los
  integrantes del grupo**.
- **Menú de temas**: navegación principal hacia los distintos contenidos
  (exponentes y radicales, expresiones racionales, ecuaciones, modelado con
  ecuaciones, geometría de coordenadas, rectas, funciones, análisis de
  funciones, funciones cuadráticas, funciones polinomiales y ceros reales),
  con el número de piezas de cada tema.
- Catálogo editorial con la pieza destacada, retícula asimétrica (no una
  cuadrícula de tarjetas idénticas), buscador en la cabecera, filtros por
  categoría y por etiqueta, y carga progresiva del listado.
- Búsqueda por título, sin distinguir mayúsculas, con acentos ignorados y con
  un retraso breve de 300 ms mientras se escribe. Los resultados salen de
  Supabase y cada uno enlaza a su ficha.
- Ficha individual en `/watch/[slug]`: reproductor oficial de YouTube en 16:9,
  título, descripción, fecha de publicación en NOCTURNA, categoría, etiquetas,
  enlace de vuelta al catálogo y videos relacionados.
- Estados de carga, de error y de catálogo vacío en todas las rutas.

**Panel privado (`/studio`)**

- Acceso con correo y contraseña (Supabase Auth). El registro público está
  desactivado: no hay forma de crear cuentas desde la web.
- Alta, edición, publicación, despublicación y borrado de piezas.
- Enlace o ID de YouTube validado **en el servidor** (dominio, formato e ID de
  11 caracteres) con vista previa del reproductor mientras se escribe.
- Miniatura propia subida a Supabase Storage o URL de imagen validada.
- Categorías y etiquetas, pieza destacada y explicación paso a paso del flujo
  de publicación.

---

## Arquitectura

```
Navegador ──▶ Vercel (Next.js 16, App Router)
                 │  proxy.ts: sesión de Supabase + CSP con nonce
                 │
                 ├─▶ Supabase PostgREST ──▶ PostgreSQL con RLS
                 │      (catálogo y metadatos; sólo lo publicado es público)
                 ├─▶ Supabase Auth (correo + contraseña, sin registro público)
                 ├─▶ Supabase Storage (miniaturas propias, 1 GB gratuito)
                 └─▶ YouTube (iframe del reproductor oficial, sin descargas)
```

Decisiones importantes:

- **El catálogo sale siempre de Supabase.** No hay listas de videos escritas en
  el código: la única lista en memoria es la del doble de pruebas
  (`tests/mock/`), que es una herramienta de test, no parte de la aplicación.
- **La seguridad no depende de ocultar rutas.** `/studio` no aparece en la
  navegación pública, pero lo que protege el catálogo son las políticas RLS:
  un anónimo sólo lee videos publicados y no puede escribir nada.
- **El reproductor no se crea hasta que se pide.** En la portada y en el
  catálogo sólo hay miniaturas; el `iframe` de YouTube se inserta al abrir la
  ficha o al pulsar reproducir.
- **Sin caché de página.** Todas las rutas leen de la base de datos en cada
  petición, así que publicar una pieza se refleja de inmediato.

---

## Puesta en marcha (10 minutos)

### 1. Crear el proyecto en Supabase

1. Crea una cuenta en <https://supabase.com> (plan **Free**).
2. **New project**. Anota el *Project URL* y la clave **anon public**.
3. En **Authentication → Sign In / Providers**, desactiva *Enable email signup*
   (registro público). Deja activo el acceso con correo y contraseña.
4. En **Authentication → URL Configuration**, deja el redirect en la URL del
   proyecto por defecto (la web sólo usa inicio de sesión con contraseña).

### 2. Aplicar las migraciones SQL

En **SQL Editor → New query**, pega y ejecuta, en este orden:

1. `supabase/migrations/0001_esquema_y_politicas.sql` (esquema, RLS, storage)
2. `supabase/migrations/0002_categorias_iniciales.sql` (temas del curso)
3. `supabase/migrations/0003_temas_del_curso.sql` (sólo si venías de una versión anterior)

Ambos scripts son idempotentes: se pueden volver a ejecutar sin romper nada.

### 3. Crear el usuario administrador

Opción recomendada (sin tocar la base de datos):

1. **Authentication → Users → Add user**: correo, contraseña larga y única, y
   confirma el correo automáticamente.
2. En el **SQL Editor**, ejecuta:

```sql
insert into public.admins (email) values ('tu@correo.com')
on conflict (email) do nothing;
```

La alternativa (script completo con la contraseña cifrada con bcrypt) está en
`supabase/seed/crear-administrador.sql`. No subas ese archivo con una
contraseña real a ningún repositorio.

### 4. Configurar las variables de entorno

```bash
cp .env.example .env.local
```

Rellena `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
Opcionalmente ajusta `NEXT_PUBLIC_SITE_NAME` para cambiar el nombre de la
plataforma sin tocar el código.

### 5. Probar en local

```bash
npm install
npm run dev          # http://localhost:3000
npm run verificar    # comprueba la conexión con Supabase
```

### 6. Desplegar en Vercel (Hobby, gratis)

1. Sube el proyecto a un repositorio de Git.
2. En Vercel: **Add New → Project** → importa el repositorio.
3. **Environment Variables**: añade las mismas variables de `.env.example`
   (el panel de Vercel pide los valores para *Production*, *Preview* y
   *Development*).
4. Despliega. Vercel te dará un subdominio `https://tu-proyecto.vercel.app`.
   No hace falta comprar ningún dominio.
5. En Supabase → **Authentication → URL Configuration**, añade el dominio de
   Vercel a las URLs permitidas.
6. Comprueba el catálogo, el buscador, la reproducción y el acceso al panel.

El detalle paso a paso está en [`docs/DESPLIEGUE.md`](docs/DESPLIEGUE.md).

---

## Comandos

| Comando | Qué hace |
| --- | --- |
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Compilación de producción |
| `npm start` | Servir la compilación de producción |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript sin emitir |
| `npm test:unit` | Pruebas unitarias (validación de YouTube, texto, miniaturas) |
| `npm run e2e` | Prueba de extremo a extremo contra un doble local de Supabase |
| `npm test` | Unitarias + extremo a extremo |
| `npm run verificar` | Comprueba la conexión con un Supabase real |

`npm run e2e` levanta un doble de Supabase en `tests/mock/` (PostgREST +
Auth + Storage simulados, con RLS simulado) y comprueba de punta a punta: el
catálogo público, la búsqueda, los filtros, la ficha, el 404 de los borradores,
el acceso al panel, el alta con publicación, el rechazo de enlaces inválidos,
el borrado y el bloqueo de escrituras anónimas.

---

## Estructura del proyecto

```
src/
  app/
    (public)/          portada (presentación, temas, catálogo, buscador)
    watch/[slug]/      ficha de video
    studio/            panel privado (acceso, alta, edición, categorías)
    api/catalogo/      API de carga progresiva
  proxy.ts             sesión de Supabase + CSP con nonce (src/proxy.ts)
  components/
    presentacion.tsx   nombre, propósito, bienvenida, curso, grupo y menú
    cabecera.tsx, buscador.tsx, tarjeta-video.tsx, reproductor.tsx…
  lib/
    proyecto.ts        datos del proyecto: nombre, integrantes, temas y textos
    acciones/          acciones de servidor (sesión, videos, categorías)
    supabase/          clientes (público y con sesión)
    catalogo.ts        consultas al catálogo
    youtube.ts         validación de enlaces e IDs de YouTube
    validacion.ts      validación de metadatos y miniaturas
    config.ts          identidad de la plataforma (nombre, lema…)
  types/database.ts    tipos de la base de datos
supabase/
  migrations/          SQL del esquema, RLS y almacenamiento
  seed/                alta manual del administrador
tests/                 pruebas unitarias, doble de Supabase y prueba e2e
docs/                  documentación ampliada
```

### Antes de publicar: personalize el proyecto

Todo el contenido de la presentación se edita en **un solo archivo**,
`src/lib/proyecto.ts`:

| Campo | Qué es | Estado actual |
| --- | --- | --- |
| `nombre` | Nombre del proyecto | `NOCTURNA` (o `NEXT_PUBLIC_SITE_NAME`) |
| `tipo` | Subtítulo bajo el nombre | «Archivo audiovisual del curso de Precálculo» |
| `institucion` | Institución | Universidad Mariano Galvez de Guatemala · Sede Jalapa |
| `asignatura` | Asignatura | `Precálculo` |
| `docente` | Docente | Jose Fernando Marroquin Rosa |
| `proposito` | Propósito de la página | redactado |
| `presentacionCurso` | Presentación breve del curso | redactada |
| `bienvenida` | Mensaje de bienvenida | redactado |
| `integrantes` | **Nombres completos del grupo** + carnet | completado (6 integrantes) |
| `temas` | Menú de temas y su categoría | los 10 temas del curso |

> La lista de integrantes está completa; los carnets se muestran junto a cada
> nombre en la sección *El grupo* de la portada y en el pie de página.

Las categorías de Supabase son los temas del curso
(`supabase/migrations/0002_categorias_iniciales.sql`). Si ya habías aplicado la
versión anterior de esa migración, ejecuta `0003_temas_del_curso.sql` y borra
las categorías antiguas desde el panel (Estudio → Categorías).

---

## Seguridad

- **Row Level Security en PostgreSQL.** Políticas aplicadas en
  `supabase/migrations/0001_esquema_y_politicas.sql`:
  - `videos`: lectura pública sólo de filas `status = 'published'`; escritura,
    edición y borrado sólo para el administrador.
  - `categories`: lectura pública; escritura sólo del administrador.
  - `admins`: sólo se puede leer la fila propia; **no hay ninguna política que
    permita escribir**, así que la lista de administradores se gestiona a mano
    desde el panel de Supabase.
  - `storage.objects` (bucket `thumbnails`): lectura pública de imágenes,
    escritura sólo del administrador.
- **Sin clave `service_role` en el proyecto.** El panel usa la sesión del
  administrador con la clave anónima: la autorización la aplica PostgreSQL.
- **Validación en el servidor.** El enlace de YouTube se valida en el servidor
  (dominio, ruta e identificador de 11 caracteres) antes de guardarse; el
  `iframe` se construye siempre a partir de un ID validado. No se inserta HTML
  ni JavaScript proporcionados por terceros.
- **CSP con nonce por petición** en `src/proxy.ts`: `frame-src` sólo permite
  `https://www.youtube-nocookie.com` y `https://www.youtube.com`; los
  `script-src` llevan nonce y `strict-dynamic`; `object-src 'none'`;
  `frame-ancestors 'none'`.
- **Cabeceras adicionales**: `X-Content-Type-Options`, `X-Frame-Options`,
  `Referrer-Policy`, `Permissions-Policy` y HSTS.
- **El panel no aparece en la navegación pública** y `robots.txt` lo excluye,
  pero eso es sólo comodidad: la protección real está en RLS.

---

## YouTube: cómo se publica

1. Abre **YouTube Studio** desde el propio panel (hay un enlace).
2. Sube el archivo y configura la visibilidad como **No listado**.
3. Copia el enlace.
4. Vuelve a NOCTURNA, en **Estudio → Registrar un video**, y pega el enlace.
5. Completa la ficha y pulsa **Publicar**.

Advertencias que la plataforma no oculta:

- Un video **no listado no es privado**: cualquiera que tenga el enlace puede
  verlo y compartirlo. NOCTURNA no promete lo contrario.
- El propietario puede **restringir la inserción**; si lo hace, el reproductor
  no mostrará el video y la ficha ofrece el enlace directo a YouTube.
- No se suben archivos automáticamente ni se descargan ni retransmiten videos:
  todo pasa por el reproductor oficial de YouTube, con sus anuncios, su marca
  de agua y sus restricciones.

Detalle en [`docs/YOUTUBE.md`](docs/YOUTUBE.md).

---

## Documentación

| Documento | Contenido |
| --- | --- |
| [`docs/DESPLIEGUE.md`](docs/DESPLIEGUE.md) | Instalación completa, despliegue en Vercel y lista de comprobaciones |
| [`docs/SUPABASE.md`](docs/SUPABASE.md) | Esquema, políticas RLS, storage y cómo auditarlas |
| [`docs/YOUTUBE.md`](docs/YOUTUBE.md) | Material no listado, inserción, límites y buenas prácticas |
| [`docs/IDENTIDAD-VISUAL.md`](docs/IDENTIDAD-VISUAL.md) | Sistema visual, paleta, tipografía y cómo cambiar la marca |

---

## Tareas manuales pendientes

Todo lo que requiere una cuenta o una credencial externa (nada de esto se ha
podido hacer desde el repositorio):

| # | Tarea | Dónde |
| --- | --- | --- |
| 1 | Crear el proyecto de Supabase y anotar la URL y la clave anónima | Panel de Supabase |
| 2 | Ejecutar las dos migraciones SQL | Supabase → SQL Editor |
| 3 | Desactivar el registro público de usuarios | Supabase → Authentication → Providers |
| 4 | Crear el usuario administrador y añadir su correo a `public.admins` | Supabase → Authentication → Users + SQL Editor |
| 5 | Copiar `.env.example` a `.env.local` y rellenar las dos variables | En el equipo |
| 6 | Importar el repositorio en Vercel y configurar las mismas variables | Vercel |
| 7 | Añadir el dominio de Vercel a las URLs permitidas de Supabase Auth | Supabase → Authentication → URL Configuration |
| 8 | Subir el primer video a YouTube como *no listado* y registrarlo | YouTube Studio + `/studio` |

---

## Límites conocidos

- **Supabase Free pausa el proyecto tras una semana sin actividad.** Si la web
  muestra errores de conexión, reactiva el proyecto desde el panel de Supabase
  (botón *Restore*) y vuelve a cargar. Cualquier visita a la web lo despierta.
- **Supabase Free**: 500 MB de base de datos, 1 GB de almacenamiento, 5 GB de
  egreso mensual, 50 000 usuarios activos mensuales, tamaño máximo de archivo
  50 MB y **2 proyectos gratuitos activos**.
- **Vercel Hobby**: 100 despliegues al día, 1 000 000 de invocaciones de
  funciones, 5 000 transformaciones de imagen y 100 GB de transferencia. El
  plan Hobby es de uso personal y no comercial, que es justo el caso de esta
  plataforma.
- Las miniaturas se sirven con `<img>` y `loading="lazy"` (sin optimizador de
  imágenes) para no gastar cuota de transformaciones.
- Si se alcanza una cuota, la web muestra un error comprensible y esta
  documentación explica cómo resolverlo; no hay pagos configurados en ninguna
  parte del proyecto.
