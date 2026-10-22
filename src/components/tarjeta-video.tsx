import Link from "next/link";
import type { FilaVideo } from "@/types/database";
import { candidatasMiniaturaYouTube } from "@/lib/youtube";
import { formatearFechaCorta, recortar } from "@/lib/texto";
import { Miniatura } from "./miniatura";

/** Fuentes de imagen de una ficha: la propia si existe y, si no, las de YouTube. */
export function fuentesMiniatura(video: FilaVideo): string[] {
  const propias = video.thumbnail_url ? [video.thumbnail_url] : [];
  return [...propias, ...candidatasMiniaturaYouTube(video.youtube_video_id)];
}

export function TarjetaVideo({
  video,
  indice = 0,
  destacada = false,
}: {
  video: FilaVideo;
  indice?: number;
  destacada?: boolean;
}) {
  const descripcion = recortar(video.description, 150);

  return (
    <article
      className="animar-entrada group relative"
      style={{ "--indice": indice } as React.CSSProperties}
    >
      <Link href={`/watch/${video.slug}`} className="block focus:outline-none">
        <div
          className={`relative overflow-hidden bg-noche-850 ${
            destacada ? "aspect-[16/10]" : "aspect-video"
          }`}
        >
          <Miniatura
            fuentes={fuentesMiniatura(video)}
            alt={`Miniatura de ${video.title}`}
            className="transition-transform duration-700 ease-out group-hover:scale-[1.04]"
          />
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 bg-gradient-to-t from-noche-950/70 via-transparent to-transparent opacity-80"
          />
          <span
            aria-hidden="true"
            className="absolute bottom-3 left-3 inline-flex h-9 w-9 items-center justify-center rounded-full bg-acento/90 text-noche-950 opacity-0 transition-opacity duration-300 group-hover:opacity-100 group-focus-visible:opacity-100"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4 translate-x-[1px]" fill="currentColor">
              <path d="M8 5.5v13l11-6.5-11-6.5Z" />
            </svg>
          </span>
        </div>

        <div className="mt-4 flex flex-col gap-2">
          <div className="flex items-center gap-3 text-[11px] uppercase tracking-[0.18em] text-hueso-oscuro">
            {video.category ? (
              <span className="text-acento/90">{video.category}</span>
            ) : null}
            <time dateTime={video.published_at ?? undefined}>
              {formatearFechaCorta(video.published_at ?? video.created_at)}
            </time>
          </div>

          <h3
            className={`titulo-editorial text-hueso transition-colors group-hover:text-acento-tenue ${
              destacada ? "text-2xl md:text-3xl" : "text-xl"
            }`}
          >
            {video.title}
          </h3>

          {descripcion ? (
            <p className="line-clamp-2 text-sm leading-relaxed text-hueso-tenue">{descripcion}</p>
          ) : null}
        </div>
      </Link>
    </article>
  );
}
