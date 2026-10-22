import Link from "next/link";
import { siteConfig } from "@/lib/config";

/**
 * Marca de la plataforma: un símbolo original (media luna geométrica con un
 * punto de acento). No utiliza logotipos ni recursos de YouTube.
 */
export function Simbolo({ className = "h-7 w-7" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 64 64"
      className={className}
      role="img"
      aria-label={`Símbolo de ${siteConfig.nombre}`}
      focusable="false"
    >
      <path
        fillRule="evenodd"
        d="M31 13a19 19 0 1 0 0 38 19 19 0 0 0 0-38Zm7-5a19 19 0 1 1 0 38 19 19 0 0 1 0-38Z"
        fill="currentColor"
      />
      <circle cx="45" cy="45" r="5.5" fill="var(--color-acento)" />
    </svg>
  );
}

export function Marca({ compacta = false }: { compacta?: boolean }) {
  return (
    <Link
      href="/"
      className="group inline-flex items-center gap-2.5 text-hueso"
      aria-label={`${siteConfig.nombre}: inicio`}
    >
      <span className="text-hueso transition-colors group-hover:text-acento">
        <Simbolo className="h-7 w-7" />
      </span>
      {!compacta && (
        <span className="flex flex-col leading-none">
          <span className="titulo-editorial text-xl tracking-[0.18em] uppercase">
            {siteConfig.nombre}
          </span>
          <span className="kicker mt-1 text-hueso-oscuro">{siteConfig.lema}</span>
        </span>
      )}
    </Link>
  );
}
