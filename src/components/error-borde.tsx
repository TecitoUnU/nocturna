"use client";

import { useEffect } from "react";

/**
 * Interfaz de error compartida por las fronteras `error.tsx` del sitio público.
 */
export function ErrorBorde({
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
    <div className="mx-auto max-w-3xl px-5 py-24 md:px-8">
      <p className="kicker text-[#f87171]">Error</p>
      <h1 className="titulo-editorial mt-4 text-4xl text-hueso">No se pudo cargar esta página</h1>
      <p className="mt-5 text-sm leading-relaxed text-hueso-tenue">
        El catálogo no ha podido responder. Vuelve a intentarlo; si el problema continúa, comprueba
        la conexión con Supabase y que las migraciones estén aplicadas.
      </p>
      <button type="button" onClick={() => reset()} className="boton boton-acento mt-8">
        Reintentar
      </button>
    </div>
  );
}
