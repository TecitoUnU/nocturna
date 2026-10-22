import { NextResponse } from "next/server";
import { listarCatalogo } from "@/lib/catalogo";
import { normalizarBusqueda } from "@/lib/texto";

/**
 * API del catálogo: sirve las páginas siguientes del listado.
 *
 * Usa el mismo cliente anónimo que las páginas, de modo que RLS se aplica
 * igual: sólo se devuelven videos publicados.
 */
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);

  const busqueda = normalizarBusqueda(url.searchParams.get("q") ?? "");
  const categoria = (url.searchParams.get("categoria") ?? "").trim();
  const etiqueta = (url.searchParams.get("etiqueta") ?? "").trim();
  const pagina = Math.max(Number(url.searchParams.get("pagina")) || 1, 1);

  const resultado = await listarCatalogo({ busqueda, categoria, etiqueta, pagina });

  return NextResponse.json(
    {
      videos: resultado.videos,
      total: resultado.total,
      hayMas: resultado.hayMas,
      error: resultado.error,
    },
    {
      status: resultado.error ? 500 : 200,
      headers: {
        "cache-control": "no-store",
      },
    },
  );
}
