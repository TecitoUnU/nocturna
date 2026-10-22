import Link from "next/link";
import { Buscador } from "./buscador";
import { Marca } from "./marca";

/**
 * Cabecera pública. No enlaza al panel de administración en ningún punto:
 * la ruta /studio es discreta y sólo se conoce por URL directa.
 */
export function Cabecera() {
  return (
    <header className="sticky top-0 z-40 border-b linea bg-noche-900/85 backdrop-blur-xl">
      <div className="mx-auto flex max-w-[86rem] flex-col gap-3 px-5 py-4 md:flex-row md:items-center md:justify-between md:gap-8 md:px-8">
        <div className="flex items-center justify-between gap-6">
          <Marca />
          <nav aria-label="Navegación principal" className="hidden md:block">
            <ul className="flex items-center gap-7 text-sm text-hueso-tenue">
              <li>
                <Link href="/#catalogo" className="transition-colors hover:text-hueso">
                  Catálogo
                </Link>
              </li>
              <li>
                <Link href="/#etiquetas" className="transition-colors hover:text-hueso">
                  Etiquetas
                </Link>
              </li>
              <li>
                <Link href="/#destacado" className="transition-colors hover:text-hueso">
                  Destacado
                </Link>
              </li>
            </ul>
          </nav>
        </div>

        <div className="md:w-80">
          <Buscador />
        </div>
      </div>
    </header>
  );
}
