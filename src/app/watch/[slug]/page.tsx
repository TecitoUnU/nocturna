import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { obtenerVideoPorSlug, listarRelacionados } from "@/lib/catalogo";
import { formatearFecha } from "@/lib/texto";
import { urlWatchYouTube } from "@/lib/config";
import { Reproductor } from "@/components/reproductor";
import { TarjetaVideo, fuentesMiniatura } from "@/components/tarjeta-video";
import { supabaseConfigurado } from "@/lib/supabase/cliente";

export async function generateMetadata({
  params,
}: PageProps<"/watch/[slug]">): Promise<Metadata> {
  const { slug } = await params;

  if (!supabaseConfigurado()) {
    return { title: "Video" };
  }

  const video = await obtenerVideoPorSlug(slug);
  if (!video) return { title: "Video no encontrado" };

  return {
    title: video.title,
    description: video.description || undefined,
    openGraph: {
      title: video.title,
      description: video.description || undefined,
      type: "video.other",
      images: video.thumbnail_url ? [video.thumbnail_url] : undefined,
    },
  };
}

export const dynamic = "force-dynamic";

export default async function PaginaVideo({ params }: PageProps<"/watch/[slug]">) {
  // La ficha se resuelve en cada petición (y necesita el nonce de la CSP).
  await connection();

  const { slug } = await params;

  if (!supabaseConfigurado()) {
    notFound();
  }

  const video = await obtenerVideoPorSlug(slug);
  if (!video) {
    notFound();
  }

  const relacionados = await listarRelacionados(video, 4);

  return (
    <div className="mx-auto max-w-[86rem] px-5 py-10 md:px-8 md:py-16">
      <Link
        href="/#catalogo"
        className="inline-flex items-center gap-2 text-sm text-hueso-tenue transition-colors hover:text-hueso"
      >
        <span aria-hidden="true">←</span> Volver al catálogo
      </Link>

      <div className="mt-8 grid gap-12 lg:grid-cols-12 lg:gap-16">
        <div className="lg:col-span-8">
          <Reproductor
            idVideo={video.youtube_video_id}
            titulo={video.title}
            fuentesMiniatura={fuentesMiniatura(video)}
          />

          <div className="mt-8 flex flex-wrap items-center gap-x-4 gap-y-2 text-[11px] uppercase tracking-[0.2em] text-hueso-oscuro">
            {video.category ? (
              <Link
                href={`/?categoria=${encodeURIComponent(video.category)}#catalogo`}
                className="text-acento/90 transition-colors hover:text-acento-tenue"
              >
                {video.category}
              </Link>
            ) : null}
            <time dateTime={video.published_at ?? undefined}>
              {formatearFecha(video.published_at ?? video.created_at)}
            </time>
          </div>

          <h1 className="titulo-editorial mt-4 text-3xl text-hueso sm:text-4xl md:text-5xl">
            {video.title}
          </h1>

          {video.description ? (
            <div className="mt-6 max-w-2xl space-y-4 text-base leading-relaxed text-hueso-tenue">
              {video.description.split(/\n{2,}/).map((parrafo, indice) => (
                <p key={indice}>{parrafo}</p>
              ))}
            </div>
          ) : (
            <p className="mt-6 text-sm italic text-hueso-oscuro">
              Esta pieza todavía no tiene descripción.
            </p>
          )}

          {video.tags.length > 0 ? (
            <ul className="mt-8 flex flex-wrap gap-2">
              {video.tags.map((etiqueta) => (
                <li key={etiqueta}>
                  <Link
                    href={`/?etiqueta=${encodeURIComponent(etiqueta)}#catalogo`}
                    className="inline-flex items-center rounded-full border linea px-3 py-1 text-xs text-hueso-tenue transition-colors hover:border-acento/60 hover:text-hueso"
                  >
                    #{etiqueta}
                  </Link>
                </li>
              ))}
            </ul>
          ) : null}
        </div>

        <aside className="lg:col-span-4">
          <div className="panel p-6">
            <p className="kicker text-hueso-oscuro">Ficha</p>
            <dl className="mt-5 space-y-4 text-sm">
              <div>
                <dt className="text-hueso-oscuro">Publicado en NOCTURNA</dt>
                <dd className="mt-1 text-hueso">{formatearFecha(video.published_at ?? video.created_at)}</dd>
              </div>
              {video.category ? (
                <div>
                  <dt className="text-hueso-oscuro">Categoría</dt>
                  <dd className="mt-1 text-hueso">{video.category}</dd>
                </div>
              ) : null}
              {video.tags.length > 0 ? (
                <div>
                  <dt className="text-hueso-oscuro">Etiquetas</dt>
                  <dd className="mt-1 text-hueso">{video.tags.map((t) => `#${t}`).join(" · ")}</dd>
                </div>
              ) : null}
              <div>
                <dt className="text-hueso-oscuro">Identificador de YouTube</dt>
                <dd className="mt-1 font-mono text-xs text-hueso-tenue">{video.youtube_video_id}</dd>
              </div>
            </dl>

            <a
              href={urlWatchYouTube(video.youtube_video_id)}
              target="_blank"
              rel="noopener noreferrer"
              className="boton boton-linea mt-6 w-full"
            >
              Abrir en YouTube
            </a>

            <p className="mt-5 text-xs leading-relaxed text-hueso-oscuro">
              El video está alojado en YouTube como material <span className="text-hueso-tenue">no
              listado</span>: no es privado ni está protegido con contraseña. Cualquiera que
              conozca el enlace puede verlo y compartirlo. Si el propietario ha restringido la
              inserción, el reproductor no podrá mostrarse aquí.
            </p>
          </div>
        </aside>
      </div>

      {relacionados.length > 0 ? (
        <section className="mt-24 border-t linea pt-12">
          <div className="flex items-center gap-4">
            <span className="h-px w-10 bg-acento" aria-hidden="true" />
            <h2 className="kicker text-acento">Relacionados</h2>
          </div>

          <ul className="mt-8 grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
            {relacionados.map((relacionado, indice) => (
              <li key={relacionado.id}>
                <TarjetaVideo video={relacionado} indice={indice} />
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
