import type { ReactNode } from "react";
import { MarcoPublico } from "@/components/marco-publico";

/** Marco público de las fichas de video. */
export const dynamic = "force-dynamic";

export default function LayoutWatch({ children }: { children: ReactNode }) {
  return <MarcoPublico>{children}</MarcoPublico>;
}
