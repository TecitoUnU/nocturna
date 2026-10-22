"use server";

/**
 * Acciones de autenticación del panel.
 *
 * El registro público de usuarios está desactivado en Supabase: solo existe
 * un administrador creado manualmente (ver docs/ADMINISTRADOR.md).
 */
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { crearClienteServidor } from "../supabase/cliente";
import { estadoError, type EstadoFormulario } from "./tipos";

export async function iniciarSesion(
  _estado: EstadoFormulario,
  formData: FormData,
): Promise<EstadoFormulario> {
  const correo = (formData.get("correo") ?? "").toString().trim().toLowerCase();
  const clave = (formData.get("clave") ?? "").toString();

  if (!correo || !clave) {
    return estadoError("Introduce tu correo y tu contraseña.");
  }

  const supabase = await crearClienteServidor();

  const { error } = await supabase.auth.signInWithPassword({
    email: correo,
    password: clave,
  });

  if (error) {
    // No revelamos si el correo existe: mismo mensaje para ambos casos.
    return estadoError("Credenciales incorrectas. Revisa el correo y la contraseña.");
  }

  revalidatePath("/studio");
  redirect("/studio");
}

export async function cerrarSesion(): Promise<void> {
  const supabase = await crearClienteServidor();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/studio");
}
