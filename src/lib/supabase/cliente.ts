/**
 * Acceso a Supabase.
 *
 * - `crearClientePublico()`: cliente sin sesión (solo lectura del catálogo
 *   público). Usa la clave anónima, por lo que queda sujeto a las políticas RLS.
 * - `crearClienteServidor()`: cliente con la sesión del visitante guardada en
 *   cookies, usado por el panel de administración.
 *
 * Ninguna clave privilegiada (`service_role`) se usa en la aplicación: todas las
 * operaciones pasan por las políticas de seguridad de PostgreSQL.
 */
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "../../types/database";

export interface ConfiguracionSupabase {
  url: string;
  claveAnonima: string;
}

/** Lee la configuración pública de Supabase desde el entorno. */
export function obtenerConfiguracionSupabase(): ConfiguracionSupabase | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const claveAnonima = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  if (!url || !claveAnonima) return null;
  return { url, claveAnonima };
}

/** Indica si el proyecto tiene las variables de entorno necesarias. */
export function supabaseConfigurado(): boolean {
  return obtenerConfiguracionSupabase() !== null;
}

/**
 * Cliente anónimo para el catálogo público.
 * No persiste sesión: la seguridad depende de las políticas RLS.
 */
export function crearClientePublico(): SupabaseClient<Database> {
  const configuracion = obtenerConfiguracionSupabase();
  if (!configuracion) {
    throw new Error(
      "Faltan las variables NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY en el entorno.",
    );
  }

  return createClient<Database>(configuracion.url, configuracion.claveAnonima, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}

/**
 * Cliente de servidor con la sesión del visitante (cookies firmadas por
 * Supabase SSR). Las acciones del estudio se ejecutan con el JWT del
 * administrador, de modo que RLS es quien autoriza cada operación.
 */
export async function crearClienteServidor(): Promise<SupabaseClient<Database>> {
  const configuracion = obtenerConfiguracionSupabase();
  if (!configuracion) {
    throw new Error(
      "Faltan las variables NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY en el entorno.",
    );
  }

  const almacenCookies = await cookies();

  return createServerClient<Database>(configuracion.url, configuracion.claveAnonima, {
    cookies: {
      getAll() {
        return almacenCookies.getAll();
      },
      setAll(cookiesParaGuardar) {
        try {
          for (const { name, value, options } of cookiesParaGuardar) {
            almacenCookies.set(name, value, options);
          }
        } catch {
          // En contextos donde no se pueden escribir cookies (p. ej. renderizado
          // estático) se ignora: la sesión se refresca igualmente en el proxy.
        }
      },
    },
  });
}
