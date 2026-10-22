import { describe, it } from "node:test";
import assert from "node:assert/strict";

import {
  analizarEntradaYouTube,
  construirUrlEmbed,
  esIdYouTubeValido,
  candidatasMiniaturaYouTube,
} from "../src/lib/youtube";

const ID = "dQw4w9WgXcQ";

describe("analizarEntradaYouTube", () => {
  it("acepta un identificador desnudo", () => {
    const resultado = analizarEntradaYouTube(ID);
    assert.equal(resultado.ok, true);
    if (resultado.ok) assert.equal(resultado.id, ID);
  });

  it("acepta los formatos de URL habituales de YouTube", () => {
    const entradas = [
      `https://www.youtube.com/watch?v=${ID}`,
      `https://youtube.com/watch?v=${ID}`,
      `https://m.youtube.com/watch?v=${ID}`,
      `https://music.youtube.com/watch?v=${ID}`,
      `https://www.youtube.com/watch?v=${ID}&t=42s`,
      `https://youtu.be/${ID}`,
      `https://youtu.be/${ID}?t=42`,
      `https://www.youtube.com/embed/${ID}`,
      `https://www.youtube-nocookie.com/embed/${ID}`,
      `https://www.youtube.com/shorts/${ID}`,
      `https://www.youtube.com/live/${ID}`,
      `https://www.youtube.com/v/${ID}`,
    ];

    for (const entrada of entradas) {
      const resultado = analizarEntradaYouTube(entrada);
      assert.equal(resultado.ok, true, `debería aceptar ${entrada}`);
      if (resultado.ok) assert.equal(resultado.id, ID);
    }
  });

  it("rechaza dominios que no son de YouTube", () => {
    const entradas = [
      "https://vimeo.com/123456789",
      "https://example.com/watch?v=dQw4w9WgXcQ",
      "https://youtube.com.evil.example/watch?v=dQw4w9WgXcQ",
      "https://miportal.example/embed/dQw4w9WgXcQ",
    ];

    for (const entrada of entradas) {
      const resultado = analizarEntradaYouTube(entrada);
      assert.equal(resultado.ok, false, `debería rechazar ${entrada}`);
    }
  });

  it("rechaza entradas malformadas o peligrosas", () => {
    const entradas = [
      "",
      "   ",
      "no soy un enlace",
      "javascript:alert(1)",
      "<script>alert(1)</script>",
      "https://www.youtube.com/watch?v=short",
      "https://www.youtube.com/watch?v=dQw4w9WgXcQEXTRA",
      "https://www.youtube.com/",
      "https://www.youtube.com/playlist?list=PL123",
      "ftp://www.youtube.com/watch?v=dQw4w9WgXcQ",
    ];

    for (const entrada of entradas) {
      const resultado = analizarEntradaYouTube(entrada);
      assert.equal(resultado.ok, false, `debería rechazar ${entrada}`);
    }
  });

  it("explica el motivo del rechazo", () => {
    const resultado = analizarEntradaYouTube("https://vimeo.com/123456789");
    assert.equal(resultado.ok, false);
    if (!resultado.ok) assert.match(resultado.error, /youtube/i);
  });
});

describe("esIdYouTubeValido", () => {
  it("acepta identificadores de 11 caracteres", () => {
    assert.equal(esIdYouTubeValido(ID), true);
    assert.equal(esIdYouTubeValido("a_-A1234567"), true);
  });

  it("rechaza identificadores con longitud incorrecta o caracteres inválidos", () => {
    assert.equal(esIdYouTubeValido("corto"), false);
    assert.equal(esIdYouTubeValido("dQw4w9WgXcQ1"), false);
    assert.equal(esIdYouTubeValido("dQw4w9WgXc!"), false);
    assert.equal(esIdYouTubeValido(null), false);
    assert.equal(esIdYouTubeValido(undefined), false);
  });
});

describe("construirUrlEmbed", () => {
  it("usa el dominio oficial de inserción", () => {
    const url = construirUrlEmbed(ID);
    assert.match(url, /^https:\/\/www\.youtube-nocookie\.com\/embed\/dQw4w9WgXcQ/);
    assert.ok(!url.includes("javascript"));
  });

  it("lanza un error si el identificador no es válido", () => {
    assert.throws(() => construirUrlEmbed("no-valido"));
  });
});

describe("candidatasMiniaturaYouTube", () => {
  it("ofrece alternativas de mayor a menor resolución", () => {
    const candidatas = candidatasMiniaturaYouTube(ID);
    assert.equal(candidatas.length, 3);
    assert.match(candidatas[0], /maxresdefault\.jpg$/);
    assert.match(candidatas[2], /mqdefault\.jpg$/);
  });

  it("no devuelve nada para un identificador inválido", () => {
    assert.deepEqual(candidatasMiniaturaYouTube("corto"), []);
  });
});
