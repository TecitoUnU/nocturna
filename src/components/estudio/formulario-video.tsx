"use client";

import { useActionState, useMemo, useState } from "react";
import { guardarVideo } from "@/lib/acciones/videos";
import { ESTADO_INICIAL } from "@/lib/acciones/tipos";
import { analizarEntradaYouTube, construirUrlEmbed } from "@/lib/youtube";
import { validarUrlMiniatura } from "@/lib/validacion";
import type { FilaCategoria, FilaVideo } from "@/types/database";

/**
 * Formulario de alta/edición de una pieza del catálogo.
 *
 * Mientras se escribe, se valida el enlace de YouTube en el navegador para
 * mostrar la vista previa del reproductor. La validación definitiva siempre
 * se repite en el servidor antes de guardar nada.
 */
export function FormularioVideo({
  video,
  categorias,
}: {
  video?: FilaVideo | null;
  categorias: FilaCategoria[];
}) {
  const [estado, accion, pendiente] = useActionState(guardarVideo, ESTADO_INICIAL);

  const [youtube, setYoutube] = useState(video?.youtube_video_id ?? "");
  const [miniaturaUrl, setMiniaturaUrl] = useState(video?.thumbnail_url ?? "");
  const [previaArchivo, setPreviaArchivo] = useState<string | null>(null);
  const [nombreArchivo, setNombreArchivo] = useState("");

  const analisis = useMemo(() => analizarEntradaYouTube(youtube), [youtube]);
  const urlPreview = analisis.ok ? construirUrlEmbed(analisis.id) : null;

  const urlValidada = useMemo(() => {
    if (!miniaturaUrl.trim()) return null;
    const resultado = validarUrlMiniatura(miniaturaUrl);
    return resultado.ok ? resultado.valor : null;
  }, [miniaturaUrl]);

  const vistaPrevia = previaArchivo ?? urlValidada ?? null;
  const errorYoutube = estado.errores?.youtube;

  return (
    <form action={accion} className="grid gap-10 lg:grid-cols-12">
      {video ? <input type="hidden" name="id" value={video.id} /> : null}

      <div className="flex flex-col gap-8 lg:col-span-7">
        {/* --- Referencia de YouTube --- */}
        <section className="panel p-6">
          <h2 className="kicker text-hueso-oscuro">1 · Material en YouTube</h2>

          <div className="mt-5">
            <label className="etiqueta-campo" htmlFor="youtube">
              Enlace o identificador del video
            </label>
            <input
              id="youtube"
              name="youtube"
              value={youtube}
              onChange={(evento) => setYoutube(evento.target.value)}
              className={`campo font-mono text-sm ${errorYoutube ? "campo-error" : ""}`}
              placeholder="https://www.youtube.com/watch?v=XXXXXXXXXXX"
              aria-invalid={errorYoutube ? true : undefined}
              aria-describedby={errorYoutube ? "error-youtube" : "ayuda-youtube"}
              required
            />
            <p id="ayuda-youtube" className="mt-2 text-xs leading-relaxed text-hueso-oscuro">
              Admite <code className="font-mono">youtube.com/watch?v=…</code>,{" "}
              <code className="font-mono">youtu.be/…</code>,{" "}
              <code className="font-mono">/shorts/…</code> y el identificador de 11 caracteres. El
              dominio y el formato se comprueban en el servidor.
            </p>
            {errorYoutube ? (
              <p id="error-youtube" className="mt-2 text-xs text-[#f87171]">
                {errorYoutube}
              </p>
            ) : null}
            {analisis.ok ? (
              <p className="mt-2 text-xs text-acento-tenue">
                Identificador detectado:{" "}
                <span className="font-mono">{analisis.id}</span>
              </p>
            ) : null}
          </div>

          {/* Vista previa del reproductor */}
          <div className="mt-6">
            <p className="etiqueta-campo">Vista previa</p>
            {urlPreview ? (
              <div className="aspect-video w-full overflow-hidden bg-noche-950">
                <iframe
                  src={urlPreview}
                  title="Vista previa del video"
                  className="h-full w-full border-0"
                  allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                  referrerPolicy="strict-origin-when-cross-origin"
                />
              </div>
            ) : (
              <div className="flex aspect-video w-full items-center justify-center border border-dashed linea bg-noche-950 px-6 text-center text-xs text-hueso-oscuro">
                En cuanto el enlace sea válido se mostrará aquí la vista previa del reproductor
                oficial.
              </div>
            )}
          </div>
        </section>

        {/* --- Metadatos --- */}
        <section className="panel p-6">
          <h2 className="kicker text-hueso-oscuro">2 · Ficha</h2>

          <div className="mt-5 flex flex-col gap-5">
            <div>
              <label className="etiqueta-campo" htmlFor="titulo">
                Título
              </label>
              <input
                id="titulo"
                name="titulo"
                defaultValue={video?.title ?? ""}
                className={`campo titulo-editorial text-lg ${estado.errores?.titulo ? "campo-error" : ""}`}
                placeholder="Título de la pieza"
                required
              />
              {estado.errores?.titulo ? (
                <p className="mt-2 text-xs text-[#f87171]">{estado.errores.titulo}</p>
              ) : null}
            </div>

            <div>
              <label className="etiqueta-campo" htmlFor="descripcion">
                Descripción
              </label>
              <textarea
                id="descripcion"
                name="descripcion"
                rows={6}
                defaultValue={video?.description ?? ""}
                className={`campo resize-y ${estado.errores?.descripcion ? "campo-error" : ""}`}
                placeholder="Sobre qué trata la pieza, dónde se grabó, quién aparece…"
              />
              {estado.errores?.descripcion ? (
                <p className="mt-2 text-xs text-[#f87171]">{estado.errores.descripcion}</p>
              ) : null}
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label className="etiqueta-campo" htmlFor="categoria">
                  Categoría
                </label>
                <select
                  id="categoria"
                  name="categoria"
                  defaultValue={video?.category ?? ""}
                  className={`campo ${estado.errores?.categoria ? "campo-error" : ""}`}
                >
                  <option value="">— Sin categoría —</option>
                  {categorias.map((categoria) => (
                    <option key={categoria.id} value={categoria.name}>
                      {categoria.name}
                    </option>
                  ))}
                </select>
                {estado.errores?.categoria ? (
                  <p className="mt-2 text-xs text-[#f87171]">{estado.errores.categoria}</p>
                ) : null}
              </div>

              <div>
                <label className="etiqueta-campo" htmlFor="etiquetas">
                  Etiquetas
                </label>
                <input
                  id="etiquetas"
                  name="etiquetas"
                  defaultValue={video?.tags.join(", ") ?? ""}
                  className={`campo ${estado.errores?.etiquetas ? "campo-error" : ""}`}
                  placeholder="ensayo, ciudad, 2024"
                />
                <p className="mt-2 text-xs text-hueso-oscuro">
                  Separadas por comas. Máximo 10.
                </p>
                {estado.errores?.etiquetas ? (
                  <p className="mt-2 text-xs text-[#f87171]">{estado.errores.etiquetas}</p>
                ) : null}
              </div>
            </div>

            <div>
              <label className="etiqueta-campo" htmlFor="miniaturaArchivo">
                Miniatura personalizada (archivo)
              </label>
              <input
                id="miniaturaArchivo"
                name="miniaturaArchivo"
                type="file"
                accept="image/jpeg,image/png,image/webp,image/avif"
                onChange={(evento) => {
                  const archivo = evento.target.files?.[0];
                  if (archivo) {
                    setPreviaArchivo(URL.createObjectURL(archivo));
                    setNombreArchivo(archivo.name);
                  }
                }}
                className="campo file:mr-3 file:rounded-full file:border-0 file:bg-noche-700 file:px-3 file:py-1 file:text-xs file:text-hueso"
              />
              <p className="mt-2 text-xs text-hueso-oscuro">
                JPEG, PNG, WebP o AVIF de hasta 5 MB. Si no subes nada, se usará la miniatura de
                YouTube.
              </p>
              {nombreArchivo ? (
                <p className="mt-1 text-xs text-acento-tenue">Archivo seleccionado: {nombreArchivo}</p>
              ) : null}
            </div>

            <div>
              <label className="etiqueta-campo" htmlFor="miniaturaUrl">
                …o pega una URL de imagen
              </label>
              <input
                id="miniaturaUrl"
                name="miniaturaUrl"
                value={miniaturaUrl}
                onChange={(evento) => setMiniaturaUrl(evento.target.value)}
                className={`campo font-mono text-xs ${estado.errores?.miniatura ? "campo-error" : ""}`}
                placeholder="https://i.ytimg.com/vi/XXXXXXXXXXX/maxresdefault.jpg"
              />
              <p className="mt-2 text-xs text-hueso-oscuro">
                Sólo se admiten dominios de imagen de YouTube y del almacenamiento de este proyecto
                (ver <code className="font-mono">ALLOWED_THUMBNAIL_HOSTS</code>).
              </p>
              {estado.errores?.miniatura ? (
                <p className="mt-2 text-xs text-[#f87171]">{estado.errores.miniatura}</p>
              ) : null}
              {video?.thumbnail_url ? (
                <label className="mt-3 flex items-center gap-2 text-xs text-hueso-tenue">
                  <input
                    type="checkbox"
                    name="quitarMiniatura"
                    value="1"
                    className="h-4 w-4 accent-[#a855f7]"
                  />
                  Quitar la miniatura actual y usar la de YouTube
                </label>
              ) : null}
            </div>
          </div>
        </section>
      </div>

      {/* --- Columna lateral: estado y publicación --- */}
      <aside className="flex flex-col gap-8 lg:col-span-5">
        <section className="panel p-6">
          <h2 className="kicker text-hueso-oscuro">3 · Estado</h2>

          <div className="mt-5 flex flex-col gap-5">
            <div>
              <label className="etiqueta-campo" htmlFor="estado">
                Visibilidad
              </label>
              <select id="estado" name="estado" defaultValue={video?.status ?? "draft"} className="campo">
                <option value="draft">Borrador (no aparece en la web)</option>
                <option value="published">Publicado (visible en el catálogo)</option>
              </select>
            </div>

            <label className="flex items-start gap-3 text-sm text-hueso-tenue">
              <input
                type="checkbox"
                name="destacado"
                value="true"
                defaultChecked={video?.is_featured ?? false}
                className="mt-1 h-4 w-4 accent-[#a855f7]"
              />
              <span>
                Poner en portada
                <span className="block text-xs text-hueso-oscuro">
                  Sólo puede haber una pieza destacada a la vez.
                </span>
              </span>
            </label>
          </div>

          {estado.mensaje ? (
            <p
              role="alert"
              className={`mt-5 text-sm ${estado.ok ? "text-acento-tenue" : "text-[#f87171]"}`}
            >
              {estado.mensaje}
            </p>
          ) : null}

          <button type="submit" disabled={pendiente} className="boton boton-acento mt-6 w-full">
            {pendiente ? "Guardando…" : video ? "Guardar cambios" : "Guardar en el catálogo"}
          </button>
        </section>

        <section className="panel p-6">
          <h2 className="kicker text-hueso-oscuro">Vista previa de la miniatura</h2>
          <div className="mt-4 aspect-video w-full overflow-hidden bg-noche-950">
            {vistaPrevia ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={vistaPrevia}
                alt="Vista previa de la miniatura"
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center px-4 text-center text-xs text-hueso-oscuro">
                Sin miniatura: se usará la imagen de YouTube o el marcador de la plataforma.
              </div>
            )}
          </div>
        </section>
      </aside>
    </form>
  );
}
