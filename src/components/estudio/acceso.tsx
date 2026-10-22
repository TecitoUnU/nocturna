"use client";

import { useActionState } from "react";
import { iniciarSesion } from "@/lib/acciones/sesion";
import { ESTADO_INICIAL } from "@/lib/acciones/tipos";

/** Formulario de acceso al estudio. El registro público está desactivado. */
export function Acceso() {
  const [estado, accion, pendiente] = useActionState(iniciarSesion, ESTADO_INICIAL);

  return (
    <div className="mx-auto max-w-md">
      <p className="kicker text-acento">Acceso restringido</p>
      <h1 className="titulo-editorial mt-4 text-4xl text-hueso">Estudio</h1>
      <p className="mt-4 text-sm leading-relaxed text-hueso-tenue">
        Esta zona está reservada al administrador del catálogo. El registro público está
        desactivado en Supabase: sólo la cuenta creada durante la instalación puede entrar.
      </p>

      <form action={accion} className="panel mt-8 flex flex-col gap-5 p-6">
        <div>
          <label className="etiqueta-campo" htmlFor="correo">
            Correo electrónico
          </label>
          <input
            id="correo"
            name="correo"
            type="email"
            autoComplete="username"
            required
            className="campo"
            placeholder="administrador@ejemplo.com"
          />
        </div>

        <div>
          <label className="etiqueta-campo" htmlFor="clave">
            Contraseña
          </label>
          <input
            id="clave"
            name="clave"
            type="password"
            autoComplete="current-password"
            required
            className="campo"
            placeholder="••••••••••"
          />
        </div>

        {estado.mensaje ? (
          <p role="alert" className="text-sm text-[#f87171]">
            {estado.mensaje}
          </p>
        ) : null}

        <button type="submit" disabled={pendiente} className="boton boton-acento w-full">
          {pendiente ? "Comprobando…" : "Entrar"}
        </button>
      </form>
    </div>
  );
}
