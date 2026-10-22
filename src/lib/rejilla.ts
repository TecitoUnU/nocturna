/**
 * Ritmo editorial de la rejilla.
 *
 * En lugar de una cuadrícula de tarjetas idénticas, el catálogo alterna
 * anchos: piezas grandes a dos columnas, piezas de apoyo más estrechas.
 */
export function spanEditorial(indice: number): string {
  const patron = indice % 6;
  switch (patron) {
    case 0:
      return "md:col-span-3 lg:col-span-4";
    case 1:
      return "md:col-span-3 lg:col-span-2";
    case 2:
      return "md:col-span-3 lg:col-span-2";
    case 3:
      return "md:col-span-3 lg:col-span-3";
    case 4:
      return "md:col-span-3 lg:col-span-3";
    default:
      return "md:col-span-3 lg:col-span-4";
  }
}

/** ¿La pieza merece un tratamiento visual mayor dentro de la rejilla? */
export function esPiezaGrande(indice: number): boolean {
  return indice % 6 === 0;
}
