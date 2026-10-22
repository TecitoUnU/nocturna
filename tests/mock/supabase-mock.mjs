#!/usr/bin/env node
/**
 * Doble de prueba de Supabase (PostgreSQL + Auth + Storage).
 *
 * IMPORTANTE: esto NO forma parte de la aplicación. Es un banco de pruebas
 * local que reproduce el comportamiento que necesita NOCTURNA:
 *
 *   · REST estilo PostgREST (filtros eq / ilike / like / cs, orden, rangos,
 *     count=exact, return=representation, single / maybeSingle).
 *   · Auth por correo y contraseña con un JWT de prueba.
 *   · Storage con un bucket público de sólo lectura y escritura autenticada.
 *   · Row Level Security simulado: un visitante anónimo sólo ve los videos
 *     publicados; un administrador ve también los borradores y puede escribir.
 *
 * Uso:  node tests/mock/supabase-mock.mjs [puerto]
 */

import { createServer } from "node:http";
import { randomUUID } from "node:crypto";

const PUERTO = Number(process.argv[2] ?? 54321);
const CLAVE_ANONIMA = "clave-anonima-de-prueba";
const ADMIN_EMAIL = "admin@nocturna.test";
const ADMIN_PASSWORD = "clave-de-prueba-1234";

const ahora = () => new Date().toISOString();

// --- Estado en memoria -------------------------------------------------------

const estado = {
  admins: [{ id: randomUUID(), email: ADMIN_EMAIL, created_at: ahora() }],
  categories: [
    { id: randomUUID(), slug: "funciones", name: "Funciones", created_at: ahora() },
    { id: randomUUID(), slug: "ecuaciones", name: "Ecuaciones", created_at: ahora() },
    { id: randomUUID(), slug: "rectas", name: "Rectas", created_at: ahora() },
  ],
  videos: [
    {
      id: "11111111-1111-4111-8111-111111111111",
      youtube_video_id: "dQw4w9WgXcQ",
      title: "Dominio y rango de una funcion",
      slug: "dominio-y-rango-de-una-funcion",
      title_search: "dominio y rango de una funcion",
      description: "Como se lee el comportamiento de una funcion en sus limites.",
      thumbnail_url: null,
      thumbnail_path: null,
      category: "Funciones",
      tags: ["dominio", "grafica"],
      status: "published",
      is_featured: true,
      created_at: "2024-03-01T10:00:00.000Z",
      updated_at: "2024-03-01T10:00:00.000Z",
      published_at: "2024-03-01T10:00:00.000Z",
    },
    {
      id: "22222222-2222-4222-8222-222222222222",
      youtube_video_id: "abcdefghijk",
      title: "Ecuaciones de segundo grado",
      slug: "ecuaciones-de-segundo-grado",
      title_search: "ecuaciones de segundo grado",
      description: "Formula cuadratica, discriminante y sus raices.",
      thumbnail_url: null,
      thumbnail_path: null,
      category: "Ecuaciones",
      tags: ["discriminante"],
      status: "published",
      is_featured: false,
      created_at: "2024-02-10T10:00:00.000Z",
      updated_at: "2024-02-10T10:00:00.000Z",
      published_at: "2024-02-10T10:00:00.000Z",
    },
    {
      id: "33333333-3333-4333-8333-333333333333",
      youtube_video_id: "zzzzzzzzzzz",
      title: "Borrador del grupo",
      slug: "borrador-del-grupo",
      title_search: "borrador del grupo",
      description: "No debe verse en el catalogo publico.",
      thumbnail_url: null,
      thumbnail_path: null,
      category: "Rectas",
      tags: ["borrador"],
      status: "draft",
      is_featured: false,
      created_at: "2024-04-01T10:00:00.000Z",
      updated_at: "2024-04-01T10:00:00.000Z",
      published_at: null,
    },
  ],
  almacenamiento: new Map(),
  tokens: new Map(),
};

const usuarioAdmin = {
  id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
  aud: "authenticated",
  role: "authenticated",
  email: ADMIN_EMAIL,
  email_confirmed_at: "2024-01-01T00:00:00.000Z",
  phone: "",
  confirmed_at: "2024-01-01T00:00:00.000Z",
  last_sign_in_at: ahora(),
  app_metadata: { provider: "email", providers: ["email"] },
  user_metadata: {},
  identities: [],
  created_at: "2024-01-01T00:00:00.000Z",
  updated_at: "2024-01-01T00:00:00.000Z",
  is_anonymous: false,
};

