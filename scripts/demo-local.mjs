#!/usr/bin/env node
/**
 * Entorno de demostración local (sin coste, sin credenciales).
 *
 * Levanta un doble de Supabase (tests/mock/supabase-mock.mjs) con datos de
 * ejemplo y arranca la web de Next.js apuntando a él. Sirve para probar la
 * interfaz completa sin tener que crear un proyecto de Supabase:
 *
 *   · Catálogo con piezas publicadas y un borrador invisible en público.
 *   · Buscador, filtros por categoría y por etiqueta.
 *   · Fichas con reproductor de YouTube (el doble no aloja el video real).
 *   · Panel /studio con acceso de administrador.
 *
 * Datos de acceso del administrador de prueba:
 *   correo: admin@nocturna.test
 *   clave:   clave-de-prueba-1234
 *
 * Uso:  npm run demo
 */

import { spawn } from "node:child_process";

const PUERTO_WEB = Number(process.env.PORT ?? 3000);
const PUERTO_MOCK = Number(process.env.PUERTO_MOCK ?? 54321);
const URL_MOCK = `http://127.0.0.1:${PUERTO_MOCK}`;
const CLAVE_ANONIMA = "clave-anonima-de-prueba";

const procesos = [];

function lanzar(comando, argumentos, entorno = {}) {
  const proceso = spawn(comando, argumentos, {
    cwd: process.cwd(),
    env: { ...process.env, ...entorno },
    stdio: "inherit",
  });
  procesos.push(proceso);
  return proceso;
}

function detener() {
  for (const proceso of procesos) {
    try {
      proceso.kill("SIGTERM");
    } catch {
      /* ya estaba parado */
    }
  }
  process.exit(0);
}

process.on("SIGINT", detener);
process.on("SIGTERM", detener);

console.log("\n  NOCTURNA · entorno de demostración local\n");
console.log(`  Doble de Supabase : ${URL_MOCK}`);
console.log(`  Web               : http://localhost:${PUERTO_WEB}`);
console.log("  Panel             : http://localhost:" + PUERTO_WEB + "/studio");
console.log("  Administrador     : admin@nocturna.test / clave-de-prueba-1234\n");

lanzar(process.execPath, ["tests/mock/supabase-mock.mjs", String(PUERTO_MOCK)]);

lanzar(process.execPath, ["node_modules/next/dist/bin/next", "dev", "-p", String(PUERTO_WEB)], {
  NEXT_PUBLIC_SUPABASE_URL: URL_MOCK,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: CLAVE_ANONIMA,
  NEXT_PUBLIC_SITE_NAME: "NOCTURNA",
});
