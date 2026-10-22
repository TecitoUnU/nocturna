import type { MetadataRoute } from "next";
import { listarCatalogo } from "@/lib/catalogo";
import { supabaseConfigurado } from "@/lib/supabase/cliente";
import { siteConfig } from "@/lib/config";

/** Mapa del sitio con las piezas publicadas. */
export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteConfig.urlBase || "http://localhost:3000";

  if (!supabaseConfigurado()) {
    return [{ url: base, lastModified: new Date(), changeFrequency: "weekly" }];
  }

  const { videos } = await listarCatalogo({ limite: 48 });

  return [
    {
      url: base,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
    ...videos.map((video) => ({
      url: `${base}/watch/${video.slug}`,
      lastModified: new Date(video.updated_at),
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
  ];
}
