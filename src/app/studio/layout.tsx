import type { ReactNode } from "react";
import Link from "next/link";
import { Marca } from "@/components/marca";

/**
 * Marco del panel. Es un espacio separado del sitio público: no se enlaza
 * desde la navegación pública y sólo aparece si se conoce la ruta /studio.
 */
export default function LayoutEstudio({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col bg-noche-950">
      <header className="border-b linea bg-noche-900/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[86rem] items-center justify-between gap-4 px-5 py-4 md:px-8">
          <div className="flex items-center gap-4">
            <Marca compacta />
            <span className="kicker border-l linea pl-4 text-hueso-oscuro">Estudio</span>
          </div>
          <Link
            href="/"
            className="text-sm text-hueso-tenue transition-colors hover:text-hueso"
          >
            Ver la web ↗
          </Link>
        </div>
      </header>

      <main id="contenido" className="mx-auto w-full max-w-[86rem] flex-1 px-5 py-10 md:px-8 md:py-14">
        {children}
      </main>

      <footer className="border-t linea px-5 py-6 text-xs text-hueso-oscuro md:px-8">
        <div className="mx-auto max-w-[86rem]">
          Espacio privado. Las operaciones se ejecutan con tu sesión y quedan autorizadas en
          PostgreSQL mediante políticas RLS.
        </div>
      </footer>
    </div>
  );
}
