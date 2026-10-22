import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { siteConfig } from "@/lib/config";
import "./globals.css";

/**
 * Tipografía de titular: Instrument Serif (OFL, servida desde el propio
 * repositorio para no depender de la red durante la compilación).
 */
const fuenteDisplay = localFont({
  src: [
    {
      path: "../fonts/instrument-serif-latin.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "../fonts/instrument-serif-italic-latin.woff2",
      weight: "400",
      style: "italic",
    },
  ],
  variable: "--fuente-display",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.urlBase || "http://localhost:3000"),
  title: {
    default: `${siteConfig.nombre} · ${siteConfig.lema}`,
    template: `%s · ${siteConfig.nombre}`,
  },
  description: siteConfig.descripcion,
  applicationName: siteConfig.nombre,
  keywords: ["archivo audiovisual", "catálogo de video", "editorial", "documental"],
  openGraph: {
    type: "website",
    locale: "es_ES",
    siteName: siteConfig.nombre,
    title: `${siteConfig.nombre} · ${siteConfig.lema}`,
    description: siteConfig.descripcion,
  },
  twitter: {
    card: "summary_large_image",
    title: `${siteConfig.nombre} · ${siteConfig.lema}`,
    description: siteConfig.descripcion,
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#09090f",
  colorScheme: "dark",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="es"
      className={`${fuenteDisplay.variable} ${GeistSans.variable} ${GeistMono.variable} antialiased`}
    >
      <body className="min-h-dvh bg-noche-900 text-hueso font-sans flex flex-col">
        <a
          href="#contenido"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:rounded-full focus:bg-acento focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-noche-950"
        >
          Saltar al contenido
        </a>
        {children}
      </body>
    </html>
  );
}
