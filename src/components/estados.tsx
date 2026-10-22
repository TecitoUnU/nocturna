import Link from "next/link";

export function EstadoVacio({
  titulo,
  descripcion,
  accion,
}: {
  titulo: string;
  descripcion: string;
  accion?: { texto: string; href: string };
}) {
  return (
    <div className="panel flex flex-col items-center gap-4 px-6 py-16 text-center">
      <span aria-hidden="true" className="h-px w-12 bg-acento" />
      <h3 className="titulo-editorial text-2xl text-hueso">{titulo}</h3>
      <p className="max-w-md text-sm leading-relaxed text-hueso-tenue">{descripcion}</p>
      {accion ? (
        <Link href={accion.href} className="boton boton-linea mt-2">
          {accion.texto}
        </Link>
      ) : null}
    </div>
  );
}

export function EstadoError({ mensaje }: { mensaje: string }) {
  return (
    <div
      role="alert"
      className="panel flex flex-col items-center gap-4 border-[#f87171]/30 px-6 py-14 text-center"
    >
      <p className="kicker text-[#f87171]">Error</p>
      <p className="max-w-lg text-sm leading-relaxed text-hueso-tenue">{mensaje}</p>
      <p className="max-w-lg text-xs leading-relaxed text-hueso-oscuro">
        Si el problema persiste, revisa la conexión con Supabase y que las migraciones estén
        aplicadas.
      </p>
    </div>
  );
}

export function AvisoSinConfiguracion() {
  return (
    <div className="panel flex flex-col items-center gap-4 px-6 py-16 text-center">
      <p className="kicker text-acento">Configuración pendiente</p>
      <h2 className="titulo-editorial text-2xl text-hueso">Falta conectar con Supabase</h2>
      <p className="max-w-xl text-sm leading-relaxed text-hueso-tenue">
        Esta instalación todavía no tiene definidos{" "}
        <code className="font-mono text-xs text-acento-tenue">NEXT_PUBLIC_SUPABASE_URL</code> ni{" "}
        <code className="font-mono text-xs text-acento-tenue">NEXT_PUBLIC_SUPABASE_ANON_KEY</code>.
        Copia <code className="font-mono text-xs">.env.example</code> a{" "}
        <code className="font-mono text-xs">.env.local</code> y completa los pasos de{" "}
        <code className="font-mono text-xs">docs/DESPLIEGUE.md</code>.
      </p>
    </div>
  );
}
