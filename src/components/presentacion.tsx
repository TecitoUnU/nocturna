import Link from "next/link";
import { proyecto } from "@/lib/proyecto";

/**
 * Presentación del proyecto: nombre, propósito, bienvenida y contexto del
 * curso. Es el primer bloque de la portada y responde de un vistazo a qué es
 * esta página y quién la hace.
 */
export function Presentacion() {
  return (
    <section id="presentacion" className="relative overflow-hidden resplandor">
      <div className="mx-auto max-w-[86rem] px-5 pt-14 md:px-8 md:pt-20">
        <div className="flex items-center gap-4">
          <span className="h-px w-10 bg-acento" aria-hidden="true" />
          <p className="kicker text-acento">
            {proyecto.institucion} · {proyecto.asignatura}
          </p>
        </div>

        <h1 className="titulo-editorial mt-6 text-5xl text-hueso sm:text-6xl md:text-8xl">
          {proyecto.nombre}
        </h1>

        <p className="titulo-editorial mt-4 max-w-3xl text-xl text-acento-tenue italic md:text-3xl">
          {proyecto.tipo}
        </p>

        <p className="mt-8 max-w-2xl text-base leading-relaxed text-hueso-tenue md:text-lg">
          {proyecto.proposito}
        </p>

        {/* Mensaje de bienvenida */}
        <div className="mt-10 max-w-3xl border-l-2 border-acento bg-noche-850/60 px-6 py-6">
          <p className="kicker text-acento">Bienvenida</p>
          <p className="mt-3 text-base leading-relaxed text-hueso md:text-lg">
            {proyecto.bienvenida}
          </p>
        </div>

        {/* Contexto del curso + datos de la asignatura */}
        <div className="mt-14 grid gap-10 border-t linea pt-10 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-7">
            <h2 className="titulo-editorial text-2xl text-hueso md:text-3xl">
              El curso de {proyecto.asignatura}
            </h2>
            <p className="mt-5 max-w-2xl text-base leading-relaxed text-hueso-tenue">
              {proyecto.presentacionCurso}
            </p>
          </div>

          <div className="lg:col-span-5">
            <h2 className="kicker text-hueso-oscuro">Ficha del proyecto</h2>
            <dl className="mt-4 space-y-3 text-sm">
              <div className="flex justify-between gap-4 border-b linea pb-3">
                <dt className="text-hueso-oscuro">Proyecto</dt>
                <dd className="text-right text-hueso">{proyecto.nombre}</dd>
              </div>
              <div className="flex justify-between gap-4 border-b linea pb-3">
                <dt className="text-hueso-oscuro">Asignatura</dt>
                <dd className="text-right text-hueso">
                  {proyecto.institucion} · {proyecto.asignatura}
                </dd>
              </div>
              <div className="flex justify-between gap-4 border-b linea pb-3">
                <dt className="text-hueso-oscuro">Docente</dt>
                <dd className="text-right text-hueso">{proyecto.docente}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-hueso-oscuro">Alojamiento del video</dt>
                <dd className="text-right text-hueso">YouTube (reproductor oficial)</dd>
              </div>
            </dl>

            <Link href="#catalogo" className="boton boton-linea mt-7">
              Ver el catálogo
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

/**
 * Integrantes del grupo. Los nombres salen de `src/lib/proyecto.ts`.
 */
export function Integrantes() {
  return (
    <section aria-labelledby="titulo-integrantes" className="mt-20 md:mt-28">
      <div className="flex items-center gap-4">
        <span className="h-px w-10 bg-acento" aria-hidden="true" />
        <h2 id="titulo-integrantes" className="kicker text-acento">
          El grupo
        </h2>
      </div>

      <p className="mt-5 max-w-2xl text-base leading-relaxed text-hueso-tenue">
        Este proyecto es obra del siguiente equipo de integrantes del curso de{" "}
        {proyecto.asignatura}.
      </p>

      <ul className="mt-8 grid gap-x-6 gap-y-4 sm:grid-cols-2 lg:grid-cols-4">
        {proyecto.integrantes.map((integrante, indice) => (
          <li
            key={integrante.nombre}
            className="animar-entrada border-l linea pl-4"
            style={{ "--indice": indice } as React.CSSProperties}
          >
            <p className="text-base text-hueso">{integrante.nombre}</p>
            {integrante.rol ? (
              <p className="mt-1 text-xs uppercase tracking-[0.16em] text-hueso-oscuro">
                {integrante.rol}
              </p>
            ) : null}
          </li>
        ))}
      </ul>
    </section>
  );
}

/**
 * Menú de temas: navegación principal hacia los distintos contenidos del
 * catálogo. Cada tema enlaza a la sección del catálogo filtrada.
 */
export function MenuTemas({
  conteos = new Map<string, number>(),
}: {
  conteos?: Map<string, number>;
}) {
  return (
    <section id="temas" aria-labelledby="titulo-temas" className="mt-20 md:mt-28">
      <div className="flex flex-col gap-4 border-b linea pb-8 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="flex items-center gap-4">
            <span className="h-px w-10 bg-acento" aria-hidden="true" />
            <p className="kicker text-acento">Menú</p>
          </div>
          <h2 id="titulo-temas" className="titulo-editorial mt-3 text-3xl text-hueso md:text-4xl">
            Los temas del curso
          </h2>
        </div>
        <p className="max-w-md text-sm leading-relaxed text-hueso-tenue">
          Cada tema reúne las piezas del catálogo que le corresponden. Si todavía no hay material
          publicado, el enlace te llevará al catálogo completo.
        </p>
      </div>

      <ul className="mt-10 grid gap-x-6 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
        {proyecto.temas.map((tema, indice) => {
          const total = conteos.get(tema.categoria) ?? 0;

          return (
            <li key={tema.titulo} className="animar-entrada" style={{ "--indice": indice } as React.CSSProperties}>
              <Link
                href={`/?categoria=${encodeURIComponent(tema.categoria)}#catalogo`}
                className="group flex h-full flex-col border-t linea pt-5 transition-colors hover:border-acento"
              >
                <span className="kicker text-hueso-oscuro">
                  {String(indice + 1).padStart(2, "0")}
                </span>
                <h3 className="titulo-editorial mt-3 text-2xl text-hueso transition-colors group-hover:text-acento-tenue">
                  {tema.titulo}
                </h3>
                <p className="mt-3 flex-1 text-sm leading-relaxed text-hueso-tenue">
                  {tema.descripcion}
                </p>
                <span className="mt-5 inline-flex items-center gap-2 text-xs text-hueso-oscuro transition-colors group-hover:text-acento">
                  {total > 0 ? `${total} ${total === 1 ? "pieza" : "piezas"}` : "Sin material aún"}
                  <span aria-hidden="true">→</span>
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
