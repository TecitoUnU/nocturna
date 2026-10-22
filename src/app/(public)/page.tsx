import Link from "next/link";
import { proyecto } from "@/lib/proyecto";
import {
  listarCatalogo,
  listarCategorias,
  listarResumenCatalogo,
  obtenerVideoDestacado,
} from "@/lib/catalogo";
import { normalizarBusqueda } from "@/lib/texto";
import { TAMANO_PAGINA } from "@/lib/constantes";
import { esPiezaGrande, spanEditorial } from "@/lib/rejilla";
import { supabaseConfigurado } from "@/lib/supabase/cliente";
import { Presentacion, Integrantes, MenuTemas } from "@/components/presentacion";
import { Destacado } from "@/components/destacado";
import { Filtros } from "@/components/filtros";
import { TarjetaVideo } from "@/components/tarjeta-video";
import { CargarMas } from "@/components/cargar-mas";
import { AvisoSinConfiguracion, EstadoError, EstadoVacio } from "@/components/estados";

function primerValor(valor: string | string[] | undefined): string {
  if (Array.isArray(valor)) return valor[0] ?? "";
  return valor ?? "";
}

export default async function PaginaPrincipal({ searchParams }: PageProps<"/">) {
  const parametros = await searchParams;

  const busqueda = normalizarBusqueda(primerValor(parametros.q));
  const categoria = primerValor(parametros.categoria).trim();
  const etiqueta = primerValor(parametros.etiqueta).trim();
  const pagina = Math.max(Number(primerValor(parametros.pagina)) || 1, 1);

  if (!supabaseConfigurado()) {
    return (
      <div className="mx-auto max-w-[86rem] px-5 py-20 md:px-8">
        <AvisoSinConfiguracion />
      </div>
    );
  }

  const [destacado, catalogo, categorias, resumen] = await Promise.all([
    obtenerVideoDestacado(),
    listarCatalogo({ busqueda, categoria, etiqueta, pagina }),
    listarCategorias(),
    listarResumenCatalogo(),
  ]);

  const hayFiltros = Boolean(busqueda || categoria || etiqueta);
  const conteos = new Map(resumen.categorias.map((item) => [item.nombre, item.total]));

  return (
    <>
      <Presentacion />

      <div className="mx-auto max-w-[86rem] px-5 md:px-8">
        <Integrantes />
        <MenuTemas conteos={conteos} />
      </div>

      {destacado && !hayFiltros ? (
        <div className="mt-16 md:mt-24">
          <Destacado video={destacado} />
        </div>
      ) : null}

      <section id="catalogo" className="mx-auto max-w-[86rem] px-5 pt-20 md:px-8 md:pt-28">
        <div className="flex flex-col gap-6 border-b linea pb-8 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="kicker text-hueso-oscuro">Catálogo</p>
            <h2 className="titulo-editorial mt-3 text-3xl text-hueso md:text-4xl">
              {busqueda ? (
                <>
                  Resultados para{" "}
                  <span className="text-acento-tenue italic">&laquo;{busqueda}&raquo;</span>
                </>
              ) : categoria || etiqueta ? (
                "Selección filtrada"
              ) : (
                "Todas las piezas"
              )}
            </h2>
          </div>

          <p className="text-sm text-hueso-tenue">
            {catalogo.error
              ? "No se pudo consultar el catálogo"
              : `${catalogo.total} ${catalogo.total === 1 ? "pieza publicada" : "piezas publicadas"}`}
          </p>
        </div>

        <div className="mt-8">
          <Filtros
            categorias={categorias}
            etiquetas={resumen.etiquetas.slice(0, 14)}
            categoriaActual={categoria}
            etiquetaActual={etiqueta}
            busqueda={primerValor(parametros.q)}
          />
        </div>

        <div className="mt-12">
          {catalogo.error ? (
            <EstadoError mensaje={catalogo.error} />
          ) : catalogo.videos.length === 0 ? (
            <EstadoVacio
              titulo={busqueda ? "Ninguna coincidencia" : "El catálogo está vacío"}
              descripcion={
                busqueda
                  ? `No hay videos publicados cuyo título contenga «${busqueda}». Prueba con otras palabras o revisa las etiquetas.`
                  : "Todavía no hay videos publicados. En cuanto el administrador publique una pieza aparecerá aquí."
              }
              accion={
                busqueda
                  ? { texto: "Quitar la búsqueda", href: categoria ? `/?categoria=${categoria}` : "/" }
                  : undefined
              }
            />
          ) : (
            <ul className="grid grid-cols-1 gap-x-6 gap-y-12 md:grid-cols-6 lg:grid-cols-12">
              {catalogo.videos.map((video, indice) => (
                <li key={video.id} className={spanEditorial(indice)}>
                  <TarjetaVideo
                    video={video}
                    indice={indice}
                    destacada={esPiezaGrande(indice)}
                  />
                </li>
              ))}

              <CargarMas
                key={`${busqueda}|${categoria}|${etiqueta}|${pagina}`}
                busqueda={busqueda}
                categoria={categoria}
                etiqueta={etiqueta}
                paginaInicial={pagina}
                mostradosIniciales={catalogo.videos.length}
                total={catalogo.total}
                indiceBase={(pagina - 1) * TAMANO_PAGINA + catalogo.videos.length}
              />
            </ul>
          )}
        </div>

        {!catalogo.error && catalogo.videos.length > 0 ? (
          <p className="mt-16 border-t linea pt-6 text-xs leading-relaxed text-hueso-oscuro">
            Los videos se alojan en YouTube como material{" "}
            <span className="text-hueso-tenue">no listado</span>: cualquiera que reciba el enlace
            puede verlos y compartirlos. El catálogo y sus metadatos son de {proyecto.nombre}.
          </p>
        ) : null}

        {hayFiltros ? (
          <p className="mt-8">
            <Link
              href="/"
              className="text-sm text-hueso-tenue underline decoration-acento/60 underline-offset-4 transition-colors hover:text-hueso"
            >
              Quitar todos los filtros
            </Link>
          </p>
        ) : null}
      </section>
    </>
  );
}
