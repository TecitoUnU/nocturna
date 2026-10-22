/**
 * Capa de datos del catálogo.
 *
 * Todas las lecturas públicas pasan por el cliente anónimo de Supabase, de modo
 * que PostgreSQL (RLS) decide qué filas existen para cada visitante: solo los
 * videos con `status = 'published'` son visibles sin sesión.
 */
import { crearClientePublico, crearClienteServidor } from "./supabase/cliente";
import { escaparPatronLike, generarSlug, normalizarBusqueda } from "./texto";
import type { FilaCategoria, FilaVideo } from "../types/database";

export const TAMANO_PAGINA = 12;

export interface OpcionesCatalogo {
  busqueda?: string;
  categoria?: string;
  etiqueta?: string;
  pagina?: number;
  limite?: number;
}

export interface ResultadoCatalogo {
  videos: FilaVideo[];
  total: number;
  hayMas: boolean;
  error: string | null;
}

const RESULTADO_VACIO: ResultadoCatalogo = {
  videos: [],
  total: 0,
  hayMas: false,
  error: null,
};

function mensajeError(error: { message: string } | null): string {
  if (!error) return "No se pudo completar la consulta al catálogo.";
  return `No se pudo consultar el catálogo: ${error.message}`;
}

/**
 * Construye y ejecuta la consulta del catálogo público.
 * Si la columna de búsqueda optimizada (`title_search`) no existe —por ejemplo,
 * si las migraciones están a medias— se reintenta con un `ilike` sobre el
 * título original.
 */
export async function listarCatalogo(opciones: OpcionesCatalogo = {}): Promise<ResultadoCatalogo> {
  const limite = Math.min(Math.max(opciones.limite ?? TAMANO_PAGINA, 1), 48);
  const pagina = Math.max(opciones.pagina ?? 1, 1);
  const desde = (pagina - 1) * limite;
  const hasta = desde + limite - 1;

  const busqueda = normalizarBusqueda(opciones.busqueda);
  const categoria = (opciones.categoria ?? "").trim();
  const etiqueta = (opciones.etiqueta ?? "").trim();

  const patron = busqueda ? `%${escaparPatronLike(busqueda)}%` : null;

  const construir = (usarColumnaOptimizada: boolean) => {
    const supabase = crearClientePublico();
    let consulta = supabase
      .from("videos")
      .select("*", { count: "exact" })
      .eq("status", "published");

    if (categoria) {
      consulta = consulta.eq("category", categoria);
    }
    if (etiqueta) {
      consulta = consulta.contains("tags", [etiqueta]);
    }
    if (patron) {
      consulta = usarColumnaOptimizada
        ? consulta.like("title_search", patron)
        : consulta.ilike("title", patron);
    }

    return consulta
      .order("published_at", { ascending: false, nullsFirst: false })
      .order("id", { ascending: true })
      .range(desde, hasta);
  };

  try {
    let respuesta = await construir(Boolean(patron));
    let error = respuesta.error;

    if (error && patron && error.message.toLowerCase().includes("title_search")) {
      // La migración de búsqueda optimizada no está aplicada: usamos el título.
      respuesta = await construir(false);
      error = respuesta.error;
    }

    if (error) {
      return { ...RESULTADO_VACIO, error: mensajeError(error) };
    }

    const videos = (respuesta.data ?? []) as FilaVideo[];
    const total = respuesta.count ?? videos.length;

    return {
      videos,
      total,
      hayMas: videos.length === limite && desde + videos.length < total,
      error: null,
    };
  } catch (error) {
    return { ...RESULTADO_VACIO, error: mensajeError(error as { message: string }) };
  }
}

/** Obtiene un video publicado por su slug. */
export async function obtenerVideoPorSlug(slug: string): Promise<FilaVideo | null> {
  try {
    const supabase = crearClientePublico();
    const { data, error } = await supabase
      .from("videos")
      .select("*")
      .eq("slug", slug)
      .eq("status", "published")
      .limit(1)
      .maybeSingle();

    if (error) return null;
    return (data as FilaVideo | null) ?? null;
  } catch {
    return null;
  }
}

/** Video destacado: el marcado como destacado y, si no hay, el más reciente. */
export async function obtenerVideoDestacado(): Promise<FilaVideo | null> {
  try {
    const supabase = crearClientePublico();
    const { data, error } = await supabase
      .from("videos")
      .select("*")
      .eq("status", "published")
      .order("is_featured", { ascending: false })
      .order("published_at", { ascending: false, nullsFirst: false })
      .limit(1)
      .maybeSingle();

    if (error) return null;
    return (data as FilaVideo | null) ?? null;
  } catch {
    return null;
  }
}

