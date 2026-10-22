/**
 * Utilidades de sesión y autorización.
 *
 * La identidad se valida contra el servidor de autenticación de Supabase
 * (`getUser`), no contra la cookie sin verificar. La autorización depende de
 * la tabla `admins`: PostgreSQL sólo permite escribir en `videos` a quien
 * figure en ella (políticas RLS).
 */
import type { SupabaseClient, User } from "@supabase/supabase-js";
import type { Database } from "../types/database";

/**
 * Comprueba si un usuario es administrador.
 * La consulta se hace con la sesión del propio usuario: las políticas RLS
 * permiten leer únicamente la fila que le corresponde.
 */
export async function esAdministrador(
  supabase: SupabaseClient<Database>,
  usuario: User | null,
): Promise<boolean> {
  if (!usuario?.email) return false;

  const { data, error } = await supabase
    .from("admins")
    .select("id")
    .ilike("email", usuario.email)
    .maybeSingle();

  if (!error && data) return true;

  // Alternativa admitida: marcar el rol en app_metadata del usuario.
  return usuario.app_metadata?.role === "admin";
}
