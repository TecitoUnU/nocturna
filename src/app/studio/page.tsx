import { connection } from "next/server";
import Link from "next/link";
import { crearClienteServidor } from "@/lib/supabase/cliente";
import { esAdministrador } from "@/lib/auth";
import { listarCategorias, listarVideosAdministracion } from "@/lib/catalogo";
import { cerrarSesion } from "@/lib/acciones/sesion";
import { Acceso } from "@/components/estudio/acceso";
import { GuiaYouTube } from "@/components/estudio/guia";
import { ListaVideos } from "@/components/estudio/lista-videos";
import { GestionCategorias } from "@/components/estudio/categorias";
import { AvisoSinConfiguracion, EstadoError } from "@/components/estados";
import { supabaseConfigurado } from "@/lib/supabase/cliente";

function primerValor(valor: string | string[] | undefined): string {
  if (Array.isArray(valor)) return valor[0] ?? "";
  return valor ?? "";
}

const AVISOS: Record<string, string> = {
  guardado: "Video guardado correctamente.",
  estado: "Estado del video actualizado.",
  eliminado: "Video eliminado del catálogo.",
  categoria: "Categorías actualizadas.",
  error: "No se pudo completar la operación.",
  "sin-permisos": "Tu cuenta no tiene permisos de administrador.",
};

export const dynamic = "force-dynamic";

export default async function PaginaEstudio({ searchParams }: PageProps<"/studio">) {
  await connection();

  const parametros = await searchParams;
  const aviso = AVISOS[primerValor(parametros.mensaje)];

  if (!supabaseConfigurado()) {
    return <AvisoSinConfiguracion />;
  }

  const supabase = await crearClienteServidor();
  const { data, error: errorSesion } = await supabase.auth.getUser();
  const usuario = data?.user ?? null;

  if (errorSesion || !usuario) {
    return <Acceso />;
  }

  if (!(await esAdministrador(supabase, usuario))) {
    return (
      <div className="mx-auto max-w-lg">
        <p className="kicker text-[#f87171]">Acceso restringido</p>
        <h1 className="titulo-editorial mt-4 text-4xl text-hueso">No tienes permisos</h1>
        <p className="mt-4 text-sm leading-relaxed text-hueso-tenue">
          La sesión es válida, pero la cuenta <span className="font-mono text-xs">{usuario.email}</span>{" "}
          no figura en la tabla <span className="font-mono text-xs">admins</span> de la base de
          datos, así que no puede gestionar el catálogo.
        </p>
        <form action={cerrarSesion} className="mt-8">
          <button type="submit" className="boton boton-linea">
            Cerrar sesión
          </button>
        </form>
      </div>
    );
  }

  const [{ videos, error }, categorias] = await Promise.all([
    listarVideosAdministracion(),
    listarCategorias(),
  ]);

  const publicados = videos.filter((video) => video.status === "published").length;

  return (
    <div className="flex flex-col gap-10">
      <header className="flex flex-col gap-6 border-b linea pb-8 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="kicker text-acento">Panel de administración</p>
          <h1 className="titulo-editorial mt-3 text-4xl text-hueso md:text-5xl">Estudio</h1>
          <p className="mt-3 text-sm text-hueso-tenue">
            Sesión de <span className="font-mono text-xs">{usuario.email}</span> ·{" "}
            {publicados} publicados · {videos.length - publicados} borradores
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Link href="/studio/nuevo" className="boton boton-acento">
            Registrar un video
          </Link>
          <form action={cerrarSesion}>
            <button type="submit" className="boton boton-linea">
              Cerrar sesión
            </button>
          </form>
        </div>
      </header>

      {aviso ? (
        <p
          role="status"
          className="panel px-4 py-3 text-sm text-acento-tenue"
        >
          {aviso}
        </p>
      ) : null}

      {error ? <EstadoError mensaje={error} /> : null}

      <GuiaYouTube />

      <section className="panel p-6">
        <div className="flex items-center justify-between gap-3">
          <h2 className="kicker text-hueso-oscuro">Piezas gestionadas</h2>
          <span className="text-xs text-hueso-oscuro">{videos.length} en total</span>
        </div>

        <div className="mt-4">
          <ListaVideos videos={videos} />
        </div>
      </section>

      <GestionCategorias categorias={categorias} />
    </div>
  );
}
