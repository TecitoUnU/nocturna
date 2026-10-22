"use client";

import { useState } from "react";
import { construirUrlEmbed, esIdYouTubeValido } from "@/lib/youtube";
import { urlWatchYouTube } from "@/lib/config";
import { Miniatura } from "./miniatura";

/**
 * Reproductor integrado de YouTube.
 *
 * - No se crea ningún iframe hasta que el visitante decide reproducir: así la
 *   página no carga reproductores innecesarios y se respetan las cookies de
 *   YouTube hasta entonces.
 * - El iframe se construye siempre a partir de un identificador validado; no
 *   se inserta HTML ni JavaScript proporcionado por terceros.
 * - Si el contenido no se puede insertar (el propietario puede restringirlo),
 *   se ofrece el enlace directo a YouTube.
 */
export function Reproductor({
  idVideo,
  titulo,
  fuentesMiniatura = [],
}: {
  idVideo: string;
  titulo: string;
  fuentesMiniatura?: string[];
}) {
  const [activo, setActivo] = useState(false);
  const [fallo, setFallo] = useState(false);

  const valido = esIdYouTubeValido(idVideo);
  const urlEmbed = valido ? construirUrlEmbed(idVideo) : null;

  if (!valido || !urlEmbed) {
    return (
      <div className="flex aspect-video w-full flex-col items-center justify-center gap-3 bg-noche-850 px-6 text-center">
        <p className="text-sm text-hueso-tenue">
          Este registro no tiene un identificador de YouTube válido, así que no se puede reproducir.
        </p>
      </div>
    );
  }

  return (
    <div className="relative aspect-video w-full overflow-hidden bg-noche-950">
      {activo && !fallo ? (
        <iframe
          src={urlEmbed}
          title={titulo}
          className="absolute inset-0 h-full w-full border-0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          referrerPolicy="strict-origin-when-cross-origin"
          onError={() => setFallo(true)}
        />
      ) : (
        <div className="absolute inset-0">
          {fallo ? (
            <div className="flex h-full w-full flex-col items-center justify-center gap-4 bg-noche-850 px-6 text-center">
              <p className="max-w-md text-sm leading-relaxed text-hueso-tenue">
                No se ha podido insertar el reproductor. Puede que el video no permita la inserción
                o que YouTube haya rechazado la solicitud.
              </p>
              <a
                href={urlWatchYouTube(idVideo)}
                target="_blank"
                rel="noopener noreferrer"
                className="boton boton-acento"
              >
                Abrir en YouTube
              </a>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setActivo(true)}
              className="group relative flex h-full w-full items-center justify-center"
              aria-label={`Reproducir ${titulo}`}
            >
              {fuentesMiniatura.length > 0 ? (
                <span className="absolute inset-0 block">
                  <Miniatura
                    fuentes={fuentesMiniatura}
                    alt={`Miniatura de ${titulo}`}
                    prioridad
                    className="opacity-70 transition-opacity duration-500 group-hover:opacity-90"
                  />
                </span>
              ) : (
                <span
                  aria-hidden="true"
                  className="absolute inset-0 bg-[radial-gradient(120%_120%_at_20%_10%,rgba(168,85,247,0.25),transparent_60%),linear-gradient(140deg,#14141f,#08080e)]"
                />
              )}

              <span
                aria-hidden="true"
                className="relative inline-flex h-16 w-16 items-center justify-center rounded-full bg-acento text-noche-950 transition-transform duration-300 group-hover:scale-105"
              >
                <svg viewBox="0 0 24 24" className="h-6 w-6 translate-x-[2px]" fill="currentColor">
                  <path d="M8 5.5v13l11-6.5-11-6.5Z" />
                </svg>
              </span>

              <span className="sr-only">Reproducir el video con el reproductor oficial de YouTube</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
