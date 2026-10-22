import Link from "next/link";
import { Marca } from "@/components/marca";

export default function NoEncontrado() {
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="border-b linea px-5 py-5 md:px-8">
        <Marca />
      </header>

      <main id="contenido" className="flex flex-1 items-center">
        <div className="mx-auto w-full max-w-[86rem] px-5 py-20 md:px-8">
          <p className="kicker text-acento">Error 404</p>
          <h1 className="titulo-editorial mt-5 max-w-3xl text-4xl text-hueso sm:text-6xl">
            Esta página no está en el archivo.
          </h1>
          <p className="mt-6 max-w-xl text-base leading-relaxed text-hueso-tenue">
            Puede que la pieza se haya retirado, que el enlace esté mal escrito o que el video
            todavía no esté publicado.
          </p>
          <div className="mt-10 flex flex-wrap gap-3">
            <Link href="/" className="boton boton-acento">
              Volver al catálogo
            </Link>
            <Link href="/#catalogo" className="boton boton-linea">
              Explorar el archivo
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
