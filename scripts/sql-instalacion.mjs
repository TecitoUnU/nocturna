#!/usr/bin/env node
/**
 * Genera `supabase/instalar-todo.sql`: las tres migraciones concatenadas en
 * el orden correcto, listas para pegar en una sola ejecución del SQL Editor
 * de Supabase.
 *
 * Uso:  npm run sql
 */
import { readFileSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const raiz = resolve(dirname(fileURLToPath(import.meta.url)), "..");

const migraciones = [
  "supabase/migrations/0001_esquema_y_politicas.sql",
  "supabase/migrations/0002_categorias_iniciales.sql",
  "supabase/migrations/0003_temas_del_curso.sql",
];

const cabecera = `-- ============================================================================
-- NOCTURNA · instalación completa en Supabase
--
-- Archivo generado automáticamente (npm run sql) a partir de las migraciones
-- de supabase/migrations/. No lo edites a mano: edita las migraciones y vuelve
-- a generar este archivo.
--
-- CÓMO USARLO
--   1. Supabase → SQL Editor → New query
--   2. Borra el contenido de ejemplo y pega este archivo entero.
--   3. Pulsa Run. Debe terminar sin errores.
--
-- Es idempotente: puedes volver a ejecutarlo sin romper nada.
-- ============================================================================

`;

const cuerpo = migraciones
  .map((ruta) => readFileSync(resolve(raiz, ruta), "utf8").trim())
  .join("\n\n-- ---------------------------------------------------------------------------\n\n");

const salida = resolve(raiz, "supabase/instalar-todo.sql");
writeFileSync(salida, cabecera + cuerpo + "\n", "utf8");

console.log(`Archivo generado: ${salida}`);
console.log("Cópialo y pégalo en Supabase → SQL Editor → New query → Run.");
