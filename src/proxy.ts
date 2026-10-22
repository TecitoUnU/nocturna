import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

/**
 * Proxy (antes «middleware» en Next.js 15).
 *
 *  1. Refresca la sesión de Supabase y mantiene las cookies al día.
 *  2. Genera un nonce por petición y aplica una Content-Security-Policy
 *     estricta que sólo permite insertar el reproductor oficial de YouTube.
 *
 * La autorización real no depende de este archivo: las políticas RLS de
 * PostgreSQL son las que impiden leer borradores o escribir en el catálogo.
 */

const urlSupabase = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
const claveAnonima = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

function dominiosPermitidos(): string[] {
  const dominios = ["https://*.supabase.co"];
  if (urlSupabase) {
    try {
      dominios.push(new URL(urlSupabase).origin);
    } catch {
      /* URL inválida: se ignora */
    }
  }
  return [...new Set(dominios)];
}

function construirCSP(nonce: string): string {
  const esDesarrollo = process.env.NODE_ENV === "development";

  const directivas = [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${esDesarrollo ? " 'unsafe-eval'" : ""}`,
    "style-src 'self' 'unsafe-inline'",
    `img-src 'self' blob: data: https://i.ytimg.com https://img.youtube.com https://yt3.ggpht.com https://lh3.googleusercontent.com ${dominiosPermitidos().join(" ")}`,
    "font-src 'self' data:",
    `media-src 'self' blob: ${dominiosPermitidos().join(" ")}`,
    `connect-src 'self' ${dominiosPermitidos().join(" ")} wss://*.supabase.co`,
    "frame-src https://www.youtube-nocookie.com https://www.youtube.com",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "manifest-src 'self'",
    "worker-src 'self' blob:",
  ];

  if (!esDesarrollo) {
    directivas.push("upgrade-insecure-requests");
  }

  return directivas.join("; ").replace(/\s{2,}/g, " ").trim();
}

export async function proxy(request: NextRequest) {
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
  const csp = construirCSP(nonce);

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("Content-Security-Policy", csp);

  let response = NextResponse.next({ request: { headers: requestHeaders } });

  if (urlSupabase && claveAnonima) {
    const supabase = createServerClient(urlSupabase, claveAnonima, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesParaGuardar) {
          for (const { name, value } of cookiesParaGuardar) {
            request.cookies.set(name, value);
          }
          response = NextResponse.next({ request: { headers: requestHeaders } });
          for (const { name, value, options } of cookiesParaGuardar) {
            response.cookies.set(name, value, options);
          }
          response.headers.set("Content-Security-Policy", csp);
        },
      },
    });

    try {
      // Verifica el JWT (y refresca la sesión si está por expirar) sin
      // convertir la comprobación en una llamada obligatoria al servidor.
      await supabase.auth.getClaims();
    } catch {
      // Sin sesión válida: la navegación continúa y las páginas públicas
      // siguen funcionando con el cliente anónimo.
    }
  }

  response.headers.set("Content-Security-Policy", csp);
  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|icon.svg|robots.txt|sitemap.xml|.*\\.(?:svg|png|jpg|jpeg|gif|webp|avif|ico|woff2|woff)$).*)",
  ],
};
