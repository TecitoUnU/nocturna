# Identidad visual de NOCTURNA

Sistema visual de la plataforma: una revista cinematográfica nocturna, con
composiciones editoriales asimétricas y un único color de acento.

Todo el sistema está definido en dos sitios:

- **Color, tipografía y utilidades**: `src/app/globals.css` (Tailwind CSS 4,
  configuración en CSS con `@theme`).
- **Textos de marca**: `src/lib/config.ts` (nombre, lema, descripción) y las
  variables `NEXT_PUBLIC_SITE_*`.

---

## 1. Paleta

Un fondo negro azulado, texto blanco cálido y un violeta eléctrico como único
acento. No hay más colores: la identidad se apoya en el contraste de valor y
en el espacio en blanco.

| Token | Valor | Uso |
| --- | --- | --- |
| `noche-950` | `#05050a` | Fondo más profundo (pie, panel) |
| `noche-900` | `#09090f` | Fondo de página |
| `noche-850` | `#0c0c14` | Fondos de imagen |
| `noche-800` | `#11111a` | Superficies y estados vacíos |
| `noche-700` | `#171722` | Esqueletos de carga |
| `noche-600` | `#21212e` | Bordes fuertes |
| `hueso` | `#f4f0e6` | Texto principal (blanco cálido) |
| `hueso-tenue` | `#a8a2b6` | Texto secundario |
| `hueso-oscuro` | `#6f6a7d` | Metadatos, marcas de agua |
| `acento` | `#a855f7` | Violeta eléctrico: único acento |
| `acento-tenue` | `#cbb6ff` | Acento sobre fondo oscuro, hover |
| `acento-hondo` | `#6d28d9` | Estados pulsados |

El acento aparece en: el símbolo de la marca, el kicker de las secciones, el
botón principal, el borde del filtro activo, el punto de la ficha y la barra
de progreso del vídeo. Nada más.

### Cómo cambiar el acento

En `src/app/globals.css`, dentro de `@theme`:

```css
--color-acento: #a855f7;      /* violeta eléctrico (por defecto) */
--color-acento-tenue: #cbb6ff;
--color-acento-hondo: #6d28d9;
```

Un naranja (`#ff7a1a` / `#ffb066` / `#c2410c`) funciona igual de bien: sólo
hay que sustituir esos tres valores. El resto de la interfaz usa tokens
semánticos, así que no hay que tocar ningún componente.

---

## 2. Tipografía

| Uso | Familia | Variable |
| --- | --- | --- |
| Titulares | Instrument Serif (OFL) | `--fuente-display` |
| Texto e interfaz | Geist (variable, autoalojada) | `--fuente-texto` |
| Datos técnicos (IDs, código) | Geist Mono | `--fuente-mono` |

- **Instrument Serif** se sirve desde el propio repositorio
  (`src/fonts/*.woff2`, ~21 KB cada variante) para que la compilación no
  dependa de la red. Sólo hay versión *latin*.
- **Geist** llega con el paquete `geist` (fuentes autoalojadas).
- Los titulares usan la clase `titulo-editorial`: serif de contraste alto,
  interlínea 1.02 y un poco de tracking negativo.
- Las etiquetas pequeñas usan la clase `kicker`: 11 px, versalitas, tracking
  `0.22em`.

---

## 3. Ritmo editorial

La página no es una cuadrícula de tarjetas idénticas:

- **Masthead**: una entradilla con el lema en `kicker` y un titular grande en
  serif (`clamp` entre 4 y 7 rem).
- **Portada**: la pieza destacada ocupa una retícula de 12 columnas con el texto
  en 5 y la imagen en 7, en reversing con el resto del catálogo.
- **Catálogo**: las piezas alternan anchos según un patrón de seis
  (`4 / 2 / 2 / 3 / 3 / 4` columnas en `lg`), de modo que la retícula respira
  como una revista y no como una tabla.
  La función que decide el ancho está en `src/lib/rejilla.ts`.
- **Ritmo vertical**: `pt-20`/`md:pt-28` entre secciones, `gap-y-12` entre
  filas de la retícula y divisiones con una línea de 10 % de opacidad.

Componentes clave:

| Componente | Archivo | Nota |
| --- | --- | --- |
| Marca y símbolo | `src/components/marca.tsx` | Media luna geométrica propia + punto de acento |
| Cabecera | `src/components/cabecera.tsx` | Pegajosa, con desenfoque y línea inferior |
| Buscador | `src/components/buscador.tsx` | Retraso de 300 ms, URL como estado |
| Tarjeta | `src/components/tarjeta-video.tsx` | Miniatura grande, título serif, metadatos |
| Portada | `src/components/destacado.tsx` | Bloque de pieza principal |
| Reproductor | `src/components/reproductor.tsx` | Fachada + `iframe` bajo demanda |
| Miniatura | `src/components/miniatura.tsx` | Alternativas y marcador de la plataforma |

---

## 4. Movimiento

- Entrada de las tarjetas: `surge` (translate 14 px + opacidad) de 520 ms con
  retardo escalonado de 55 ms por posición (`--indice`).
- Hover: escala 1.03–1.04 de la miniatura en 700–900 ms, cambio de color del
  título a `acento-tenue`.
- Esqueletos de carga: pulso de opacidad (`cargando-pulso`).
- **Todos los tiempos se anulan** con `prefers-reduced-motion: reduce`.
- No hay reproducción automática ni animaciones de scroll que roben atención.

---

## 5. Accesibilidad

- Contraste alto: `hueso` sobre `noche-900` supera 14:1; `acento-tenue` sobre
  fondo oscuro, 8:1 o más.
- `:focus-visible` con contorno de 2 px en color de acento y separación de 3 px.
- Enlace de salto al contenido en el layout raíz.
- Landmarks correctos: `header`, `nav`, `main#contenido`, `footer`, `aside`
  para la ficha lateral.
- El reproductor es un `<button>` real con nombre accesible
  («Reproducir {título}»); el `iframe` tiene su propio `title`.
- Los filtros son enlaces (funcionan sin JavaScript) con `aria-current` en el
  activo.
- Los errores se anuncian con `role="alert"`; los avisos, con `role="status"`.
- Los campos del panel están etiquetados y sus errores se asocian con
  `aria-describedby` / `aria-invalid`.

---

## 6. Cómo cambiar la marca

1. **Nombre, lema y descripción**: variables `NEXT_PUBLIC_SITE_*`
   (`src/lib/config.ts` las lee). No hay que tocar ningún componente.
2. **Símbolo**: `src/components/marca.tsx` y `src/app/icon.svg` (favicon).
   Los dos dibujan la misma media luna geométrica.
3. **Colores**: los tokens de `@theme` en `src/app/globals.css`.
4. **Tipografía**: `src/app/layout.tsx` (fuentes) y `--font-display` /
   `--font-sans` en `@theme`.
5. **Textos de la interfaz**: están en los componentes, en español y sin
   referencias a la marca; se pueden reescribir sin más.

---

## 7. Lo que NO se ha hecho a propósito

- **No se ha copiado la interfaz de YouTube**: no hay barra de reproducción
  propia, ni tarjetas con el formato de YouTube, ni logotipo ni recursos
  gráficos de YouTube.
- **No hay controles propios** que no funcionen: si el vídeo se reproduce, es
  el reproductor oficial de YouTube con sus controles, sus anuncios y su
  atribución.
- **No hay gradients decorativos de más**: el único es un halo violeta muy
  tenue en la portada (`resplandor`).
