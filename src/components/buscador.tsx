"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

/**
 * Buscador del catálogo.
 *
 * Escribe con un retraso breve (300 ms) y actualiza la URL, de modo que la
 * búsqueda se resuelve en el servidor contra Supabase y siempre es
 * compartible (URL) y accesible (enlace directo a cada resultado).
 */
const RETARDO_MS = 300;

export function Buscador() {
  const router = useRouter();
  const pathname = usePathname();
  const parametros = useSearchParams();
  const valorUrl = parametros.get("q") ?? "";

  const [valor, setValor] = useState(valorUrl);
  const [valorUrlPrevio, setValorUrlPrevio] = useState(valorUrl);

  // Si la URL cambia desde fuera (por ejemplo, al quitar los filtros), el
  // campo se sincroniza. Es el patrón recomendado por React para ajustar
  // estado cuando cambia una entrada externa.
  if (valorUrl !== valorUrlPrevio) {
    setValorUrlPrevio(valorUrl);
    setValor(valorUrl);
  }

  const temporizador = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    temporizador.current = setTimeout(() => {
      const nuevos = new URLSearchParams(window.location.search);
      const limpio = valor.trim();

      if (limpio) {
        nuevos.set("q", limpio);
      } else {
        nuevos.delete("q");
      }

      const destino = nuevos.toString();
      const actual = window.location.search.replace(/^\?/, "");
      if (destino !== actual) {
        router.replace(destino ? `?${destino}` : pathname, { scroll: false });
      }
    }, RETARDO_MS);

    return () => {
      if (temporizador.current) clearTimeout(temporizador.current);
    };
  }, [valor, pathname, router]);

  function enviarAhora() {
    if (temporizador.current) clearTimeout(temporizador.current);
    const nuevos = new URLSearchParams(window.location.search);
    const limpio = valor.trim();

    if (limpio) {
      nuevos.set("q", limpio);
    } else {
      nuevos.delete("q");
    }

    const destino = nuevos.toString();
    router.replace(destino ? `?${destino}` : pathname, { scroll: false });
  }

  return (
    <form
      role="search"
      onSubmit={(evento) => {
        evento.preventDefault();
        enviarAhora();
      }}
      className="relative w-full"
    >
      <label htmlFor="busqueda-catalogo" className="sr-only">
        Buscar videos por título
      </label>
      <span
        aria-hidden="true"
        className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-hueso-oscuro"
      >
        <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" stroke="currentColor" strokeWidth="1.6">
          <circle cx="11" cy="11" r="6.5" />
          <path d="m16 16 4 4" strokeLinecap="round" />
        </svg>
      </span>
      <input
        id="busqueda-catalogo"
        name="q"
        type="search"
        value={valor}
        onChange={(evento) => setValor(evento.target.value)}
        placeholder="Buscar por título…"
        autoComplete="off"
        className="campo pl-10 pr-9"
      />
      {valor ? (
        <button
          type="button"
          onClick={() => setValor("")}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-full p-1 text-hueso-oscuro transition-colors hover:text-hueso"
          aria-label="Limpiar la búsqueda"
        >
          <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" stroke="currentColor" strokeWidth="1.8">
            <path d="m6 6 12 12M18 6 6 18" strokeLinecap="round" />
          </svg>
        </button>
      ) : null}
    </form>
  );
}
