import Link from "next/link";
import type { FilaVideo } from "@/types/database";
import { formatearFecha } from "@/lib/texto";
import { fuentesMiniatura } from "./tarjeta-video";
import { Miniatura } from "./miniatura";

/**
 * Bloque editorial principal: una sola pieza con protagonismo claro,
 * asymmetry visual y mucho aire alrededor.
 */
export function Destacado({ video }: { video: FilaVideo }) {
  return (
    <section id="destacado" className="relative overflow-hidden resplandor">
      <div className="mx-auto max-w-[86rem] px-5 pt-10 md:px-8 md:pt-16">
        <div className="flex items-center gap-4">
          <span className="h-px w-10 bg-acento" aria-hidden="true" />
          <p className="kicker text-acento">En portada</p>
        </div>

        <div className="mt-8 grid gap-10 lg:grid-cols-12 lg:items-center lg:gap-14">
          <div className="lg:col-span-5">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] uppercase tracking-[0.2em] text-hueso-oscuro">
              {video.category ? <span className="text-acento/90">{video.category}</span> : null}
              <time dateTime={video.published_at ?? undefined}>
                {formatearFecha(video.published_at ?? video.created_at)}
              </time>
            </div>

            <h2 className="titulo-editorial mt-5 text-4xl text-hueso sm:text-5xl lg:text-[3.6rem]">
              {video.title}
            </h2>

            {video.description ? (
              <p className="mt-6 max-w-xl text-base leading-relaxed text-hueso-tenue">
                {video.description.length > 260 ? `${video.description.slice(0, 259)}…` : video.description}
              </p>
            ) : null}

            <div className="mt-9 flex flex-wrap items-center gap-3">
              <Link href={`/watch/${video.slug}`} className="boton boton-acento">
                <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="currentColor" aria-hidden="true">
                  <path d="M8 5.5v13l11-6.5-11-6.5Z" />
                </svg>
                Ver ahora
              </Link>
              <Link href="/#catalogo" className="boton boton-linea">
                Explorar el catálogo
              </Link>
            </div>
          </div>

          <div className="lg:col-span-7">
            <Link
              href={`/watch/${video.slug}`}
              className="group relative block overflow-hidden bg-noche-850"
              aria-label={`Reproducir ${video.title}`}
            >
              <div className="aspect-video w-full">
                <Miniatura
                  fuentes={fuentesMiniatura(video)}
                  alt={`Miniatura de ${video.title}`}
                  prioridad
                  className="transition-transform duration-[900ms] ease-out group-hover:scale-[1.03]"
                />
              </div>
              <span
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 bg-gradient-to-t from-noche-950/60 via-transparent to-transparent"
              />
              <span
                aria-hidden="true"
                className="absolute bottom-5 right-5 inline-flex h-14 w-14 items-center justify-center rounded-full bg-acento text-noche-950 transition-transform duration-300 group-hover:scale-105"
              >
                <svg viewBox="0 0 24 24" className="h-5 w-5 translate-x-[1px]" fill="currentColor">
                  <path d="M8 5.5v13l11-6.5-11-6.5Z" />
                </svg>
              </span>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
