/**
 * Datos del proyecto: qué es la página, quién la hace y de qué trata.
 *
 * Todo lo que aparece en la presentación de la portada se edita aquí.
 * Si quieres cambiar el nombre de la plataforma, usa la variable de entorno
 * NEXT_PUBLIC_SITE_NAME (o edita `nombre`).
 */
export interface Integrante {
  /** Nombre completo de la persona integrante del grupo. */
  nombre: string;
  /** Rol opcional dentro del equipo. */
  rol?: string;
}

export interface Tema {
  /** Nombre del tema del curso. */
  titulo: string;
  /** Una línea de descripción: de qué trata el tema. */
  descripcion: string;
  /**
   * Categoría del catálogo con la que se relaciona. Si existe en Supabase, el
   * enlace filtra el catálogo por esa categoría; si no, el enlace lleva a la
   * sección del catálogo.
   */
  categoria: string;
}

export const proyecto = {
  /** Nombre del proyecto (el de la página). */
  nombre: (process.env.NEXT_PUBLIC_SITE_NAME ?? "NOCTURNA").trim() || "NOCTURNA",

  /** Subtítulo corto bajo el nombre. */
  tipo: "Archivo audiovisual del curso de Precálculo",

  /** Datos de la asignatura: edita estos tres campos. */
  institucion: "Institución",
  asignatura: "Precálculo",
  docente: "Docente",

  /** Propósito de la página: qué resuelve y para qué. */
  proposito:
    "Esta página es la memoria audiovisual del curso: reúne en un mismo lugar las explicaciones, los ejercicios resueltos y las grabaciones de clase de Precálculo. Cada pieza tiene su ficha, su tema y su fecha, así que el material se puede consultar y citar cuando haga falta, sin depender de archivos sueltos ni de enlaces que se pierden.",

  /** Presentación breve del curso de Precálculo. */
  presentacionCurso:
    "Precálculo es la etapa que prepara el cálculo. Reúne álgebra, funciones, trigonometría, números complejos y geometría analítica, y trabaja sobre las herramientas que después sostienen las derivadas y las integrales: factorizar, resolver, simplificar, representar y relacionar. En este proyecto el curso se cuenta también en vídeo, con el material grabado y ordenado por temas.",

  /** Mensaje de bienvenida para quien llega por primera vez. */
  bienvenida:
    "Bienvenida, bienvenido. Si buscas un tema concreto, empieza por el buscador; si prefieres recorrer el material poco a poco, elige un tema en el menú de abajo y sigue desde ahí. Todos los videos están alojados en YouTube y el catálogo, los textos y las fichas son de este proyecto.",

  /** Integrantes del grupo: sustituye los marcadores por los nombres reales. */
  integrantes: [
    { nombre: "Integrante 1", rol: "Coordinación y edición" },
    { nombre: "Integrante 2", rol: "Grabación y guion" },
    { nombre: "Integrante 3", rol: "Material audiovisual" },
    { nombre: "Integrante 4", rol: "Web y documentación" },
  ] satisfies Integrante[],

  /** Menú de temas: la navegación principal hacia los contenidos. */
  temas: [
    {
      titulo: "Álgebra",
      descripcion:
        "Ecuaciones, inecuaciones y sistemas: la herramienta con la que se resuelve casi todo lo demás.",
      categoria: "Álgebra",
    },
    {
      titulo: "Funciones",
      descripcion:
        "Dominio, rango, inyectividad, composición y transformaciones: la idea central del curso.",
      categoria: "Funciones",
    },
    {
      titulo: "Exponenciales y logaritmos",
      descripcion: "Crecimiento, escalas y la operación que unifica todo el bloque.",
      categoria: "Exponenciales y logaritmos",
    },
    {
      titulo: "Trigonometría",
      descripcion: "Círculo unitario, razones, identidades y ecuaciones trigonométricas.",
      categoria: "Trigonometría",
    },
    {
      titulo: "Geometría analítica",
      descripcion: "Rectas, circunferencias, cónicas y vectores en el plano cartesiano.",
      categoria: "Geometría analítica",
    },
    {
      titulo: "Números complejos",
      descripcion: "Forma polar y forma exponencial, y cómo se leen en el plano.",
      categoria: "Números complejos",
    },
  ] satisfies Tema[],
} as const;
