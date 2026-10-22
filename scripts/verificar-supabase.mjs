#!/usr/bin/env node
/**
 * Comprobación de la conexión con Supabase.
 *
 * Uso:  npm run verificar
 *
 * Lee .env.local (o las variables de entorno) y comprueba:
 *   1. Que las variables necesarias están definidas.
 *   2. Que la API REST responde con la clave anónima.
 *   3. Qué videos ve un visitante anónimo (sólo los publicados).
 *   4. Si el registro público de usuarios está desactivado.
 *
 * No imprime la clave: sólo indica si está presente.
 */

import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const raizProyecto = resolve(dirname(fileURLToPath(import.meta.url)), "..");

function cargarEntorno() {
  const ruta = resolve(raizProyecto, ".env.local");
  if (!existsSync(ruta)) return;

  for (const linea of readFileSync(ruta, "utf8").split("\n")) {
    const limpia = linea.trim();
    if (!limpia || limpia.startsWith("#")) continue;
    const separador = limpia.indexOf("=");
    if (separador === -1) continue;
    const clave = limpia.slice(0, separador).trim();
    const valor = limpia.slice(separador + 1).trim().replace(/^["']|["']$/g, "");
    if (!process.env[clave]) process.env[clave] = valor;
  }
}

cargarEntorno();

const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
const clave = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

const resultados = [];
function anotar(ok, titulo, detalle) {
  resultados.push({ ok, titulo, detalle });
  console.log(`${ok ? "✔" : "✘"} ${titulo}${detalle ? ` — ${detalle}` : ""}`);
}

if (!url || !clave) {
  anotar(false, "Variables de entorno", "Faltan NEXT_PUBLIC_SUPABASE_URL o NEXT_PUBLIC_SUPABASE_ANON_KEY");
  console.log("\nCopia .env.example a .env.local y completa los valores.");
  process.exit(1);
}

anotar(true, "Variables de entorno", `${url} · clave anónima presente`);

// --- API REST ---------------------------------------------------------------
try {
  const respuesta = await fetch(
    `${url}/rest/v1/videos?select=id,title,status,published_at&order=published_at.desc&limit=5`,
    { headers: { apikey: clave, Authorization: `Bearer ${clave}` } },
  );

  if (!respuesta.ok) {
    anotar(false, "API REST", `HTTP ${respuesta.status} ${respuesta.statusText}`);
  } else {
    const filas = await respuesta.json();
    anotar(
      true,
      "API REST",
      `${filas.length} fila(s) visibles para un visitante anónimo (máximo 5)`,
    );
    for (const fila of filas) {
      console.log(`   · [${fila.status}] ${fila.title}`);
    }
    const filtrados = filas.filter((fila) => fila.status !== "published");
    if (filtrados.length > 0) {
      anotar(
        false,
        "Filtrado de borradores",
        "Un visitante anónimo ve filas que no están publicadas: revisa las políticas RLS",
      );
    } else {
      anotar(true, "Filtrado de borradores", "el anónimo sólo ve videos publicados");
    }
  }
} catch (error) {
  anotar(false, "API REST", error instanceof Error ? error.message : String(error));
}

// --- Autenticación ----------------------------------------------------------
try {
  const respuesta = await fetch(`${url}/auth/v1/settings`, {
    headers: { apikey: clave },
  });

  if (!respuesta.ok) {
    anotar(false, "Configuración de autenticación", `HTTP ${respuesta.status}`);
  } else {
    const ajustes = await respuesta.json();
    const registroAbierto = ajustes?.signup_enabled !== false;
    anotar(
      !registroAbierto,
      "Registro público de usuarios",
      registroAbierto
        ? "está ACTIVADO: desactívalo en Authentication → Sign In / Providers"
        : "desactivado (correcto)",
    );
  }
} catch (error) {
  anotar(false, "Configuración de autenticación", error instanceof Error ? error.message : String(error));
}

// --- Almacenamiento ---------------------------------------------------------
try {
  const respuesta = await fetch(`${url}/storage/v1/bucket/thumbnails`, {
    headers: { apikey: clave, Authorization: `Bearer ${clave}` },
  });

  if (respuesta.ok) {
    const bucket = await respuesta.json();
    anotar(
      true,
      "Bucket de miniaturas",
      `'thumbnails' existe (público: ${bucket.public ? "sí" : "no"})`,
    );
  } else {
    let detalle = `HTTP ${respuesta.status}`;
    try {
      const cuerpo = await respuesta.json();
      detalle = cuerpo.message ?? cuerpo.error ?? detalle;
    } catch {
      /* respuesta sin cuerpo JSON */
    }
    anotar(
      false,
      "Bucket de miniaturas",
      `${detalle} — ejecuta supabase/storage-miniaturas.sql en el SQL Editor`,
    );
  }
} catch (error) {
  anotar(false, "Bucket de miniaturas", error instanceof Error ? error.message : String(error));
}

const fallos = resultados.filter((resultado) => !resultado.ok).length;
console.log(
  `\n${fallos === 0 ? "Todo correcto." : `${fallos} comprobación(es) sin superar.`} Revisa docs/DESPLIEGUE.md.`,
);

process.exit(fallos === 0 ? 0 : 1);
