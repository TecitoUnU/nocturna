# YouTube: material, inserción y límites

YouTube es el único servicio de alojamiento y reproducción de video de esta
versión de NOCTURNA. Este documento explica qué se puede hacer, qué no y por
qué.

---

## 1. El flujo de trabajo

NOCTURNA **no sube** archivos a YouTube. La subida es manual, desde YouTube
Studio, tal y como permiten las condiciones de uso del servicio.

1. **YouTube Studio** → *Crear* → subir el archivo.
2. **Visibilidad** → *No listado*.
3. Copiar el enlace (botón *Compartir* o la barra del navegador).
4. Volver a NOCTURNA → **Estudio → Registrar un video** → pegar el enlace.
5. El servidor valida el enlace, extrae el identificador y muestra una vista
   previa del reproductor.
6. Escribir título, descripción, categoría y etiquetas.
7. **Guardar como borrador** o **Publicar**.

El panel repite estos pasos en pantalla para que no haya que consultar la
documentación de YouTube.

---

## 2. Qué formatos se aceptan

El campo acepta **el enlace o el identificador**. Todo se valida en el servidor
(`src/lib/youtube.ts`):

| Formato | Ejemplo |
| --- | --- |
| Identificador | `dQw4w9WgXcQ` |
| Watch | `https://www.youtube.com/watch?v=dQw4w9WgXcQ` |
| Watch con marca de tiempo | `https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=42s` |
| Móvil / música | `https://m.youtube.com/watch?v=…`, `https://music.youtube.com/watch?v=…` |
| Corto | `https://youtu.be/dQw4w9WgXcQ` |
| Insertado | `https://www.youtube.com/embed/dQw4w9WgXcQ` |
| Shorts / Live / `/v/` | `https://www.youtube.com/shorts/dQw4w9WgXcQ`, … |

Se **rechazan** con un mensaje explicativo:

- Cualquier dominio que no sea de YouTube (`vimeo.com`, un enlace acortado de
  otro servicio, un dominio que *contenga* `youtube.com` pero no lo sea…).
- URLs mal formadas, rutas sin identificador (`/playlist?list=…`).
- Identificadores que no tienen 11 caracteres válidos.
- `javascript:`, `data:` y cualquier esquema que no sea `http(s)`.

El identificador extraído es la única fuente de verdad: la URL del reproductor
se construye a partir de él (`src/lib/youtube.ts` → `construirUrlEmbed`), nunca
a partir de lo que escribió el usuario. En el panel no se puede insertar HTML
ni JavaScript.

---

## 3. El reproductor

- `iframe` con el dominio oficial `https://www.youtube-nocookie.com/embed/…`.
- Atributos: `allow="accelerometer; autoplay; clipboard-write; encrypted-media;
  gyroscope; picture-in-picture; web-share"`, `allowFullScreen` y
  `referrerPolicy="strict-origin-when-cross-origin"`.
- Relación de aspecto fija 16:9 en escritorio y móvil (`playsinline=1`).
- El `iframe` **no se crea hasta** que el visitante abre la ficha o pulsa
  reproducir. La portada y el catálogo sólo cargan miniaturas.

Sobre lo que NOCTURNA **no** hace:

- No oculta anuncios, marcas de agua ni mecanismos de atribución.
- No reescribe la interfaz del reproductor.
- No descarga ni retransmite el video desde sus propios servidores.
- No automatiza subidas mediante interfaces no oficiales.
- No guarda credenciales de Google.

El dominio `youtube-nocookie.com` es el oficial para incrustar: no cambia lo
que se ve ni lo que YouTube muestra, sólo evita que se planten cookies de
seguimiento hasta que el visitante reproduce. Si prefieres el dominio
`www.youtube.com`, cambia la constante `DOMINIO_EMBED_YOUTUBE` en
`src/lib/config.ts` y añade ese origen a `frame-src` en `src/proxy.ts`.

---

## 4. Lo que un video «no listado» significa

- **No listado no es privado.** El video no aparece en búsquedas ni en tu
  biblioteca, pero cualquiera que reciba el enlace puede verlo y compartirlo.
- No hay contraseña ni control de acceso en YouTube para este ajuste.
- Los enlaces no listados se pueden compartir por correo, mensajería o redes
  sociales con total normalidad.

NOCTURNA lo dice de forma explícita en la ficha de cada video y en el pie del
catálogo. No se promete que el material sea imposible de encontrar.

---

## 5. Cuando el video no se puede insertar

El propietario de un video puede desactivar la inserción. También hay
contenidos con restricciones adicionales por edad, por país o por derechos.

En ese caso:

- El reproductor de YouTube muestra su propio mensaje de error dentro del
  `iframe` (NOCTURNA no lo intercepta ni lo oculta).
- Si el `iframe` ni siquiera carga, la ficha muestra un mensaje propio y un
  botón **Abrir en YouTube**.

No es posible saber de antemano si un video concreto se podrá insertar sin
consultar la API de YouTube, y NOCTURNA no la usa (no hace falta ni se pide
ninguna clave de Google).

---

## 6. Miniaturas

- Por defecto se usan las miniaturas de YouTube (`i.ytimg.com`), probando
  `maxresdefault` → `hqdefault` → `mqdefault`.
- Si la imagen no carga (o el video no tiene), se dibuja un marcador con el
  diseño de la plataforma.
- Se puede subir una miniatura propia (JPEG, PNG, WebP o AVIF, hasta 5 MB) al
  bucket `thumbnails` de Supabase Storage.
- También se puede pegar una URL, pero sólo de una lista de dominios
  permitidos (`i.ytimg.com`, `img.youtube.com`, `yt3.ggpht.com`,
  `lh3.googleusercontent.com`, el dominio del propio proyecto y los que añadas
  en `ALLOWED_THUMBNAIL_HOSTS`).
- Los SVG no se admiten: pueden contener JavaScript.
- NOCTURNA **no descarga** ni almacena copias de los videos.

---

## 7. Sin la API de YouTube

El catálogo, el buscador y la reproducción **no dependen** de la YouTube Data
API:

- El catálogo es propio (Supabase).
- La búsqueda consulta Supabase.
- La reproducción usa el `iframe` oficial.

Ventajas: no hay cuota de API que agotar, no hace falta clave de Google y
funciona dentro de las cuotas gratuitas actuales. Lo que se pierde es la
búsqueda *dentro* de YouTube, que no es el objetivo de esta plataforma.

---

## 8. Buenas prácticas

- Sube con una duración y un peso razonables: la reproducción incrustada es
  más fluida con archivos propios y sinIU.
- Escribe una miniatura que se entienda a tamaño pequeño: es el primer
  contacto con la pieza.
- Usa etiquetas con criterio: en NOCTURNA se filtran por coincidencia exacta.
- Revisa de vez en cuando la visibilidad de cada video en YouTube Studio: si
  accidentalmente queda como «Público», seguirá siendo público aunque el
  catálogo lo trate como no listado.
