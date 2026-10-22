"use server";

/**
 * Acciones del catálogo: alta, edición, publicación y borrado.
 *
 * Todas las acciones:
 *  1. Verifican la sesión contra el servidor de autenticación de Supabase.
 *  2. Verifican que el usuario figure en la tabla `admins`.
 *  3. Dejan la autorización final en las políticas RLS de PostgreSQL
 *     (un cliente anónimo o una sesión no autorizada no puede escribir).
 */
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { SupabaseClient } from "@supabase/supabase-js";
import { crearClienteServidor } from "../supabase/cliente";
import { esAdministrador } from "../auth";
import { obtenerVideoAdministracion, generarSlugUnico } from "../catalogo";
import {
  validarArchivoMiniatura,
  validarMetadatosVideo,
  validarUrlMiniatura,
} from "../validacion";
import { BUCKET_MINIATURAS } from "../constantes";
import type { Database, FilaVideo } from "../../types/database";
import { estadoError, type EstadoFormulario } from "./tipos";



type ClienteSupabase = SupabaseClient<Database>;

interface ResultadoSubida {
  url?: string;
  path?: string;
  error?: string;
}

async function subirMiniatura(
  supabase: ClienteSupabase,
  archivo: File,
  referencia: string,
): Promise<ResultadoSubida> {
  const nombre = archivo.name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9._-]/g, "-")
    .slice(-60);

  const path = `miniaturas/${referencia}-${crypto.randomUUID().slice(0, 8)}-${nombre}`;

  const { error } = await supabase.storage
    .from(BUCKET_MINIATURAS)
    .upload(path, archivo, { contentType: archivo.type, upsert: false });

  if (error) {
    return {
      error:
        "No se pudo subir la miniatura al almacenamiento. Revisa que el bucket 'thumbnails' exista y que las políticas de RLS estén aplicadas.",
    };
  }

  const { data } = supabase.storage.from(BUCKET_MINIATURAS).getPublicUrl(path);
  return { url: data.publicUrl, path };
}

async function borrarMiniaturaAnterior(
  supabase: ClienteSupabase,
  video: FilaVideo | null,
): Promise<void> {
  if (!video?.thumbnail_path) return;
  try {
    await supabase.storage.from(BUCKET_MINIATURAS).remove([video.thumbnail_path]);
  } catch {
    // Si el objeto ya no existe, no es un problema: el catálogo sigue siendo válido.
  }
}

function mensajeErrorUnico(error: { code?: string; message: string }): string {
  if (error.code === "23505") {
    return "Ya existe un video con ese identificador de YouTube o con ese título.";
  }
  return `No se pudo guardar el video: ${error.message}`;
}

