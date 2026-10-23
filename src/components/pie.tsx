import Link from "next/link";
import { siteConfig } from "@/lib/config";
import { proyecto } from "@/lib/proyecto";
import { Marca } from "./marca";

export function Pie() {
  const anio = new Date().getFullYear();
  const integrantes = proyecto.integrantes
    .map((integrante) => integrante.nombre)
    .join(" · ");

  return (
    <footer className="mt-24 border-t linea bg-noche-950/60">
      <div className="mx-auto flex max-w-[86rem] flex-col gap-8 px-5 py-12 md:flex-row md:items-start md:justify-between md:px-8">
        <div className="max-w-md">
          <Marca />
          <p className="mt-4 text-sm leading-relaxed text-hueso-tenue">{proyecto.proposito}</p>
        </div>

        <div className="flex flex-col gap-3 text-sm text-hueso-tenue">
          <p className="kicker text-hueso-oscuro">Navegación</p>
          <Link href="/#presentacion" className="transition-colors hover:text-hueso">
            Presentación del proyecto
          </Link>
          <Link href="/#temas" className="transition-colors hover:text-hueso">
            Temas del curso
          </Link>
          <Link href="/#catalogo" className="transition-colors hover:text-hueso">
            Catálogo de videos
          </Link>
        </div>

        <div className="flex flex-col gap-3 text-sm text-hueso-tenue">
          <p className="kicker text-hueso-oscuro">Grupo</p>
          <p className="max-w-xs leading-relaxed">{integrantes}</p>
          <p className="text-xs text-hueso-oscuro">
            {proyecto.institucion} · {proyecto.asignatura}
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-[86rem] border-t linea px-5 py-6 text-xs text-hueso-oscuro md:px-8">
        <p>
          © {anio} {siteConfig.nombre}. Los videos se alojan en YouTube y se reproducen con su
          reproductor oficial; el catálogo y los metadatos son propios de {proyecto.nombre}.
        </p>
      </div>
    </footer>
  );
}
