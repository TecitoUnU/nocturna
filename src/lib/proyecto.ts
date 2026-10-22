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

  /** Datos de la asignatura. */
  institucion: "Universidad Mariano Galvez de Guatemala · Sede Jalapa",
  asignatura: "Precálculo",
  docente: "Jose Fernando Marroquin Rosa",

  /** Propósito de la página: qué resuelve y para qué. */
  proposito:
    "Esta página es la memoria audiovisual del curso: reúne en un mismo lugar las explicaciones, los ejercicios resueltos y las grabaciones de clase de Precálculo. Cada pieza tiene su ficha, su tema y su fecha, así que el material se puede consultar y citar cuando haga falta, sin depender de archivos sueltos ni de enlaces que se pierden.",

  /** Presentación breve del curso de Precálculo. */
  presentacionCurso:
    "Precálculo es la etapa que prepara el cálculo. Reúne álgebra, funciones, trigonometría, números complejos y geometría analítica, y trabaja sobre las herramientas que después sostienen las derivadas y las integrales: factorizar, resolver, simplificar, representar y relacionar. En este proyecto el curso se cuenta también en vídeo, con el material grabado y ordenado por temas.",

  /** Mensaje de bienvenida para quien llega por primera vez. */
  bienvenida:
    "Bienvenida, bienvenido. Si buscas un tema concreto, empieza por el buscador; si prefieres recorrer el material poco a poco, elige un tema en el menú de abajo y sigue desde ahí. Todos los videos están alojados en YouTube y el catálogo, los textos y las fichas son de este proyecto.",

  /**
   * Integrantes del grupo. Deja el nombre completo de cada persona; los
   * roles son opcionales. Las entradas sin nombre no se muestran en la web.
   */
  integrantes: [
    { nombre: "", rol: "Coordinación y edición" },
    { nombre: "", rol: "Grabación y guion" },
    { nombre: "", rol: "Material audiovisual" },
    { nombre: "", rol: "Web y documentación" },
  ] satisfies Integrante[],

  /** Menú de temas: la navegación principal hacia los contenidos. */
  temas: [
    {
      titulo: "Exponentes y radicales",
      descripcion:
        "Potencias, raíces y las reglas que permiten manipularlos sin perder de vista las restricciones del dominio.",
      categoria: "Exponentes y radicales",
    },
    {
      titulo: "Expresiones racionales",
      descripcion:
        "Fracciones algebraicas: simplificación, dominio y los valores que quedan fuera de la expresión.",
      categoria: "Expresiones racionales",
    },
    {
      titulo: "Ecuaciones",
      descripcion:
        "Ecuaciones de primer y segundo grado, y todo lo que se puede despejar sin perder soluciones.",
      categoria: "Ecuaciones",
    },
    {
      titulo: "Modelado con ecuaciones",
      descripcion:
        "Pasar de un problema con enunciado a una ecuación, y comprobar que la solución significa algo.",
      categoria: "Modelado con ecuaciones",
    },
    {
      titulo: "Geometría de coordenadas",
      descripcion:
        "El plano cartesiano como territorio: distancia, punto medio y circunferencias.",
      categoria: "Geometría de coordenadas",
    },
    {
      titulo: "Rectas",
      descripcion:
        "Ecuaciones de la recta, pendientes y ángulos entre rectas: la geometría con coordenadas.",
      categoria: "Rectas",
    },
    {
      titulo: "Funciones",
      descripcion:
        "Dominio, rango, inyectividad, composición y transformaciones: la idea central del curso.",
      categoria: "Funciones",
    },
    {
      titulo: "Análisis de funciones",
      descripcion:
        "Variaciones, límites y comportamiento asintótico: cómo se lee una función de largo.",
      categoria: "Análisis de funciones",
    },
    {
      titulo: "Funciones cuadráticas",
      descripcion:
        "Parábolas, vértice, eje de simetría y el papel del discriminante.",
      categoria: "Funciones cuadráticas",
    },
    {
      titulo: "Funciones polinomiales y ceros reales",
      descripcion:
        "Gráficas de polinomios, teorema del factor y búsqueda de ceros reales.",
      categoria: "Funciones polinomiales y ceros reales",
    },
  ] satisfies Tema[],
} as const;
