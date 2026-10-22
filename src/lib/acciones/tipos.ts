/** Tipos compartidos por los formularios del panel de administración. */

export interface EstadoFormulario {
  ok: boolean;
  mensaje: string;
  errores?: Record<string, string | undefined>;
  /** Identificador del registro afectado (por ejemplo, el video creado). */
  id?: string;
}

export const ESTADO_INICIAL: EstadoFormulario = {
  ok: false,
  mensaje: "",
};

export function estadoError(mensaje: string, errores?: Record<string, string>): EstadoFormulario {
  return { ok: false, mensaje, errores };
}
