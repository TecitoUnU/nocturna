"use client";

import Link from "next/link";
import { cambiarEstadoVideo, eliminarVideo } from "@/lib/acciones/videos";
import { formatearFechaCorta } from "@/lib/texto";
import type { FilaVideo } from "@/types/database";

/**
 * Botón de borrado con confirmación. El formulario sigue estando en el HTML
 * (funciona también sin JavaScript) y el diálogo nativo pide confirmación
 * antes de enviarlo.
 */
function BotonEliminar({ id, titulo }: { id: string; titulo: string }) {
  return (
    <form
      action={eliminarVideo}
      onSubmit={(evento) => {
        const confirmado = window.confirm(
          `¿Eliminar "${titulo}" del catálogo? Esta acción no se puede deshacer.`,
        );
        if (!confirmado) evento.preventDefault();
      }}
    >
      <input type="hidden" name="id" value={id} />
      <button
        type="submit"
        className="text-xs text-hueso-oscuro transition-colors hover:text-[#f87171]"
        aria-label={`Eliminar ${titulo} del catálogo`}
      >
        Eliminar
      </button>
    </form>
  );
}

export function ListaVideos({ videos }: { videos: FilaVideo[] }) {
  if (videos.length === 0) {
    return (
      <p className="panel px-6 py-10 text-center text-sm text-hueso-tenue">
        Todavía no hay videos registrados. Usa el formulario para publicar la primera pieza.
      </p>
    );
  }

  return (
    <ul className="flex flex-col divide-y divide-[color-mix(in_srgb,var(--color-hueso)_10%,transparent)]">
      {videos.map((video) => (
        <li key={video.id} className="flex flex-col gap-4 py-5 md:flex-row md:items-center">
          <div className="flex flex-1 items-center gap-4">
            <div className="h-16 w-28 shrink-0 overflow-hidden bg-noche-800">
              {video.thumbnail_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={video.thumbnail_url}
                  alt=""
                  className="h-full w-full object-cover"
                  loading="lazy"
                  decoding="async"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-[10px] uppercase tracking-[0.18em] text-hueso-oscuro">
                  Sin imagen
                </div>
              )}
            </div>

            <div className="min-w-0">
              <p className="truncate text-sm text-hueso">{video.title}</p>
              <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] uppercase tracking-[0.16em] text-hueso-oscuro">
                <span
                  className={
                    video.status === "published" ? "text-acento-tenue" : "text-hueso-oscuro"
                  }
                >
                  {video.status === "published" ? "Publicado" : "Borrador"}
                </span>
                {video.is_featured ? <span className="text-acento">En portada</span> : null}
                <span>/watch/{video.slug}</span>
                <span>{formatearFechaCorta(video.updated_at)}</span>
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4 md:justify-end">
            <Link
              href={`/studio/${video.id}`}
              className="text-xs text-hueso-tenue transition-colors hover:text-hueso"
            >
              Editar
            </Link>

            <form action={cambiarEstadoVideo}>
              <input type="hidden" name="id" value={video.id} />
              <input
                type="hidden"
                name="accion"
                value={video.status === "published" ? "despublicar" : "publicar"}
              />
              <button
                type="submit"
                className="text-xs text-hueso-tenue transition-colors hover:text-hueso"
              >
                {video.status === "published" ? "Despublicar" : "Publicar"}
              </button>
            </form>

            <BotonEliminar id={video.id} titulo={video.title} />
          </div>
        </li>
      ))}
    </ul>
  );
}
