import { connection } from "next/server";
import { redirect } from "next/navigation";
import { crearClienteServidor, supabaseConfigurado } from "@/lib/supabase/cliente";
import { esAdministrador } from "@/lib/auth";
import { listarCategorias } from "@/lib/catalogo";
import { FormularioVideo } from "@/components/estudio/formulario-video";
import { AvisoSinConfiguracion } from "@/components/estados";

export const dynamic = "force-dynamic";

export default async function PaginaNuevoVideo() {
  await connection();

  if (!supabaseConfigurado()) {
    return <AvisoSinConfiguracion />;
  }

  const supabase = await crearClienteServidor();
  const { data } = await supabase.auth.getUser();
  const usuario = data?.user ?? null;

  if (!usuario || !(await esAdministrador(supabase, usuario))) {
    redirect("/studio");
  }

  const categorias = await listarCategorias();

  return (
    <div className="flex flex-col gap-8">
      <header className="border-b linea pb-6">
        <p className="kicker text-acento">Alta</p>
        <h1 className="titulo-editorial mt-3 text-4xl text-hueso">Registrar un video</h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-hueso-tenue">
          El material ya está alojado en YouTube: aquí sólo se guardan el identificador y los
          metadatos del catálogo.
        </p>
      </header>

      <FormularioVideo categorias={categorias} />
    </div>
  );
}
