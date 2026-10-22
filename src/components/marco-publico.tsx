import type { ReactNode } from "react";
import { Cabecera } from "./cabecera";
import { Pie } from "./pie";

/**
 * Marco común de las páginas públicas: cabecera con buscador, contenido y pie.
 * Se usa como layout en los segmentos públicos.
 */
export function MarcoPublico({ children }: { children: ReactNode }) {
  return (
    <>
      <Cabecera />
      <main id="contenido" className="flex-1">
        {children}
      </main>
      <Pie />
    </>
  );
}
