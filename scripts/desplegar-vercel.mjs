#!/usr/bin/env node
/**
 * Despliegue en Vercel (plan Hobby, sin coste) a partir de las variables que
 * ya están en `.env.local`.
 *
 * Uso:
 *   VERCEL_TOKEN=tu_token npm run desplegar
 *
 * El token se crea en https://vercel.com/account/tokens y sólo se lee de la
 * variable de entorno: nunca se escribe en disco ni en el repositorio.
 *
 * Pasos:
 *   1. Comprueba la sesión con el token.
 *   2. Crea el proyecto en Vercel si no existe (API).
 *   3. Enlaza la carpeta con el proyecto.
 *   4. Copia las variables NEXT_PUBLIC_* de .env.local (producción, preview y
 *      desarrollo).
 *   5. Despliega a producción.
 */
import { spawn } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const raiz = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const TOKEN = process.env.VERCEL_TOKEN?.trim();
const NOMBRE = process.env.VERCEL_PROJECT_NAME?.trim() || "nocturna";
const API = "https://api.vercel.com";

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

// URL pública real (sólo se conoce tras el primer despliegue).
if (process.env.VERCEL_SITE_URL) {
  variables.NEXT_PUBLIC_SITE_URL = process.env.VERCEL_SITE_URL.trim();
}

const A_SUBIR = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "NEXT_PUBLIC_SITE_NAME",
  "NEXT_PUBLIC_SITE_TAGLINE",
  "NEXT_PUBLIC_SITE_DESCRIPTION",
  "NEXT_PUBLIC_SITE_URL",
];

/** Ejecuta la CLI de Vercel (el token viaja por VERCEL_TOKEN, no por argumentos). */
function vercel(args, opciones = {}) {
  return new Promise((resolver) => {
    const proceso = spawn("npx", ["--yes", "vercel@latest", ...args], {
      cwd: raiz,
      env: { ...process.env, VERCEL_TOKEN: TOKEN },
      stdio: opciones.silencioso ? ["ignore", "pipe", "pipe"] : "inherit",
    });

    let salida = "";
    if (opciones.silencioso) {
      proceso.stdout.on("data", (d) => (salida += d));
      proceso.stderr.on("data", (d) => (salida += d));
    }

    proceso.on("close", (codigo) => resolver({ codigo, salida }));
  });
}

/** API REST de Vercel. */
async function api(ruta, metodo, cuerpo) {
  const respuesta = await fetch(`${API}${ruta}`, {
    method: metodo,
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      "Content-Type": "application/json",
    },
    body: cuerpo ? JSON.stringify(cuerpo) : undefined,
  });
  const texto = await respuesta.text();
  let datos = {};
  try {
    datos = texto ? JSON.parse(texto) : {};
  } catch {
    datos = { message: texto };
  }
  return { estado: respuesta.status, datos };
}

console.log(`\n  Despliegue de ${NOMBRE} en Vercel\n`);

// 1. Sesión
const sesion = await vercel(["whoami"], { silencioso: true });
if (sesion.codigo !== 0) {
  console.error("✘ El token no es válido:\n" + sesion.salida);
  process.exit(1);
}
const cuenta = sesion.salida.trim().split("\n").pop()?.trim() ?? "";
console.log(`✔ Sesión: ${cuenta}`);

// 2. Proyecto (crearlo si no existe)
let proyectoId = null;
const listado = await api("/v9/projects?limit=100", "GET");
if (listado.estado === 200 && Array.isArray(listado.datos.projects)) {
  const encontrado = listado.datos.projects.find((p) => p.name === NOMBRE);
  if (encontrado) {
    proyectoId = encontrado.id;
    console.log(`✔ El proyecto «${NOMBRE}» ya existe`);
  }
}

if (!proyectoId) {
  const creado = await api("/v10/projects", "POST", {
    name: NOMBRE,
    framework: "nextjs",
  });
  if (creado.estado >= 200 && creado.estado < 300) {
    proyectoId = creado.datos.id;
    console.log(`✔ Proyecto «${NOMBRE}» creado`);
  } else {
    console.error(
      `✘ No se pudo crear el proyecto: ${creado.datos.message ?? creado.datos.error?.message ?? "error desconocido"}`,
    );
    process.exit(1);
  }
}

// 3. Enlazar la carpeta con el proyecto
const enlace = await vercel(["link", "--project", proyectoId, "--yes"], { silencioso: true });
if (enlace.codigo !== 0) {
  console.error("✘ No se pudo enlazar el proyecto:\n" + enlace.salida);
  process.exit(1);
}
console.log("✔ Carpeta enlazada con el proyecto");

// 4. Variables de entorno
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
    ],
    { silencioso: true },
  );
  console.log(resultado.codigo === 0 ? `✔ ${clave}` : `✘ ${clave}`);
}

// 5. Despliegue
console.log("\n  Desplegando en producción…\n");
const despliegue = await vercel(["deploy", "--prod", "--yes", "--archive", "tgz", "--logs"]);

if (despliegue.codigo !== 0) {
  console.error("\n✘ El despliegue falló. Revisa los logs anteriores.");
  process.exit(1);
}

console.log("\n✔ Despliegue completado.");
console.log("  1. Copia la URL que aparece arriba.");
console.log("  2. Añádela en Supabase → Authentication → URL Configuration → Site URL.");
console.log("  3. Comprueba la web: catálogo, búsqueda, reproducción y panel.");
