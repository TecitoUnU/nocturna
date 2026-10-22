"use client";

import { useState, useTransition } from "react";
import type { FilaVideo } from "@/types/database";
import { esPiezaGrande, spanEditorial } from "@/lib/rejilla";
import { TarjetaVideo } from "./tarjeta-video";

/**
 * Carga progresiva del catálogo.
 *
 * La primera página llega renderizada desde el servidor; el botón «Cargar
 * más» pide las siguientes páginas a /api/catalogo y las añade al listado sin
 * recargar la página.
 */
export function CargarMas({
  busqueda,
  categoria,
  etiqueta,
  paginaInicial,
  mostradosIniciales,
  total,
  indiceBase,
}: {
  busqueda: string;
  categoria: string;
  etiqueta: string;
  paginaInicial: number;
  mostradosIniciales: number;
  total: number;
  indiceBase: number;
}) {
  const [pagina, setPagina] = useState(paginaInicial);
  const [videos, setVideos] = useState<FilaVideo[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [pendiente, iniciarTransicion] = useTransition();

  const mostrados = mostradosIniciales + videos.length;
  const hayMas = mostrados < total;

  async function cargarPagina() {
    setError(null);
    const parametros = new URLSearchParams();
    if (busqueda) parametros.set("q", busqueda);
    if (categoria) parametros.set("categoria", categoria);
    if (etiqueta) parametros.set("etiqueta", etiqueta);
    parametros.set("pagina", String(pagina + 1));

    try {
      const respuesta = await fetch(`/api/catalogo?${parametros.toString()}`, {
        headers: { accept: "application/json" },
      });
      if (!respuesta.ok) {
        throw new Error(`Respuesta ${respuesta.status}`);
      }
      const datos = (await respuesta.json()) as { videos?: FilaVideo[]; error?: string | null };
      if (datos.error) throw new Error(datos.error);
      setVideos((anteriores) => [...anteriores, ...(datos.videos ?? [])]);
      setPagina((actual) => actual + 1);
    } catch (fallo) {
      setError(
        `No se pudo cargar la siguiente página: ${fallo instanceof Error ? fallo.message : "error desconocido"}.`,
      );
    }
  }

  return (
    <>
      {videos.map((video, posicion) => {
        const indice = indiceBase + posicion;
        return (
          <li key={video.id} className={spanEditorial(indice)}>
            <TarjetaVideo video={video} indice={indice} destacada={esPiezaGrande(indice)} />
          </li>
        );
      })}

      {hayMas ? (
        <li className="col-span-full mt-4 flex flex-col items-center gap-3">
          <button
            type="button"
            onClick={() => iniciarTransicion(() => void cargarPagina())}
            disabled={pendiente}
            className="boton boton-linea"
          >
            {pendiente ? "Cargando…" : "Cargar más"}
          </button>
          <p className="text-xs text-hueso-oscuro">
            Mostrando {Math.min(mostrados, total)} de {total} piezas
          </p>
        </li>
      ) : null}

      {error ? (
        <li className="col-span-full">
          <p role="alert" className="text-sm text-[#f87171]">
            {error}
          </p>
        </li>
      ) : null}
    </>
  );
}
