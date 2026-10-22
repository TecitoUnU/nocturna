import { describe, it } from "node:test";
import assert from "node:assert/strict";

import {
  escaparPatronLike,
  formatearFecha,
  generarSlug,
  normalizarBusqueda,
  normalizarEtiquetas,
  recortar,
} from "../src/lib/texto";

describe("generarSlug", () => {
  it("convierte títulos en slugs seguros", () => {
    assert.equal(generarSlug("Año del Eclipse"), "ano-del-eclipse");
    assert.equal(generarSlug("  Material  Original  "), "material-original");
    assert.equal(generarSlug("Café & Ruido"), "cafe-ruido");
  });

  it("nunca devuelve una cadena vacía", () => {
    assert.equal(generarSlug("!!!"), "video");
    assert.equal(generarSlug(""), "video");
  });
});

describe("normalizarBusqueda", () => {
  it("normaliza espacios, mayúsculas y acentos", () => {
    assert.equal(normalizarBusqueda("  Año   DEL   eclipse "), "ano del eclipse");
    assert.equal(normalizarBusqueda(null), "");
  });
});

describe("escaparPatronLike", () => {
  it("escapa los comodines de SQL", () => {
    assert.equal(escaparPatronLike("100%"), "100\\%");
    assert.equal(escaparPatronLike("a_b"), "a\\_b");
    assert.equal(escaparPatronLike("c\\d"), "c\\\\d");
  });
});

describe("normalizarEtiquetas", () => {
  it("normaliza, deduplica y limita", () => {
    assert.deepEqual(normalizarEtiquetas("Ensayo, ciudad , ensayo"), ["ensayo", "ciudad"]);
    assert.deepEqual(normalizarEtiquetas(["Uno", "uno"]), ["uno"]);
    assert.equal(normalizarEtiquetas("a,b,c,d,e,f,g,h,i,j,k,l").length, 10);
  });
});

describe("formatearFecha", () => {
  it("escribe la fecha en español", () => {
    assert.equal(formatearFecha("2024-03-12T10:00:00.000Z"), "12 de marzo de 2024");
  });

  it("gestiona valores ausentes o inválidos", () => {
    assert.equal(formatearFecha(null), "Sin fecha");
    assert.equal(formatearFecha("no-es-fecha"), "Sin fecha");
  });
});

describe("recortar", () => {
  it("corta los textos largos", () => {
    assert.equal(recortar("hola", 10), "hola");
    assert.equal(recortar("abcdefghij", 5), "abcd…");
  });
});
