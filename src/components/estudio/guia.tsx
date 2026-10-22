import { URL_YOUTUBE_STUDIO } from "@/lib/config";

/**
 * Guía del flujo de trabajo: cómo se pasa del archivo de video a la web.
 * Se explica dentro del panel, que es donde tiene sentido.
 */
export function GuiaYouTube() {
  const pasos = [
    {
      titulo: "Abre YouTube Studio",
      texto:
        "Sube el archivo desde el estudio de YouTube. Desde aquí puedes abrirlo en otra pestaña.",
    },
    {
      titulo: "Configura la visibilidad",
      texto:
        "En «Visibilidad», elige «No listado». Es el único ajuste que necesitas: no es privado, pero tampoco aparece en búsquedas.",
    },
    {
      titulo: "Copia el enlace",
      texto:
        "Copia el enlace del video (botón «Compartir» o la barra del navegador) y vuelve a NOCTURNA.",
    },
    {
      titulo: "Registra la pieza",
      texto:
        "Pega el enlace en el formulario del estudio: se valida el dominio y el identificador, y verás una vista previa del reproductor.",
    },
    {
      titulo: "Completa la ficha",
      texto: "Escribe el título, la descripción, elige categoría y añade etiquetas. Puedes guardar como borrador.",
    },
    {
      titulo: "Publica",
      texto:
        "Cambia el estado a «Publicado». A partir de ese momento la pieza aparece en el catálogo público y se puede buscar.",
    },
  ];

  return (
    <section className="panel p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="kicker text-hueso-oscuro">Cómo se publica una pieza</h2>
        <a
          href={URL_YOUTUBE_STUDIO}
          target="_blank"
          rel="noopener noreferrer"
          className="boton boton-linea !px-4 !py-2 text-xs"
        >
          Abrir YouTube Studio ↗
        </a>
      </div>

      <ol className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {pasos.map((paso, indice) => (
          <li key={paso.titulo} className="flex gap-3">
            <span
              aria-hidden="true"
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-acento/40 text-xs text-acento"
            >
              {indice + 1}
            </span>
            <span>
              <span className="block text-sm text-hueso">{paso.titulo}</span>
              <span className="mt-1 block text-xs leading-relaxed text-hueso-tenue">{paso.texto}</span>
            </span>
          </li>
        ))}
      </ol>

      <p className="mt-6 border-t linea pt-4 text-xs leading-relaxed text-hueso-oscuro">
        Esta versión no sube archivos a YouTube de forma automática: la subida se hace a mano desde
        YouTube Studio, tal y como permiten las condiciones de uso del servicio. NOCTURNA sólo
        guarda el identificador y los metadatos.
      </p>
    </section>
  );
}
