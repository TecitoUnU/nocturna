import Link from "next/link";
import { siteConfig } from "@/lib/config";
import { Marca } from "./marca";

export function Pie() {
  const anio = new Date().getFullYear();

  return (
    <footer className="mt-24 border-t linea bg-noche-950/60">
      <div className="mx-auto flex max-w-[86rem] flex-col gap-8 px-5 py-12 md:flex-row md:items-start md:justify-between md:px-8">
        <div className="max-w-md">
          <Marca />
          <p className="mt-4 text-sm leading-relaxed text-hueso-tenue">{siteConfig.descripcion}</p>
        </div>

        <div className="flex flex-col gap-3 text-sm text-hueso-tenue">
          <p className="kicker text-hueso-oscuro">Navegación</p>
          <Link href="/#catalogo" className="transition-colors hover:text-hueso">
            Catálogo
          </Link>
          <Link href="/#destacado" className="transition-colors hover:text-hueso">
            Video destacado
          </Link>
          <Link href="/#etiquetas" className="transition-colors hover:text-hueso">
            Etiquetas
          </Link>
        </div>
      </div>

      <div className="mx-auto max-w-[86rem] border-t linea px-5 py-6 text-xs text-hueso-oscuro md:px-8">
        <p>
          © {anio} {siteConfig.nombre}. Los videos se alojan en YouTube y se reproducen con su
          reproductor oficial; el catálogo y los metadatos son propios.
        </p>
      </div>
    </footer>
  );
}
