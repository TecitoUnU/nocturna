/**
 * Validación de entradas del administrador: miniaturas, metadatos y archivos.
 *
 * Objetivo: que ningún campo del panel permita inyectar HTML, JavaScript o
 * URLs de origen desconocido en la web pública.
 */
import { analizarEntradaYouTube } from "./youtube";

/** Dominios admitidos para miniaturas propias además de los de YouTube. */
const DOMINIOS_MINIATURA_BASE = new Set([
  "i.ytimg.com",
  "img.youtube.com",
  "yt3.ggpht.com",
  "lh3.googleusercontent.com",
]);

/** Tipos de imagen admitidos en la subida de miniaturas. */
export const TIPOS_IMAGEN_PERMITIDOS = ["image/jpeg", "image/png", "image/webp", "image/avif"];

/** Tamaño máximo de una miniatura subida (5 MB). */
export const TAMANO_MAXIMO_MINIATURA = 5 * 1024 * 1024;

function dominiosPermitidos(): Set<string> {
  const dominios = new Set(DOMINIOS_MINIATURA_BASE);

  // El almacenamiento de Supabase (mismo proyecto) también es admisible.
  const urlSupabase = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (urlSupabase) {
    try {
      dominios.add(new URL(urlSupabase).hostname.toLowerCase());
    } catch {
      /* URL inválida: se ignora */
    }
  }

  // Dominios adicionales declarados por el administrador del proyecto.
  const extra = process.env.ALLOWED_THUMBNAIL_HOSTS;
  if (extra) {
    for (const dominio of extra.split(",").map((d) => d.trim().toLowerCase()).filter(Boolean)) {
      dominios.add(dominio);
    }
  }

  return dominios;
}

export type ResultadoValidacion =
  | { ok: true; valor: string }
  | { ok: false; error: string };

/** Valida una URL de miniatura externa. */
export function validarUrlMiniatura(entrada: string | null | undefined): ResultadoValidacion {
  const bruto = (entrada ?? "").trim();
  if (!bruto) return { ok: false, error: "La URL de la miniatura está vacía." };

  let url: URL;
  try {
    url = new URL(bruto);
  } catch {
    return { ok: false, error: "La URL de la miniatura no es válida." };
  }

  if (url.protocol !== "https:") {
    return { ok: false, error: "La miniatura debe usar una URL segura (https://)." };
  }

  if (url.username || url.password) {
    return { ok: false, error: "La URL de la miniatura no puede incluir credenciales." };
  }

  const dominio = url.hostname.toLowerCase();
  if (!dominiosPermitidos().has(dominio)) {
    return {
      ok: false,
      error: `El dominio "${dominio}" no está permitido para miniaturas.`,
    };
  }

  return { ok: true, valor: url.toString() };
}

/** Valida un archivo de imagen subido desde el panel. */
export function validarArchivoMiniatura(archivo: File | null | undefined): ResultadoValidacion {
  if (!archivo) {
    return { ok: false, error: "Selecciona un archivo de imagen." };
  }
  if (!TIPOS_IMAGEN_PERMITIDOS.includes(archivo.type)) {
    return {
      ok: false,
      error: "Formato no válido. Usa JPEG, PNG, WebP o AVIF (los SVG no se admiten).",
    };
  }
  if (archivo.size > TAMANO_MAXIMO_MINIATURA) {
    return { ok: false, error: "La imagen supera el límite de 5 MB." };
  }
  return { ok: true, valor: archivo.name };
}

/** Resultado de validar los metadatos de un video del catálogo. */
export type MetadatosVideo = {
  youtubeVideoId: string;
  titulo: string;
  descripcion: string;
  categoria: string;
  etiquetas: string[];
  estado: "draft" | "published";
  destacado: boolean;
};

export type ErroresMetadatos = {
  youtube?: string;
  titulo?: string;
  descripcion?: string;
  categoria?: string;
  etiquetas?: string;
  miniatura?: string;
};

/** Valida y normaliza los metadatos enviados desde el formulario del estudio. */
export function validarMetadatosVideo(datos: {
  youtube: string;
  titulo: string;
  descripcion: string;
  categoria: string;
  etiquetas: string;
  estado: string;
  destacado: boolean;
}): { ok: true; valor: MetadatosVideo } | { ok: false; errores: ErroresMetadatos } {
  const errores: ErroresMetadatos = {};

  const youtube = analizarEntradaYouTube(datos.youtube);
  if (!youtube.ok) {
    errores.youtube = youtube.error;
  }

  const titulo = (datos.titulo ?? "").trim();
  if (titulo.length < 3) {
    errores.titulo = "El título necesita al menos 3 caracteres.";
  } else if (titulo.length > 140) {
    errores.titulo = "El título no puede superar los 140 caracteres.";
  }

  const descripcion = (datos.descripcion ?? "").trim();
  if (descripcion.length > 4000) {
    errores.descripcion = "La descripción no puede superar los 4000 caracteres.";
  }

  const categoria = (datos.categoria ?? "").trim();
  if (categoria.length > 60) {
    errores.categoria = "El nombre de la categoría es demasiado largo.";
  }

  if (datos.estado === "published" && !categoria) {
    errores.categoria = "Selecciona una categoría para publicar el video.";
  }

  const etiquetas = (datos.etiquetas ?? "")
    .split(",")
    .map((e) => e.trim())
    .filter(Boolean);
  if (etiquetas.length > 10) {
    errores.etiquetas = "Máximo 10 etiquetas.";
  }

  if (Object.keys(errores).length > 0) {
    return { ok: false, errores };
  }

  return {
    ok: true,
    valor: {
      youtubeVideoId: youtube.ok ? youtube.id : "",
      titulo,
      descripcion,
      categoria,
      etiquetas: etiquetas.map((e) => e.toLowerCase()).slice(0, 10),
      estado: datos.estado === "published" ? "published" : "draft",
      destacado: Boolean(datos.destacado),
    },
  };
}
