#!/usr/bin/env node
/**
 * Valida las migraciones SQL contra un PostgreSQL real (PGlite, compilado a
 * WASM) antes de pegarlas en el panel de Supabase.
 *
 * Comprueba que:
 *   · el esquema y las funciones se crean sin errores de sintaxis;
 *   · las políticas RLS se crean y se pueden listar;
 *   · la columna generada y el índice funcionan;
 *   · `is_admin()` responde false sin sesión y true con el claims de un
 *     administrador simulado;
 *   · un anónimo sólo ve los videos publicados y no puede escribir.
 *
 * Uso:  npm run sql:validar
 */
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { PGlite } from "@electric-sql/pglite";
import { pg_trgm } from "@electric-sql/pglite/contrib/pg_trgm";
import { pgcrypto } from "@electric-sql/pglite/contrib/pgcrypto";

const raiz = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const db = new PGlite({ extensions: { pg_trgm, pgcrypto } });

const comprobar = [];
function anotar(ok, titulo, detalle = "") {
  comprobar.push({ ok, titulo });
  console.log(`${ok ? "✔" : "✘"} ${titulo}${detalle ? ` — ${detalle}` : ""}`);
}

// --- Estructura mínima que Supabase ya trae ---------------------------------
await db.exec(`
  create role anon nologin noinherit;
  create role authenticated nologin noinherit;
  create role service_role nologin noinherit bypassrls;
  create schema if not exists extensions;
  create schema if not exists auth;
  create schema if not exists storage;
  create table if not exists auth.users (id uuid primary key default gen_random_uuid());
  create table if not exists storage.buckets (
    id text primary key,
    name text not null,
    public boolean default false,
    file_size_limit bigint,
    allowed_mime_types text[]
  );
  create table if not exists storage.objects (
    id uuid primary key default gen_random_uuid(),
    bucket_id text,
    name text
  );
`);

// Se simula auth.jwt() con las claims que Supabase inyecta por petición.
await db.exec(`
  create or replace function auth.jwt() returns jsonb language sql stable as $$
    select coalesce(
      nullif(current_setting('request.jwt.claims', true), '')::jsonb,
      '{}'::jsonb
    )
  $$;
`);

// --- Migraciones -------------------------------------------------------------
const migraciones = [
  "supabase/migrations/0001_esquema_y_politicas.sql",
  "supabase/migrations/0002_categorias_iniciales.sql",
  "supabase/migrations/0003_temas_del_curso.sql",
];

for (const ruta of migraciones) {
  const sql = readFileSync(resolve(raiz, ruta), "utf8");
  try {
    await db.exec(sql);
    anotar(true, `Se aplica ${ruta.split("/").pop()}`);
  } catch (error) {
    anotar(false, `Falla ${ruta.split("/").pop()}`, error.message);
    console.error(error);
    process.exit(1);
  }
}

// --- Comprobaciones ----------------------------------------------------------
const contar = async (sql) => (await db.query(sql)).rows[0].count;

anotar(
  (await contar("select count(*) from public.categories")) === 10,
  "Se crean las 10 categorías (temas del curso)",
  `${await contar("select count(*) from public.categories")} categorías`,
);

anotar(
  (await contar(
    "select count(*) from pg_policies where schemaname = 'public'",
  )) === 5,
  "Se crean las políticas RLS de las tablas públicas",
  `${await contar("select count(*) from pg_policies where schemaname = 'public'")} políticas`,
);

anotar(
  (await contar(
    "select count(*) from pg_policies where schemaname = 'storage'",
  )) === 4,
  "Se crean las políticas de Storage",
  `${await contar("select count(*) from pg_policies where schemaname = 'storage'")} políticas`,
);

anotar(
  (await contar("select count(*) from storage.buckets where id = 'thumbnails'")) === 1,
  "Se crea el bucket 'thumbnails'",
);

// Columna generada e índice de trigramas.
await db.exec(`
  insert into public.videos (youtube_video_id, title, slug, status)
  values ('aaaaaaaaaaa', 'Función Cuadrática', 'funcion-cuadratica', 'published'),
         ('bbbbbbbbbbb', 'Borrador del grupo', 'borrador', 'draft');
`);
anotar(
  (await db.query("select title_search from public.videos where slug = 'funcion-cuadratica'"))
    .rows[0].title_search === "funcion cuadratica",
  "La columna generated normaliza el título (sin acentos, en minúsculas)",
  (await db.query("select title_search from public.videos where slug = 'funcion-cuadratica'")).rows[0]
    .title_search,
);

// El administrador se registra en `admins` (lo que hace el usuario desde el
// panel de Supabase con la sentencia documentada).
await db.exec("insert into public.admins (email) values ('admin@nocturna.test')");

// is_admin() sin sesión y con claims de administrador.
await db.exec("select set_config('request.jwt.claims', '{\"email\":\"admin@nocturna.test\"}', false)");
anotar(
  (await db.query("select public.is_admin() as r")).rows[0].r === true,
  "is_admin() reconoce al administrador autenticado",
);

await db.exec("select set_config('request.jwt.claims', '{\"email\":\"otro@ejemplo.com\"}', false)");
anotar(
  (await db.query("select public.is_admin() as r")).rows[0].r === false,
  "is_admin() rechaza a un usuario no autorizado",
);

await db.exec("select set_config('request.jwt.claims', '{}', false)");
anotar(
  (await db.query("select public.is_admin() as r")).rows[0].r === false,
  "is_admin() es false sin sesión",
);

// RLS: el anónimo sólo ve lo publicado.
await db.exec("set role anon");
const vistasAnonimo = await db.query("select status from public.videos");
anotar(
  vistasAnonimo.rows.length === 1 && vistasAnonimo.rows[0].status === "published",
  "Un anónimo sólo lee los videos publicados",
  `${vistasAnonimo.rows.length} fila(s)`,
);

let escrituraBloqueada = false;
try {
  await db.exec(
    "insert into public.videos (youtube_video_id, title, slug) values ('ccccccccccc','Hack','hack')",
  );
} catch {
  escrituraBloqueada = true;
}
anotar(
  escrituraBloqueada,
  "Un anónimo no puede escribir (RLS bloquea el INSERT)",
);
await db.exec("reset role");

// El administrador ve también los borradores.
await db.exec("select set_config('request.jwt.claims', '{\"email\":\"admin@nocturna.test\"}', false)");
await db.exec("set role authenticated");
const vistasAdmin = await db.query("select status from public.videos");
anotar(
  vistasAdmin.rows.length === 2,
  "El administrador ve los borradores",
  `${vistasAdmin.rows.length} fila(s)`,
);
await db.exec("reset role");

const fallos = comprobar.filter((c) => !c.ok).length;
console.log(`\n${comprobar.length - fallos}/${comprobar.length} comprobaciones correctas.`);
process.exit(fallos === 0 ? 0 : 1);
