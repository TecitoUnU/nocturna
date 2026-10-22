import Link from "next/link";
import type { FilaCategoria } from "@/types/database";

/**
 * Filtros del catálogo: por categoría y por etiqueta.
 *
 * Son enlaces reales (sin JavaScript), así que funcionan con teclado, se
 * pueden compartir por URL y el servidor resuelve cada combinación.
 */
export function Filtros({
  categorias,
  etiquetas,
  categoriaActual,
  etiquetaActual,
  busqueda,
}: {
  categorias: FilaCategoria[];
  etiquetas: { etiqueta: string; total: number }[];
  categoriaActual?: string;
  etiquetaActual?: string;
  busqueda?: string;
}) {
  const construir = (opciones: { categoria?: string | null; etiqueta?: string | null }) => {
    const parametros = new URLSearchParams();
    if (busqueda) parametros.set("q", busqueda);
    if (opciones.categoria) parametros.set("categoria", opciones.categoria);
    if (opciones.etiqueta) parametros.set("etiqueta", opciones.etiqueta);
    const cadena = parametros.toString();
    return cadena ? `/?${cadena}` : "/";
  };

  const chip = (activo: boolean) =>
    `inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-xs transition-colors ${
      activo
        ? "border-acento bg-acento/15 text-acento-tenue"
        : "linea text-hueso-tenue hover:border-acento/60 hover:text-hueso"
    }`;

  return (
    <div className="flex flex-col gap-6">
      <nav id="categorias" aria-label="Filtrar por categoría">
        <p className="kicker mb-3 text-hueso-oscuro">Categorías</p>
        <ul className="flex flex-wrap gap-2">
          <li>
            <Link
              href={construir({ categoria: null, etiqueta: null })}
              aria-current={!categoriaActual ? "true" : undefined}
              className={chip(!categoriaActual)}
            >
              Todas
            </Link>
          </li>
          {categorias.map((categoria) => (
            <li key={categoria.id}>
              <Link
                href={construir({ categoria: categoria.name, etiqueta: null })}
                aria-current={categoriaActual === categoria.name ? "true" : undefined}
                className={chip(categoriaActual === categoria.name)}
              >
                {categoria.name}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {etiquetas.length > 0 ? (
        <nav id="etiquetas" aria-label="Filtrar por etiqueta">
          <p className="kicker mb-3 text-hueso-oscuro">Etiquetas</p>
          <ul className="flex flex-wrap gap-2">
            {etiquetas.map(({ etiqueta, total }) => (
              <li key={etiqueta}>
                <Link
                  href={construir({ categoria: null, etiqueta })}
                  aria-current={etiquetaActual === etiqueta ? "true" : undefined}
                  className={chip(etiquetaActual === etiqueta)}
                >
                  #{etiqueta}
                  <span className="text-[10px] text-hueso-oscuro">{total}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      ) : null}
    </div>
  );
}