/** Guarda (crea o actualiza) un video del catálogo. */
export async function guardarVideo(
  _estado: EstadoFormulario,
  formData: FormData,
): Promise<EstadoFormulario> {
  const supabase = await crearClienteServidor();

  const { data: usuarioData, error: errorSesion } = await supabase.auth.getUser();
  const usuario = usuarioData?.user ?? null;

  if (errorSesion || !usuario) {
    return estadoError("Tu sesión no es válida. Vuelve a iniciar sesión.");
  }
  if (!(await esAdministrador(supabase, usuario))) {
    return estadoError("Esta cuenta no tiene permisos de administrador.");
  }

  const id = (formData.get("id") ?? "").toString().trim() || null;

  const validacion = validarMetadatosVideo({
    youtube: (formData.get("youtube") ?? "").toString(),
    titulo: (formData.get("titulo") ?? "").toString(),
    descripcion: (formData.get("descripcion") ?? "").toString(),
    categoria: (formData.get("categoria") ?? "").toString(),
    etiquetas: (formData.get("etiquetas") ?? "").toString(),
    estado: (formData.get("estado") ?? "draft").toString(),
    destacado: formData.get("destacado") === "on" || formData.get("destacado") === "true",
  });

  if (!validacion.ok) {
    return estadoError("Revisa los campos marcados antes de guardar.", validacion.errores);
  }

  const meta = validacion.valor;
  const existente = id ? await obtenerVideoAdministracion(id) : null;

  if (id && !existente) {
    return estadoError("El video que intentas modificar ya no existe.");
  }

  // --- Miniatura: archivo subido o URL validada -------------------------
  let miniaturaUrl: string | null = existente?.thumbnail_url ?? null;
  let miniaturaPath: string | null = existente?.thumbnail_path ?? null;

  const archivo = formData.get("miniaturaArchivo");
  if (archivo instanceof File && archivo.size > 0) {
    const comprobacion = validarArchivoMiniatura(archivo);
    if (!comprobacion.ok) {
      return estadoError(comprobacion.error, { miniatura: comprobacion.error });
    }
    const subida = await subirMiniatura(supabase, archivo, id ?? crypto.randomUUID());
    if (subida.error || !subida.url) {
      return estadoError(subida.error ?? "No se pudo subir la miniatura.", {
        miniatura: subida.error ?? "No se pudo subir la miniatura.",
      });
    }
    miniaturaUrl = subida.url;
    miniaturaPath = subida.path ?? null;
  } else {
    const urlManual = (formData.get("miniaturaUrl") ?? "").toString().trim();
    const quitar = (formData.get("quitarMiniatura") ?? "").toString() === "1";
    if (urlManual) {
      const comprobacion = validarUrlMiniatura(urlManual);
      if (!comprobacion.ok) {
        return estadoError(comprobacion.error, { miniatura: comprobacion.error });
      }
      miniaturaUrl = comprobacion.valor;
      miniaturaPath = null;
    } else if (quitar) {
      miniaturaUrl = null;
      miniaturaPath = null;
    }
  }

  const ahora = new Date().toISOString();

  const datos = {
    youtube_video_id: meta.youtubeVideoId,
    title: meta.titulo,
    description: meta.descripcion,
    category: meta.categoria || null,
    tags: meta.etiquetas,
    status: meta.estado,
    is_featured: meta.destacado,
    thumbnail_url: miniaturaUrl,
    thumbnail_path: miniaturaPath,
    updated_at: ahora,
  };

  let videoId = id;

  if (id) {
    const { error } = await supabase.from("videos").update(datos).eq("id", id);
    if (error) {
      return estadoError(mensajeErrorUnico(error));
    }
    // La miniatura anterior se elimina solo si se ha sustituido.
    if (miniaturaPath !== existente?.thumbnail_path) {
      await borrarMiniaturaAnterior(supabase, existente);
    }
  } else {
    const slug = await generarSlugUnico(meta.titulo);
    const { data, error } = await supabase
      .from("videos")
      .insert({
        ...datos,
        slug,
        published_at: meta.estado === "published" ? ahora : null,
      })
      .select("id")
      .single();

    if (error) {
      return estadoError(mensajeErrorUnico(error));
    }
    videoId = data.id;
  }

  // Solo puede haber un video destacado a la vez.
  if (meta.destacado && videoId) {
    await supabase.from("videos").update({ is_featured: false }).neq("id", videoId);
  }

  revalidatePath("/");
  revalidatePath("/studio");
  if (videoId) {
    const slug = existente?.slug;
    if (slug) revalidatePath(`/watch/${slug}`);
  }

  redirect("/studio?mensaje=guardado");
}

/** Publica o despublica un video existente. */
export async function cambiarEstadoVideo(formData: FormData): Promise<void> {
  const supabase = await crearClienteServidor();
  const { data: usuarioData } = await supabase.auth.getUser();
  const usuario = usuarioData?.user ?? null;

  if (!usuario || !(await esAdministrador(supabase, usuario))) {
    redirect("/studio?mensaje=sin-permisos");
  }

  const id = (formData.get("id") ?? "").toString().trim();
  const accion = (formData.get("accion") ?? "").toString();
  if (!id) redirect("/studio");

  const ahora = new Date().toISOString();

  if (accion === "publicar") {
    const { error } = await supabase
      .from("videos")
      .update({ status: "published", published_at: ahora, updated_at: ahora })
      .eq("id", id);
    if (error) redirect("/studio?mensaje=error");
  } else if (accion === "despublicar") {
    const { error } = await supabase
      .from("videos")
      .update({ status: "draft", published_at: null, updated_at: ahora })
      .eq("id", id);
    if (error) redirect("/studio?mensaje=error");
  }

  revalidatePath("/");
  revalidatePath("/studio");
  redirect("/studio?mensaje=estado");
}

/** Elimina un video del catálogo. */
export async function eliminarVideo(formData: FormData): Promise<void> {
  const supabase = await crearClienteServidor();
  const { data: usuarioData } = await supabase.auth.getUser();
  const usuario = usuarioData?.user ?? null;

  if (!usuario || !(await esAdministrador(supabase, usuario))) {
    redirect("/studio?mensaje=sin-permisos");
  }

  const id = (formData.get("id") ?? "").toString().trim();
  if (!id) redirect("/studio");

  const video = await obtenerVideoAdministracion(id);

  const { error } = await supabase.from("videos").delete().eq("id", id);
  if (error) redirect("/studio?mensaje=error");

  await borrarMiniaturaAnterior(supabase, video);

  revalidatePath("/");
  revalidatePath("/studio");
  redirect("/studio?mensaje=eliminado");
}
