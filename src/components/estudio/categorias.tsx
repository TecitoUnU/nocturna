"use client";

import { useActionState } from "react";
import { crearCategoria, eliminarCategoria } from "@/lib/acciones/categorias";
import { ESTADO_INICIAL } from "@/lib/acciones/tipos";
import type { FilaCategoria } from "@/types/database";

export function GestionCategorias({ categorias }: { categorias: FilaCategoria[] }) {
  const [estado, accion, pendiente] = useActionState(crearCategoria, ESTADO_INICIAL);

  return (
    <section className="panel p-6">
      <h2 className="kicker text-hueso-oscuro">Categorías</h2>

      <form action={accion} className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="flex-1">
          <label className="etiqueta-campo" htmlFor="nombre-categoria">
            Nueva categoría
          </label>
          <input
            id="nombre-categoria"
            name="nombre"
            defaultValue=""
            className={`campo ${estado.errores?.nombre ? "campo-error" : ""}`}
            placeholder="Ensayo, Reportaje, Recital…"
            required
          />
          {estado.errores?.nombre ? (
            <p className="mt-2 text-xs text-[#f87171]">{estado.errores.nombre}</p>
          ) : null}
        </div>
        <button type="submit" disabled={pendiente} className="boton boton-linea">
          {pendiente ? "Guardando…" : "Crear"}
        </button>
      </form>

      {estado.mensaje && !estado.ok ? (
        <p role="alert" className="mt-3 text-xs text-[#f87171]">
          {estado.mensaje}
        </p>
      ) : null}

      <ul className="mt-6 flex flex-wrap gap-2">
        {categorias.map((categoria) => (
          <li
            key={categoria.id}
            className="flex items-center gap-2 rounded-full border linea px-3 py-1 text-xs text-hueso-tenue"
          >
            {categoria.name}
            <form action={eliminarCategoria}>
              <input type="hidden" name="id" value={categoria.id} />
              <button
                type="submit"
                aria-label={`Eliminar la categoría ${categoria.name}`}
                className="text-hueso-oscuro transition-colors hover:text-[#f87171]"
              >
                ×
              </button>
            </form>
          </li>
        ))}
        {categorias.length === 0 ? (
          <li className="text-xs text-hueso-oscuro">Todavía no hay categorías.</li>
        ) : null}
      </ul>
    </section>
  );
}
