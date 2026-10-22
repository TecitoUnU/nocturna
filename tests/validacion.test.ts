import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { validarMetadatosVideo, validarUrlMiniatura } from "../src/lib/validacion";

describe("validarUrlMiniatura", () => {
  it("admite las miniaturas de YouTube", () => {
    const resultado = validarUrlMiniatura("https://i.ytimg.com/vi/dQw4w9WgXcQ/maxresdefault.jpg");
    assert.equal(resultado.ok, true);
  });

  it("admite el almacenamiento del propio proyecto", () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://abcxyz.supabase.co";
    const resultado = validarUrlMiniatura(
      "https://abcxyz.supabase.co/storage/v1/object/public/thumbnails/miniaturas/una.png",
    );
    assert.equal(resultado.ok, true);
  });

  it("rechaza protocolos peligrosos", () => {
    assert.equal(validarUrlMiniatura("javascript:alert(1)").ok, false);
    assert.equal(validarUrlMiniatura("data:image/svg+xml;base64,PHN2Zz4=").ok, false);
    assert.equal(validarUrlMiniatura("http://i.ytimg.com/vi/x/maxresdefault.jpg").ok, false);
  });

  it("rechaza dominios desconocidos", () => {
    assert.equal(validarUrlMiniatura("https://sitio-inesperado.example/imagen.png").ok, false);
  });

  it("rechaza credenciales dentro de la URL", () => {
    assert.equal(validarUrlMiniatura("https://usuario:clave@i.ytimg.com/vi/x.jpg").ok, false);
  });
});

describe("validarMetadatosVideo", () => {
  const base = {
    youtube: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    titulo: "Un título razonable",
    descripcion: "Descripción",
    categoria: "Ensayo",
    etiquetas: "ensayo, prueba",
    estado: "published",
    destacado: false,
  };

  it("acepta unos metadatos correctos", () => {
    const resultado = validarMetadatosVideo(base);
    assert.equal(resultado.ok, true);
    if (resultado.ok) {
      assert.equal(resultado.valor.youtubeVideoId, "dQw4w9WgXcQ");
      assert.equal(resultado.valor.estado, "published");
      assert.deepEqual(resultado.valor.etiquetas, ["ensayo", "prueba"]);
    }
  });

  it("devuelve errores por campo", () => {
    const resultado = validarMetadatosVideo({
      ...base,
      youtube: "https://vimeo.com/1234",
      titulo: "a",
    });
    assert.equal(resultado.ok, false);
    if (!resultado.ok) {
      assert.ok(resultado.errores.youtube);
      assert.ok(resultado.errores.titulo);
    }
  });

  it("exige categoría para publicar", () => {
    const resultado = validarMetadatosVideo({ ...base, categoria: "" });
    assert.equal(resultado.ok, false);
    if (!resultado.ok) assert.ok(resultado.errores.categoria);
  });

  it("permite guardar borradores sin categoría", () => {
    const resultado = validarMetadatosVideo({ ...base, categoria: "", estado: "draft" });
    assert.equal(resultado.ok, true);
  });

  it("normaliza el estado a los valores permitidos", () => {
    const resultado = validarMetadatosVideo({ ...base, estado: "loquesea" });
    assert.equal(resultado.ok, true);
    if (resultado.ok) assert.equal(resultado.valor.estado, "draft");
  });
});