// --- Utilidades ---------------------------------------------------------------

function base64url(objeto) {
  return Buffer.from(JSON.stringify(objeto)).toString("base64url");
}

function crearToken(usuario) {
  const cabecera = base64url({ alg: "HS256", typ: "JWT" });
  const carga = base64url({
    sub: usuario.id,
    email: usuario.email,
    role: "authenticated",
    aud: "authenticated",
    exp: Math.floor(Date.now() / 1000) + 3600,
    iat: Math.floor(Date.now() / 1000),
    session_id: randomUUID(),
    app_metadata: usuario.app_metadata,
    user_metadata: usuario.user_metadata,
    email_verified: true,
    is_anonymous: false,
  });
  const token = `${cabecera}.${carga}.firma-de-prueba`;
  estado.tokens.set(token, usuario);
  return token;
}

function usuarioDePeticion(peticion) {
  const cabecera = peticion.headers.authorization;
  if (!cabecera?.startsWith("Bearer ")) return null;
  return estado.tokens.get(cabecera.slice(7)) ?? null;
}

function esAdministrador(usuario) {
  if (!usuario) return false;
  return estado.admins.some(
    (admin) => admin.email.toLowerCase() === (usuario.email ?? "").toLowerCase(),
  );
}

function normalizar(texto) {
  return String(texto ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function filaVisible(fila, usuario) {
  // RLS simulado: los borradores sólo son visibles para el administrador.
  if (fila.status === "published") return true;
  return esAdministrador(usuario);
}

function aplicarFiltro(fila, columna, filtro) {
  const [operador, ...resto] = filtro.split(".");
  const valor = resto.join(".");
  const real = fila[columna];

  switch (operador) {
    case "eq":
      return String(real ?? "") === valor;
    case "neq":
      return String(real ?? "") !== valor;
    case "ilike": {
      const limpio = valor.replace(/[%*]/g, "");
      return normalizar(real).includes(normalizar(limpio));
    }
    case "like": {
      // Los comodines de PostgREST son % y *; se traducen a la expresión
      // regular equivalente.
      const regex = new RegExp(
        `^${valor.replace(/[.+?^${}()|[\]\\]/g, "\\$&").replace(/[%*]/g, ".*")}$`,
        "i",
      );
      return regex.test(String(real ?? ""));
    }
    case "cs": {
      const limpio = valor.replace(/^\{|\}$/g, "");
      const elementos = limpio.split(",").map((v) => v.replace(/^"|"$/g, ""));
      if (Array.isArray(real)) return elementos.every((elemento) => real.includes(elemento));
      return String(real ?? "").includes(limpio);
    }
    case "in": {
      const limpio = valor.replace(/^\(|\)$/g, "");
      const elementos = limpio.split(",").map((v) => v.replace(/^"|"$/g, ""));
      return elementos.includes(String(real ?? ""));
    }
    default:
      return true;
  }
}

function ordenar(filas, orden) {
  if (!orden) return filas;
  const copia = [...filas];
  copia.sort((a, b) => {
    for (const parte of orden.split(",")) {
      const [columna, direccion] = parte.split(".");
      const va = a[columna] ?? "";
      const vb = b[columna] ?? "";
      if (va === vb) continue;
      const resultado = va > vb ? 1 : -1;
      return direccion === "desc" ? -resultado : resultado;
    }
    return 0;
  });
  return copia;
}

function cuerpoJSON(peticion) {
  return new Promise((resolver) => {
    const trozos = [];
    peticion.on("data", (trozo) => trozos.push(trozo));
    peticion.on("end", () => {
      const cuerpo = Buffer.concat(trozos).toString("utf8");
      if (!cuerpo) return resolver({});
      try {
        resolver(JSON.parse(cuerpo));
      } catch {
        resolver({});
      }
    });
  });
}

function responder(respuesta, codigo, cuerpo, cabeceras = {}) {
  const datos = cuerpo === undefined ? "" : JSON.stringify(cuerpo);
  respuesta.writeHead(codigo, {
    "content-type": "application/json; charset=utf-8",
    "access-control-allow-origin": "*",
    "access-control-allow-headers": "*",
    "access-control-allow-methods": "GET,POST,PATCH,DELETE,OPTIONS",
    ...cabeceras,
  });
  respuesta.end(datos);
}

// --- Servidor ----------------------------------------------------------------

const servidor = createServer(async (peticion, respuesta) => {
  const url = new URL(peticion.url, `http://${peticion.headers.host ?? "localhost"}`);
  const ruta = url.pathname;
  const metodo = peticion.method ?? "GET";

  if (metodo === "OPTIONS") return responder(respuesta, 204, undefined);

  // --- Auth ----------------------------------------------------------------
  if (ruta.startsWith("/auth/v1/")) {
    if (ruta === "/auth/v1/settings") {
      return responder(respuesta, 200, {
        disable_signup: true,
        signup_enabled: false,
        mailer_autoconfirm: true,
      });
    }

    if (ruta === "/auth/v1/.well-known/jwks.json") {
      return responder(respuesta, 200, { keys: [] });
    }

    if (ruta === "/auth/v1/user" && metodo === "GET") {
      const usuario = usuarioDePeticion(peticion);
      if (!usuario) return responder(respuesta, 401, { message: "Invalid token" });
      return responder(respuesta, 200, usuario);
    }

    if (ruta === "/auth/v1/logout") {
      return responder(respuesta, 204, undefined);
    }

    if (ruta === "/auth/v1/token") {
      const cuerpo = await cuerpoJSON(peticion);
      const grantType = url.searchParams.get("grant_type");

      if (grantType === "password") {
        if (
          String(cuerpo.email ?? "").toLowerCase() === ADMIN_EMAIL &&
          String(cuerpo.password ?? "") === ADMIN_PASSWORD
        ) {
          const token = crearToken(usuarioAdmin);
          return responder(respuesta, 200, {
            access_token: token,
            token_type: "bearer",
            expires_in: 3600,
            expires_at: Math.floor(Date.now() / 1000) + 3600,
            refresh_token: `refresh-${randomUUID()}`,
            user: usuarioAdmin,
          });
        }
        return responder(respuesta, 400, {
          error: "invalid_grant",
          error_description: "Invalid login credentials",
        });
      }

      if (grantType === "refresh_token") {
        const token = crearToken(usuarioAdmin);
        return responder(respuesta, 200, {
          access_token: token,
          token_type: "bearer",
          expires_in: 3600,
          expires_at: Math.floor(Date.now() / 1000) + 3600,
          refresh_token: `refresh-${randomUUID()}`,
          user: usuarioAdmin,
        });
      }
    }

    return responder(respuesta, 404, { message: "Not found" });
  }

  // --- Storage -------------------------------------------------------------
  if (ruta.startsWith("/storage/v1/object/")) {
    const [, , , , bucket, ...resto] = ruta.split("/");
    const camino = resto.join("/");

    if (metodo === "POST" || metodo === "PUT") {
      const usuario = usuarioDePeticion(peticion);
      if (!esAdministrador(usuario)) {
        return responder(respuesta, 403, { message: "new row violates row-level security policy" });
      }
      const trozos = [];
      peticion.on("data", (trozo) => trozos.push(trozo));
      peticion.on("end", () => {
        estado.almacenamiento.set(`${bucket}/${camino}`, Buffer.concat(trozos));
        responder(respuesta, 200, { key: camino, path: camino, bucketId: bucket, id: randomUUID() });
      });
      return;
    }

    if (metodo === "DELETE") {
      const usuario = usuarioDePeticion(peticion);
      if (!esAdministrador(usuario)) {
        return responder(respuesta, 403, { message: "new row violates row-level security policy" });
      }
      estado.almacenamiento.delete(`${bucket}/${camino}`);
      return responder(respuesta, 200, [{ name: camino }]);
    }

    if (metodo === "GET") {
      const datos = estado.almacenamiento.get(`${bucket}/${camino}`);
      if (!datos) return responder(respuesta, 404, { message: "Object not found" });
      respuesta.writeHead(200, {
        "content-type": peticion.headers["content-type"] ?? "application/octet-stream",
        "cache-control": "public, max-age=31536000",
      });
      return respuesta.end(datos);
    }
  }

  if (ruta === "/storage/v1/bucket/thumbnails") {
    return responder(respuesta, 200, {
      id: "thumbnails",
      name: "thumbnails",
      public: true,
      file_size_limit: 5242880,
      allowed_mime_types: ["image/jpeg", "image/png", "image/webp", "image/avif"],
    });
  }

  // --- REST (PostgREST) ----------------------------------------------------
  if (ruta.startsWith("/rest/v1/")) {
    const tabla = ruta.replace("/rest/v1/", "");
    const usuario = usuarioDePeticion(peticion);
    const administrador = esAdministrador(usuario);

    if (!estado[tabla]) {
      return responder(respuesta, 404, { message: `relation "${tabla}" does not exist` });
    }

    // Escrituras: sólo el administrador (RLS).
    if (metodo !== "GET") {
      if (!administrador) {
        return responder(respuesta, 403, {
          code: "42501",
          message: "new row violates row-level security policy",
        });
      }

      const cuerpo = await cuerpoJSON(peticion);

      if (metodo === "POST") {
        const filas = Array.isArray(cuerpo) ? cuerpo : [cuerpo];
        const insertadas = filas.map((fila) => ({
          id: fila.id ?? randomUUID(),
          created_at: ahora(),
          updated_at: ahora(),
          published_at: null,
          ...fila,
        }));
        estado[tabla].push(...insertadas);
        return responder(respuesta, 201, insertadas);
      }

      if (metodo === "PATCH") {
        const id = url.searchParams.get("id")?.replace("eq.", "");
        const filas = estado[tabla].filter((fila) => !id || fila.id === id);
        for (const fila of filas) {
          Object.assign(fila, cuerpo, { updated_at: ahora() });
        }
        return responder(respuesta, 200, filas);
      }

      if (metodo === "DELETE") {
        const id = url.searchParams.get("id")?.replace("eq.", "");
        const conservadas = [];
        const borradas = [];
        for (const fila of estado[tabla]) {
          if (id && fila.id === id) borradas.push(fila);
          else conservadas.push(fila);
        }
        estado[tabla] = conservadas;
        return responder(respuesta, 200, borradas);
      }
    }

    // Lecturas.
    let filas = estado[tabla].map((fila) => ({ ...fila }));

    if (tabla === "videos") {
      filas = filas.filter((fila) => filaVisible(fila, usuario));
    }
    if (tabla === "admins" && !administrador) {
      // Un usuario autenticado sólo puede leer su propia fila.
      const correo = usuario?.email?.toLowerCase();
      filas = filas.filter((fila) => fila.email.toLowerCase() === correo);
    }

    for (const [columna, filtro] of url.searchParams.entries()) {
      if (["select", "order", "limit", "offset", "on_conflict", "columns"].includes(columna)) continue;
      filas = filas.filter((fila) => aplicarFiltro(fila, columna, filtro));
    }

    const total = filas.length;
    filas = ordenar(filas, url.searchParams.get("order"));

    const rango = peticion.headers.range;
    let desde = 0;
    let hasta = total - 1;
    if (rango) {
      const [inicio, fin] = rango.replace("items=", "").split("-");
      desde = Number(inicio) || 0;
      hasta = fin === "" ? total - 1 : Number(fin);
    } else if (url.searchParams.get("offset")) {
      desde = Number(url.searchParams.get("offset"));
      hasta = url.searchParams.get("limit")
        ? desde + Number(url.searchParams.get("limit")) - 1
        : total - 1;
    } else if (url.searchParams.get("limit")) {
      hasta = desde + Number(url.searchParams.get("limit")) - 1;
    }

    const pagina = filas.slice(desde, hasta + 1);
    const contenidoRango = pagina.length === 0 ? `*/${total}` : `${desde}-${desde + pagina.length - 1}/${total}`;

    const aceptaObjeto = (peticion.headers.accept ?? "").includes(
      "application/vnd.pgrst.object+json",
    );

    if (aceptaObjeto) {
      if (pagina.length === 0) {
        return responder(
          respuesta,
          406,
          { code: "PGRST116", details: "Results contain 0 rows", hint: null, message: "Not found" },
          { "content-range": contenidoRango },
        );
      }
      return responder(respuesta, 200, pagina[0], { "content-range": contenidoRango });
    }

    return responder(respuesta, 200, pagina, { "content-range": contenidoRango });
  }

  return responder(respuesta, 404, { message: "Not found" });
});

servidor.listen(PUERTO, "127.0.0.1", () => {
  console.log(`[mock-supabase] escuchando en http://127.0.0.1:${PUERTO}`);
  console.log(`[mock-supabase] clave anónima: ${CLAVE_ANONIMA}`);
  console.log(`[mock-supabase] administrador: ${ADMIN_EMAIL} / ${ADMIN_PASSWORD}`);
});

export { servidor, estado, CLAVE_ANONIMA, ADMIN_EMAIL, ADMIN_PASSWORD };
