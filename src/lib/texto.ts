/** Utilidades de texto: slugs, normalización de búsquedas y formato de fechas. */

/** Convierte un título en un slug seguro para URLs. */
export function generarSlug(texto: string, maximo = 80): string {
  const base = (texto ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, maximo)
    .replace(/-+$/g, "");

  return base || "video";
}

/** Normaliza una consulta de búsqueda: minúsculas, espacios colapsados, sin acentos. */
export function normalizarBusqueda(texto: string | null | undefined): string {
  if (!texto) return "";
  return texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

/** Escapa los comodines de LIKE/ILIKE para que el usuario no pueda alterarlos. */
export function escaparPatronLike(termino: string): string {
  return termino.replace(/[\\%_]/g, (caracter) => `\\${caracter}`);
}

const MESES = [
  "enero",
  "febrero",
  "marzo",
  "abril",
  "mayo",
  "junio",
  "julio",
  "agosto",
  "septiembre",
  "octubre",
  "noviembre",
  "diciembre",
];

/** Formatea una fecha ISO en español: "12 de marzo de 2024". */
export function formatearFecha(iso: string | null | undefined): string {
  if (!iso) return "Sin fecha";
  const fecha = new Date(iso);
  if (Number.isNaN(fecha.getTime())) return "Sin fecha";
  return `${fecha.getUTCDate()} de ${MESES[fecha.getUTCMonth()]} de ${fecha.getUTCFullYear()}`;
}

/** Formatea una fecha ISO en formato corto: "12 mar 2024". */
export function formatearFechaCorta(iso: string | null | undefined): string {
  if (!iso) return "—";
  const fecha = new Date(iso);
  if (Number.isNaN(fecha.getTime())) return "—";
  const mes = (MESES[fecha.getUTCMonth()] ?? "").slice(0, 3);
  return `${fecha.getUTCDate()} ${mes} ${fecha.getUTCFullYear()}`;
}

/** Recorta un texto largo añadiendo puntos suspensivos. */
export function recortar(texto: string | null | undefined, maximo = 160): string {
  const limpio = (texto ?? "").trim();
  if (limpio.length <= maximo) return limpio;
  return `${limpio.slice(0, maximo - 1).trimEnd()}…`;
}

/** Normaliza etiquetas: array de cadenas cortas, sin duplicados y en minúsculas. */
export function normalizarEtiquetas(entrada: string | string[] | null | undefined): string[] {
  const crudas = Array.isArray(entrada) ? entrada : (entrada ?? "").split(",");
  const vistas: string[] = [];
  for (const cruda of crudas) {
    const limpia = cruda
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/\s+/g, " ")
      .replace(/[^\p{L}\p{N}\s-]/gu, "")
      .trim();
    if (!limpia) continue;
    if (vistas.includes(limpia)) continue;
    vistas.push(limpia.slice(0, 32));
    if (vistas.length >= 10) break;
  }
  return vistas;
}
