import { connection } from "next/server";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { crearClienteServidor, supabaseConfigurado } from "@/lib/supabase/cliente";
import { esAdministrador } from "@/lib/auth";
import { listarCategorias, obtenerVideoAdministracion } from "@/lib/catalogo";
import { FormularioVideo } from "@/components/estudio/formulario-video";
import { AvisoSinConfiguracion } from "@/components/estados";

export const dynamic = "force-dynamic";

export default async function PaginaEditarVideo({ params }: PageProps<"/studio/[id]">) {
  await connection();

  const { id } = await params;

  if (!supabaseConfigurado()) {
    return <AvisoSinConfiguracion />;
  }

  const supabase = await crearClienteServidor();
  const { data } = await supabase.auth.getUser();
  const usuario = data?.user ?? null;

  if (!usuario || !(await esAdministrador(supabase, usuario))) {
    redirect("/studio");
  }

  const video = await obtenerVideoAdministracion(id);
  if (!video) {
    notFound();
  }

  const categorias = await listarCategorias();

  return (
    <div className="flex flex-col gap-8">
      <header className="border-b linea pb-6">
        <p className="kicker text-acento">Edición</p>
        <h1 className="titulo-editorial mt-3 text-4xl text-hueso">{video.title}</h1>
        <p className="mt-3 text-xs text-hueso-oscuro">
          Identificador de YouTube:{" "}
          <span className="font-mono text-hueso-tenue">{video.youtube_video_id}</span> ·{" "}
          <Link href={`/watch/${video.slug}`} className="underline underline-offset-4">
            ver en la web
          </Link>
        </p>
      </header>

      <FormularioVideo video={video} categorias={categorias} />
    </div>
  );
}
