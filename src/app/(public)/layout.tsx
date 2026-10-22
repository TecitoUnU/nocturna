import type { ReactNode } from "react";
import { MarcoPublico } from "@/components/marco-publico";

/**
 * Marco del sitio público. El panel de administración vive fuera de este
 * grupo y usa su propio diseño (sin cabecera pública ni enlaces).
 */
export const dynamic = "force-dynamic";

export default function LayoutPublico({ children }: { children: ReactNode }) {
  return <MarcoPublico>{children}</MarcoPublico>;
}
