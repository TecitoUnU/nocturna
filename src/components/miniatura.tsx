"use client";

import { useState } from "react";

/**
 * Miniatura con degradación de alternativas.
 *
 * Recibe una lista de URLs candidatas (miniatura propia y, si procede, las de
 * YouTube). Si ninguna carga, se dibuja un estado alternativo con el diseño de
 * la plataforma. Las imágenes se cargan de forma diferida salvo la principal.
 */
export function Miniatura({
  fuentes,
  alt,
  className = "",
  prioridad = false,
}: {
  fuentes: string[];
  alt: string;
  className?: string;
  prioridad?: boolean;
}) {
  const [indice, setIndice] = useState(0);
  const [fallo, setFallo] = useState(false);

  const fuente = fuentes[indice];

  if (!fuente || fallo) {
    return (
      <div
        role="img"
        aria-label={alt}
        className={`flex h-full w-full items-center justify-center bg-[radial-gradient(120%_120%_at_20%_10%,rgba(168,85,247,0.28),transparent_60%),linear-gradient(140deg,#14141f,#08080e)] ${className}`}
      >
        <span className="titulo-editorial text-4xl text-hueso/25" aria-hidden="true">
          {alt.trim().charAt(0).toUpperCase() || "·"}
        </span>
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={fuente}
      alt={alt}
      width={1280}
      height={720}
      loading={prioridad ? "eager" : "lazy"}
      decoding={prioridad ? "sync" : "async"}
      fetchPriority={prioridad ? "high" : "auto"}
      onError={() => {
        if (indice < fuentes.length - 1) {
          setIndice(indice + 1);
        } else {
          setFallo(true);
        }
      }}
      className={`h-full w-full object-cover ${className}`}
    />
  );
}
