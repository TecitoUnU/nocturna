/**
 * Configuración central de la plataforma.
 *
 * Todo lo que identifica a la marca vive aquí para poder cambiar el nombre,
 * el lema o el color de acento sin tocar el resto del código.
 *
 * Variables de entorno admitidas (todas opcionales):
 *   NEXT_PUBLIC_SITE_NAME      -> nombre visible de la plataforma (por defecto NOCTURNA)
 *   NEXT_PUBLIC_SITE_TAGLINE   -> lema corto
 *   NEXT_PUBLIC_SITE_DESCRIPTION -> descripción usada en metadatos y Open Graph
 */
export const siteConfig = {
  nombre: (process.env.NEXT_PUBLIC_SITE_NAME ?? "NOCTURNA").trim() || "NOCTURNA",
  lema:
    (process.env.NEXT_PUBLIC_SITE_TAGLINE ?? "Archivo audiovisual independiente").trim() ||
    "Archivo audiovisual independiente",
  descripcion:
    (
      process.env.NEXT_PUBLIC_SITE_DESCRIPTION ??
      "Catálogo audiovisual personal: piezas, ensayos y materiales de archivo publicados y seleccionados a mano."
    ).trim() || "Catálogo audiovisual personal.",
  urlBase: (process.env.NEXT_PUBLIC_SITE_URL ?? "").trim(),
} as const;

/** Dominio oficial de inserción de YouTube (reproductor con cookies desactivadas). */
export const DOMINIO_EMBED_YOUTUBE = "https://www.youtube-nocookie.com";

/** Enlace al estudio de YouTube para subir material nuevo. */
export const URL_YOUTUBE_STUDIO = "https://studio.youtube.com/";

/** Enlace directo a un video de YouTube a partir de su identificador. */
export function urlWatchYouTube(idVideo: string): string {
  return `https://www.youtube.com/watch?v=${idVideo}`;
}
