#!/usr/bin/env node
/**
 * Prueba de extremo a extremo de NOCTURNA contra el doble local de Supabase.
 *
 * IMPORTANTE: esto NO forma parte de la aplicación. Es una batería de
 * comprobaciones que levanta un doble de Supabase (tests/mock) y la web de
 * Next.js en modo desarrollo para verificar el recorrido completo:
 *
 *   · El catálogo público muestra lo publicado y oculta los borradores.
 *   · La búsqueda por título, por categoría y por etiqueta filtra bien.
 *   · La ficha de video existe y la de un borrador devuelve 404.
 *   · El panel pide credenciales y, tras iniciar sesión, muestra el catálogo
 *     completo (incluidos borradores).
 *   · El alta de una pieza la publica en el catálogo público.
 *   · El borrado la retira del catálogo.
 *   · Un visitante anónimo no puede escribir en la base de datos.
 *
 * Uso:  node tests/e2e.mjs
 */

import { spawn } from "node:child_process";
import { setTimeout as esperar } from "node:timers/promises";

const PUERTO_MOCK = 54321;
const PUERTO_WEB = 3222;
const URL_WEB = `http://127.0.0.1:${PUERTO_WEB}`;
const URL_MOCK = `http://127.0.0.1:${PUERTO_MOCK}`;
const CLAVE_ANONIMA = "clave-anonima-de-prueba";
const ADMIN_EMAIL = "admin@nocturna.test";
const ADMIN_PASSWORD = "clave-de-prueba-1234";

let cookies = "";
const resultados = [];

function comprobar(ok, titulo, detalle = "") {
  resultados.push({ ok, titulo });
  console.log(`${ok ? "✔" : "✘"} ${titulo}${detalle ? ` — ${detalle}` : ""}`);
}

function decodificar(texto) {
  return texto
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&");
}

function extraerOcultos(html, { campos = [], texto = "" } = {}) {
  const formularios = html.match(/<form[\s\S]*?<\/form>/g) ?? [];

  // Se elige el formulario adecuado: el HTML de React incluye un formulario
  // por acción de servidor, así que hay que seleccionar el correcto.
  let elegido = "";
  if (texto) elegido = formularios.find((formulario) => formulario.includes(texto)) ?? "";
  if (!elegido) {
    elegido =
      formularios.find((formulario) =>
        campos.some((campo) => formulario.includes(`name="${campo}"`)),
      ) ?? "";
  }
  if (!elegido) elegido = formularios[0] ?? "";

  const ocultos = [];
  for (const etiqueta of elegido.match(/<input[^>]*>/g) ?? []) {
    if (!/type="hidden"/.test(etiqueta)) continue;
    const nombre = etiqueta.match(/name="([^"]*)"/)?.[1];
    const valor = etiqueta.match(/value="([^"]*)"/)?.[1] ?? "";
    if (nombre) ocultos.push([nombre, decodificar(valor)]);
  }
  return ocultos;
}

async function pedir(ruta, opciones = {}) {
  const cabeceras = { ...(opciones.headers ?? {}) };
  if (cookies) cabeceras.cookie = cookies;
  const respuesta = await fetch(`${URL_WEB}${ruta}`, { ...opciones, headers: cabeceras });
  const setCookie = respuesta.headers.getSetCookie?.() ?? [];
  if (setCookie.length > 0) {
    cookies = setCookie
      .map((valor) => valor.split(";")[0])
      .filter((valor) => !valor.endsWith("="))
      .join("; ");
  }
  return respuesta;
}

async function enviarFormulario(ruta, html, campos, selector = {}) {
  const cuerpo = new FormData();
  for (const [nombre, valor] of extraerOcultos(html, selector)) {
    cuerpo.append(nombre, valor);
  }
  for (const [nombre, valor] of Object.entries(campos)) {
    cuerpo.append(nombre, valor);
  }
  return pedir(ruta, { method: "POST", body: cuerpo, redirect: "manual" });
}