/** Videos relacionados: misma categoría y, si no hay, los más recientes. */
export async function listarRelacionados(
  video: FilaVideo,
  limite = 4,
): Promise<FilaVideo[]> {
  try {
    const supabase = crearClientePublico();

    if (video.category) {
      const { data, error } = await supabase
        .from("videos")
        .select("*")
        .eq("status", "published")
        .eq("category", video.category)
        .neq("id", video.id)
        .order("published_at", { ascending: false, nullsFirst: false })
        .limit(limite);

      if (!error && (data ?? []).length > 0) {
        return data as FilaVideo[];
      }
    }

    const { data, error } = await supabase
      .from("videos")
      .select("*")
      .eq("status", "published")
      .neq("id", video.id)
      .order("published_at", { ascending: false, nullsFirst: false })
      .limit(limite);

    if (error) return [];
    return (data as FilaVideo[]) ?? [];
  } catch {
    return [];
  }
}

/** Categorías disponibles para los filtros del catálogo. */
export async function listarCategorias(): Promise<FilaCategoria[]> {
  try {
    const supabase = crearClientePublico();
    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .order("name", { ascending: true });

    if (error) return [];
    return (data as FilaCategoria[]) ?? [];
  } catch {
    return [];
  }
}

/** Etiquetas más frecuentes entre los videos publicados. */
export async function listarEtiquetas(limite = 14): Promise<{ etiqueta: string; total: number }[]> {
  try {
    const supabase = crearClientePublico();
    const { data, error } = await supabase
      .from("videos")
      .select("tags")
      .eq("status", "published")
      .limit(300);

    if (error) return [];

    const contador = new Map<string, number>();
    for (const fila of (data ?? []) as { tags: string[] }[]) {
      for (const etiqueta of fila.tags ?? []) {
        contador.set(etiqueta, (contador.get(etiqueta) ?? 0) + 1);
      }
    }

    return [...contador.entries()]
      .map(([etiqueta, total]) => ({ etiqueta, total }))
      .sort((a, b) => b.total - a.total || a.etiqueta.localeCompare(b.etiqueta))
      .slice(0, limite);
  } catch {
    return [];
  }
}

/**
 * Lista completa de videos para el panel de administración.
 * Usa la sesión del administrador: RLS permite leer borradores solo a quien
 * figure en la tabla `admins`.
 */
export async function listarVideosAdministracion(): Promise<{
  videos: FilaVideo[];
  error: string | null;
}> {
  try {
    const supabase = await crearClienteServidor();
    const { data, error } = await supabase
      .from("videos")
      .select("*")
      .order("updated_at", { ascending: false });

    if (error) return { videos: [], error: mensajeError(error) };
    return { videos: (data as FilaVideo[]) ?? [], error: null };
  } catch (error) {
    return { videos: [], error: mensajeError(error as { message: string }) };
  }
}

/** Un video concreto por identificador (solo accesible para administradores). */
export async function obtenerVideoAdministracion(id: string): Promise<FilaVideo | null> {
  try {
    const supabase = await crearClienteServidor();
    const { data, error } = await supabase.from("videos").select("*").eq("id", id).maybeSingle();
    if (error) return null;
    return (data as FilaVideo | null) ?? null;
  } catch {
    return null;
  }
}

/**
 * Genera un slug único a partir de un título.
 * Si ya existe, añade un sufijo numérico.
 */
export async function generarSlugUnico(titulo: string, ignorarId?: string): Promise<string> {
  const base = generarSlug(titulo);
  const supabase = await crearClienteServidor();

  for (let intento = 0; intento < 25; intento += 1) {
    const candidato = intento === 0 ? base : `${base}-${intento + 1}`;
    const { data, error } = await supabase
      .from("videos")
      .select("id")
      .eq("slug", candidato)
      .maybeSingle();

    if (error) {
      // Sin permiso de lectura: se asume que el slug está libre y el índice
      // único de la base de datos protege la integridad final.
      return candidato;
    }
    if (!data) return candidato;
    if (ignorarId && data.id === ignorarId) return candidato;
  }

  return `${base}-${Date.now().toString(36)}`;
}
