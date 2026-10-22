"use client";

import { useEffect } from "react";

export default function ErrorEstudio({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto max-w-2xl">
      <p className="kicker text-[#f87171]">Error</p>
      <h1 className="titulo-editorial mt-4 text-3xl text-hueso">El estudio no ha podido responder</h1>
      <p className="mt-4 text-sm leading-relaxed text-hueso-tenue">
        Comprueba la conexión con Supabase y que la sesión siga vigente. Si el problema continúa,
        vuelve a iniciar sesión.
      </p>
      <button type="button" onClick={() => reset()} className="boton boton-acento mt-8">
        Reintentar
      </button>
    </div>
  );
}