async function esperarServidor(url, intentos = 90) {
  for (let i = 0; i < intentos; i += 1) {
    try {
      const respuesta = await fetch(url, { redirect: "manual" });
      if (respuesta.status < 500) return true;
    } catch {
      /* todavía no está listo */
    }
    await esperar(1000);
  }
  return false;
}

// --- Arranque ----------------------------------------------------------------

const procesos = [];

function lanzar(comando, argumentos, entorno = {}) {
  const proceso = spawn(comando, argumentos, {
    cwd: process.cwd(),
    env: { ...process.env, ...entorno },
    stdio: ["ignore", "pipe", "pipe"],
  });
  procesos.push(proceso);
  proceso.stdout.on("data", () => {});
  proceso.stderr.on("data", () => {});
  return proceso;
}

function detenerTodo() {
  for (const proceso of procesos) {
    try {
      proceso.kill("SIGTERM");
    } catch {
      /* ya estaba parado */
    }
  }
}

try {
  lanzar(process.execPath, ["tests/mock/supabase-mock.mjs", String(PUERTO_MOCK)]);
  if (!(await esperarServidor(`${URL_MOCK}/auth/v1/settings`))) {
    throw new Error("El doble de Supabase no arrancó.");
  }

  lanzar(
    process.execPath,
    ["node_modules/next/dist/bin/next", "dev", "-p", String(PUERTO_WEB)],
    {
      NEXT_PUBLIC_SUPABASE_URL: URL_MOCK,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: CLAVE_ANONIMA,
      NEXT_PUBLIC_SITE_NAME: "NOCTURNA",
    },
  );

  if (!(await esperarServidor(`${URL_WEB}/`))) {
    throw new Error("La web no arrancó.");
  }

  // --- Catálogo público ----------------------------------------------------
  const inicio = await pedir("/");
  const htmlInicio = await inicio.text();
  comprobar(inicio.status === 200, "La portada responde 200", `estado ${inicio.status}`);
  comprobar(
    htmlInicio.includes("Dominio y rango de una funcion"),
    "La portada muestra el video publicado",
  );
  comprobar(
    htmlInicio.includes("Circunferencia trigonometrica"),
    "La portada muestra el segundo video publicado",
  );
  comprobar(
    !htmlInicio.includes("Borrador del grupo"),
    "La portada NO muestra los borradores",
  );

  // --- Búsqueda ------------------------------------------------------------
  const busqueda = await pedir("/?q=dominio");
  const htmlBusqueda = await busqueda.text();
  comprobar(
    htmlBusqueda.includes("Dominio y rango de una funcion") &&
      !htmlBusqueda.includes("Circunferencia trigonometrica"),
    "La búsqueda por título filtra correctamente",
  );

  const sinResultado = await pedir("/?q=zzzzz-no-existe");
  const htmlSinResultado = await sinResultado.text();
  comprobar(
    htmlSinResultado.includes("Ninguna coincidencia"),
    "La búsqueda avisa cuando no hay coincidencias",
  );

  const porCategoria = await pedir("/?categoria=Trigonometría");
  const htmlCategoria = await porCategoria.text();
  comprobar(
    htmlCategoria.includes("Circunferencia trigonometrica") &&
      !htmlCategoria.includes("Dominio y rango de una funcion"),
    "El filtro por categoría funciona",
  );

  const porEtiqueta = await pedir("/?etiqueta=dominio");
  const htmlEtiqueta = await porEtiqueta.text();
  comprobar(
    htmlEtiqueta.includes("Dominio y rango de una funcion") &&
      !htmlEtiqueta.includes("Circunferencia trigonometrica"),
    "El filtro por etiqueta funciona",
  );

  // --- Ficha de video ------------------------------------------------------
  const ficha = await pedir("/watch/dominio-y-rango-de-una-funcion");
  const htmlFicha = await ficha.text();
  comprobar(ficha.status === 200, "La ficha del video responde 200");
  comprobar(htmlFicha.includes("Dominio y rango de una funcion"), "La ficha muestra el título");
  comprobar(
    htmlFicha.includes("youtube-nocookie.com/embed/dQw4w9WgXcQ") ||
      htmlFicha.includes("Reproducir Dominio y rango de una funcion"),
    "La ficha ofrece el reproductor oficial de YouTube",
  );
  comprobar(htmlFicha.includes("Abrir en YouTube"), "La ficha enlaza con YouTube");

  const borrador = await pedir("/watch/borrador-del-grupo");
  comprobar(borrador.status === 404, "Un borrador devuelve 404 en público");

  // --- API del catálogo ----------------------------------------------------
  const api = await pedir("/api/catalogo?q=dominio");
  const datosApi = await api.json();
  comprobar(
    api.status === 200 && datosApi.videos.length === 1,
    "La API del catálogo filtra por título",
    `${datosApi.videos?.length ?? 0} resultado(s)`,
  );

  // --- Panel: acceso -------------------------------------------------------
  const panel = await pedir("/studio");
  const htmlPanel = await panel.text();
  comprobar(panel.status === 200, "El panel responde 200 sin sesión");
  comprobar(htmlPanel.includes("Acceso restringido"), "El panel pide iniciar sesión");

  // --- Panel: inicio de sesión --------------------------------------------
  const acceso = await enviarFormulario(
    "/studio",
    htmlPanel,
    { correo: ADMIN_EMAIL, clave: ADMIN_PASSWORD },
    { campos: ["correo"] },
  );
  comprobar(
    acceso.status === 303 || acceso.status === 302,
    "El inicio de sesión redirige tras validar las credenciales",
    `estado ${acceso.status}`,
  );
  comprobar(cookies.includes("auth-token"), "La sesión se guarda en una cookie");

  const panelAutenticado = await pedir("/studio");
  const htmlAutenticado = await panelAutenticado.text();
  comprobar(
    htmlAutenticado.includes("Piezas gestionadas"),
    "El panel autenticado muestra la lista de piezas",
  );
  comprobar(
    htmlAutenticado.includes("Borrador del grupo"),
    "El administrador ve también los borradores",
  );
  comprobar(
    htmlAutenticado.includes("Cómo se publica una pieza"),
    "El panel explica el flujo de publicación",
  );

  // --- Panel: alta de una pieza -------------------------------------------
  const formularioNuevo = await pedir("/studio/nuevo");
  const htmlNuevo = await formularioNuevo.text();
  comprobar(
    formularioNuevo.status === 200 && htmlNuevo.includes("Registrar un video"),
    "Se abre el formulario de alta",
  );

  const alta = await enviarFormulario(
    "/studio/nuevo",
    htmlNuevo,
    {
      youtube: "https://www.youtube.com/watch?v=ZZ11aa22bb3",
      titulo: "Pieza de prueba automatica",
      descripcion: "Creada por la prueba de extremo a extremo.",
      categoria: "Funciones",
      etiquetas: "prueba, automatica",
      estado: "published",
    },
    { campos: ["youtube"] },
  );
  comprobar(
    alta.status === 303 || alta.status === 302,
    "El alta de la pieza se guarda y redirige",
    `estado ${alta.status}`,
  );

  const inicioTrasAlta = await pedir("/");
  const htmlTrasAlta = await inicioTrasAlta.text();
  comprobar(
    htmlTrasAlta.includes("Pieza de prueba automatica"),
    "La pieza publicada aparece en el catálogo público",
  );

  // --- Validación del enlace de YouTube ------------------------------------
  const formularioNuevo2 = await pedir("/studio/nuevo");
  const htmlNuevo2 = await formularioNuevo2.text();
  const altaInvalida = await enviarFormulario(
    "/studio/nuevo",
    htmlNuevo2,
    {
      youtube: "https://vimeo.com/123456789",
      titulo: "Pieza con enlace invalido",
      descripcion: "No debería guardarse.",
      categoria: "Funciones",
      etiquetas: "",
      estado: "draft",
    },
    { campos: ["youtube"] },
  );
  const htmlAltaInvalida = await altaInvalida.text();
  comprobar(
    htmlAltaInvalida.includes("no es de YouTube") ||
      htmlAltaInvalida.includes("youtube.com o youtu.be"),
    "El panel rechaza un enlace que no es de YouTube",
  );

  const inicioTrasInvalido = await pedir("/");
  const htmlTrasInvalido = await inicioTrasInvalido.text();
  comprobar(
    !htmlTrasInvalido.includes("Pieza con enlace invalido"),
    "La pieza con enlace inválido no se guarda",
  );

  // --- Panel: borrado ------------------------------------------------------
  const panelAntes = await pedir("/studio");
  const htmlPanelAntes = await panelAntes.text();

  // Se localiza el formulario de borrado de la pieza de prueba (el bloque de
  // la lista que la contiene) y se envía como un formulario normal.
  const idPiezaPrueba = (() => {
    const bloques = htmlPanelAntes.split(/<li\b/);
    const bloque = bloques.find((trozo) => trozo.includes("Pieza de prueba automatica"));
    if (!bloque) return null;
    return (
      bloque.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/)?.[0] ?? null
    );
  })();

  if (idPiezaPrueba) {
    const borrado = await enviarFormulario(
      "/studio",
      htmlPanelAntes,
      { id: idPiezaPrueba },
      { texto: 'aria-label="Eliminar' },
    );
    comprobar(
      borrado.status === 303 || borrado.status === 302,
      "El panel permite eliminar una pieza",
      `estado ${borrado.status}`,
    );

    const trasBorrado = await pedir("/");
    const htmlTrasBorrado = await trasBorrado.text();
    comprobar(
      !htmlTrasBorrado.includes("Pieza de prueba automatica"),
      "La pieza eliminada desaparece del catálogo público",
    );

    const panelTrasBorrado = await pedir("/studio");
    const htmlPanelTrasBorrado = await panelTrasBorrado.text();
    comprobar(
      !htmlPanelTrasBorrado.includes("Pieza de prueba automatica"),
      "La pieza eliminada desaparece también del panel",
    );
  } else {
    comprobar(false, "Se localiza la pieza de prueba en el panel");
  }

  // --- Escrituras anónimas bloqueadas --------------------------------------
  const escrituraAnonima = await fetch(`${URL_MOCK}/rest/v1/videos`, {
    method: "POST",
    headers: {
      apikey: CLAVE_ANONIMA,
      "content-type": "application/json",
      prefer: "return=representation",
    },
    body: JSON.stringify({
      youtube_video_id: "hack1234567",
      title: "Inyección",
      slug: "inyeccion",
    }),
  });
  comprobar(
    escrituraAnonima.status === 403,
    "Un visitante anónimo no puede insertar filas (RLS)",
    `estado ${escrituraAnonima.status}`,
  );

  const lecturaAnonima = await (
    await fetch(`${URL_MOCK}/rest/v1/videos?select=*`, {
      headers: { apikey: CLAVE_ANONIMA },
    })
  ).json();
  comprobar(
    !lecturaAnonima.some((fila) => fila.status === "draft"),
    "Un visitante anónimo no puede leer borradores (RLS)",
  );

  // --- Resumen -------------------------------------------------------------
  const fallos = resultados.filter((resultado) => !resultado.ok);
  console.log(
    `\n${resultados.length - fallos.length}/${resultados.length} comprobaciones superadas.`,
  );
  if (fallos.length > 0) {
    console.log("Fallos:");
    for (const fallo of fallos) console.log(`  · ${fallo.titulo}`);
  }
  process.exitCode = fallos.length === 0 ? 0 : 1;
} catch (error) {
  console.error("La prueba de extremo a extremo falló:", error);
  process.exitCode = 1;
} finally {
  detenerTodo();
  await esperar(500);
}
