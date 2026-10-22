#!/usr/bin/env node
/**
 * Despliegue en Vercel (plan Hobby, sin coste) a partir de las variables que
 * ya están en `.env.local`.
 *
 * Uso:
 *   VERCEL_TOKEN=tu_token npx vercel ...   (el token se crea en
 *   https://vercel.com/account/tokens)
 *   npm run desplegar
 *
 * Qué hace:
 *   1. Comprueba la sesión de la CLI con el token.
 *   2. Crea el proyecto si no existe.
 *   3. Copia las variables NEXT_PUBLIC_* de .env.local al proyecto
 *      (producción, preview y desarrollo).
 *   4. Despliega a producción y muestra la URL.
 *
 * El token nunca se escribe en disco: se lee de la variable de entorno.
 */
import { spawn } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const raiz = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const TOKEN = process.env.VERCEL_TOKEN?.trim();
const NOMBRE = process.env.VERCEL_PROJECT_NAME?.trim() || "nocturna";

if (!TOKEN) {
  console.error(
    "\n✘ Falta VERCEL_TOKEN.\n\n" +
      "  1. Entra en https://vercel.com/account/tokens\n" +
      "  2. Pulsa «Create Token» (ponle nombre: \"nocturna\") y cópialo\n" +
      "  3. Ejecuta:  VERCEL_TOKEN=pega_aqui_el_token npm run desplegar\n",
  );
  process.exit(1);
}

/** Lee .env.local (formato KEY=VALUE, ignora comentarios). */
function leerEnvLocal() {
  const ruta = resolve(raiz, ".env.local");
  if (!existsSync(ruta)) return {};
  const valores = {};
  for (const linea of readFileSync(ruta, "utf8").split("\n")) {
    const limpia = linea.trim();
    if (!limpia || limpia.startsWith("#")) continue;
    const separador = limpia.indexOf("=");
    if (separador === -1) continue;
    valores[limpia.slice(0, separador).trim()] = limpia
      .slice(separador + 1)
      .trim()
      .replace(/^["']|["']$/g, "");
  }
  return valores;
}

const variables = leerEnvLocal();

const A_SUBIR = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "NEXT_PUBLIC_SITE_NAME",
  "NEXT_PUBLIC_SITE_TAGLINE",
  "NEXT_PUBLIC_SITE_DESCRIPTION",
];

function vercel(args, opciones = {}) {
  return new Promise((resolvePromesa) => {
    const proceso = spawn(
      "npx",
      ["--yes", "vercel@latest", ...args],
      {
        cwd: raiz,
        env: { ...process.env, VERCEL_TOKEN: TOKEN },
        stdio: opciones.silencioso ? ["ignore", "pipe", "pipe"] : "inherit",
      },
    );

    let salida = "";
    if (opciones.silencioso) {
      proceso.stdout.on("data", (d) => (salida += d));
      proceso.stderr.on("data", (d) => (salida += d));
    }

    proceso.on("close", (codigo) => resolvePromesa({ codigo, salida }));
  });
}

console.log(`\n  Despliegue de ${NOMBRE} en Vercel\n`);

// 1. Sesión
const sesion = await vercel(["whoami", "--token", TOKEN], { silencioso: true });
if (sesion.codigo !== 0) {
  console.error("✘ El token no es válido:\n" + sesion.salida);
  process.exit(1);
}
console.log(`✔ Sesión: ${sesion.salida.trim().split("\n").pop()}`);

// 2. Proyecto (se crea si no existe)
const proyecto = await vercel(
  ["project", "ls", "--token", TOKEN, "--yes", "--name", NOMBRE],
  { silencioso: true },
);
console.log(
  proyecto.codigo === 0
    ? `✔ Proyecto «${NOMBRE}» listo`
    : `✔ Se usará el proyecto «${NOMBRE}» (se creará en el despliegue)`,
);

// 3. Variables de entorno
for (const clave of A_SUBIR) {
  const valor = variables[clave];
  if (!valor) {
    console.log(`· ${clave}: no está en .env.local, se omite`);
    continue;
  }
  const resultado = await vercel(
    [
      "env",
      "add",
      clave,
      "--value",
      valor,
      "--environment",
      "production,preview,development",
      "--force",
      "--yes",
      "--token",
      TOKEN,
      "--project",
      NOMBRE,
    ],
    { silencioso: true },
  );
  console.log(
    resultado.codigo === 0 ? `✔ ${clave}` : `✘ ${clave} (revisa con: vercel env ls)`,
  );
}

// 4. Despliegue
console.log("\n  Desplegando en producción…\n");
const despliegue = await vercel([
  "deploy",
  "--prod",
  "--yes",
  "--token",
  TOKEN,
  "--name",
  NOMBRE,
  "--create-if-missing",
  "--archive",
  "tgz",
  "--logs",
]);

if (despliegue.codigo !== 0) {
  console.error("\n✘ El despliegue falló. Revisa los logs anteriores.");
  process.exit(1);
}

console.log("\n✔ Despliegue completado. Comprueba la URL que aparece arriba.");
console.log("  Recuerda añadir ese dominio en Supabase → Authentication → URL Configuration.");
