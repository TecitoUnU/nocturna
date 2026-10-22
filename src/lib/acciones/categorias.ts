"use server";

/** Alta de categorías del catálogo (solo administradores). */
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { crearClienteServidor } from "../supabase/cliente";
import { esAdministrador } from "../auth";
import { generarSlug } from "../texto";
import { estadoError, type EstadoFormulario } from "./tipos";

export async function crearCategoria(
  _estado: EstadoFormulario,
  formData: FormData,
): Promise<EstadoFormulario> {
  const supabase = await crearClienteServidor();
  const { data: usuarioData } = await supabase.auth.getUser();
  const usuario = usuarioData?.user ?? null;

  if (!usuario) return estadoError("Tu sesión no es válida. Vuelve a iniciar sesión.");
  if (!(await esAdministrador(supabase, usuario))) {
    return estadoError("Esta cuenta no tiene permisos de administrador.");
  }

  const nombre = (formData.get("nombre") ?? "").toString().trim();
  if (nombre.length < 2) {
    return estadoError("Escribe un nombre de categoría.", { nombre: "Nombre demasiado corto." });
  }
  if (nombre.length > 60) {
    return estadoError("El nombre de la categoría es demasiado largo.", {
      nombre: "Máximo 60 caracteres.",
    });
  }

  const slug = generarSlug(nombre, 40);
  const { error } = await supabase.from("categories").insert({ name: nombre, slug });

  if (error) {
    if (error.code === "23505") {
      return estadoError("Ya existe una categoría con ese nombre.", { nombre: "Categoría repetida." });
    }
    return estadoError(`No se pudo crear la categoría: ${error.message}`);
  }

  revalidatePath("/");
  revalidatePath("/studio");
  redirect("/studio?mensaje=categoria");
}

export async function eliminarCategoria(formData: FormData): Promise<void> {
  const supabase = await crearClienteServidor();
  const { data: usuarioData } = await supabase.auth.getUser();
  const usuario = usuarioData?.user ?? null;

  if (!usuario || !(await esAdministrador(supabase, usuario))) {
    redirect("/studio?mensaje=sin-permisos");
  }

  const id = (formData.get("id") ?? "").toString().trim();
  if (id) {
    await supabase.from("categories").delete().eq("id", id);
  }

  revalidatePath("/");
  revalidatePath("/studio");
  redirect("/studio?mensaje=categoria");
}
