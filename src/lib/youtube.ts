/**
 * Validación y normalización de enlaces/identificadores de YouTube.
 *
 * Reglas:
 *  - Solo se aceptan URLs de YouTube (youtube.com, youtu.be, youtube-nocookie.com).
 *  - Solo se aceptan identificadores de 11 caracteres válidos.
 *  - Cualquier otra entrada (dominio desconocido, ruta inexistente, HTML, etc.)
 *    se rechaza con un mensaje comprensible.
 *
 * Este módulo es puro (sin dependencias de red) y se usa tanto en el servidor
 * como en el navegador para la vista previa del panel.
 */
import { DOMINIO_EMBED_YOUTUBE } from "./config";

/** Formato canónico de un identificador de video de YouTube. */
export const PATRON_ID_YOUTUBE = /^[A-Za-z0-9_-]{11}$/;

const DOMINIOS_PERMITIDOS = new Set([
  "youtube.com",
  "www.youtube.com",
  "m.youtube.com",
  "music.youtube.com",
  "youtube-nocookie.com",
  "www.youtube-nocookie.com",
  "youtu.be",
  "www.youtu.be",
]);

export type ResultadoYouTube =
  | { ok: true; id: string; url: string }
  | { ok: false; error: string };

/** Indica si una cadena es un identificador de video de YouTube válido. */
export function esIdYouTubeValido(id: string | null | undefined): boolean {
  return typeof id === "string" && PATRON_ID_YOUTUBE.test(id);
}

/**
 * Analiza una entrada de YouTube (URL o ID) y devuelve el identificador
 * normalizado o un error explicativo.
 */
export function analizarEntradaYouTube(entrada: string | null | undefined): ResultadoYouTube {
  const bruto = (entrada ?? "").trim();

  if (!bruto) {
    return { ok: false, error: "Introduce el enlace o el identificador del video de YouTube." };
  }

  if (bruto.length > 500) {
    return { ok: false, error: "La entrada es demasiado larga para ser un enlace de YouTube." };
  }

  // Un identificador desnudo.
  if (PATRON_ID_YOUTUBE.test(bruto)) {
    return { ok: true, id: bruto, url: `https://www.youtube.com/watch?v=${bruto}` };
  }

  // Debe parecer una URL absoluta: si no, no hay nada más que probar.
  if (!/^https?:\/\//i.test(bruto)) {
    return {
      ok: false,
      error:
        "Formato no válido. Pega un enlace de YouTube (por ejemplo https://www.youtube.com/watch?v=...) o un ID de 11 caracteres.",
    };
  }

  let url: URL;
  try {
    url = new URL(bruto);
  } catch {
    return { ok: false, error: "El enlace no tiene un formato de URL válido." };
  }

  if (url.protocol !== "https:" && url.protocol !== "http:") {
    return { ok: false, error: "Solo se admiten enlaces http(s) de YouTube." };
  }

  const dominio = url.hostname.toLowerCase();
  if (!DOMINIOS_PERMITIDOS.has(dominio)) {
    return {
      ok: false,
      error: `El dominio "${dominio}" no es de YouTube. Solo se permiten enlaces de youtube.com o youtu.be.`,
    };
  }

  const segmentos = url.pathname.split("/").filter(Boolean);
  let id: string | null = null;

  if (dominio === "youtu.be" || dominio === "www.youtu.be") {
    id = segmentos[0] ?? null;
  } else if (segmentos[0] === "watch") {
    id = url.searchParams.get("v");
  } else if (["embed", "shorts", "live", "v"].includes(segmentos[0] ?? "")) {
    id = segmentos[1] ?? null;
  }

  if (!id) {
    return {
      ok: false,
      error:
        "No se encontró el identificador del video en el enlace. Usa el formato https://www.youtube.com/watch?v=IDENTIFICADOR.",
    };
  }

  if (!PATRON_ID_YOUTUBE.test(id)) {
    return { ok: false, error: "El identificador del video no tiene un formato válido (11 caracteres)." };
  }

  return { ok: true, id, url: `https://www.youtube.com/watch?v=${id}` };
}

/** Construye la URL del reproductor oficial a partir de un ID ya validado. */
export function construirUrlEmbed(idVideo: string): string {
  if (!esIdYouTubeValido(idVideo)) {
    throw new Error("El identificador de video no es válido.");
  }
  return `${DOMINIO_EMBED_YOUTUBE}/embed/${idVideo}?playsinline=1`;
}

/**
 * Lista ordenada de miniaturas candidatas de YouTube para un video.
 * La primera disponible se usa; si ninguna carga, la interfaz dibuja su propio
 * estado alternativo con el diseño de la plataforma.
 */
export function candidatasMiniaturaYouTube(idVideo: string): string[] {
  if (!esIdYouTubeValido(idVideo)) return [];
  return [
    `https://i.ytimg.com/vi/${idVideo}/maxresdefault.jpg`,
    `https://i.ytimg.com/vi/${idVideo}/hqdefault.jpg`,
    `https://i.ytimg.com/vi/${idVideo}/mqdefault.jpg`,
  ];
}
