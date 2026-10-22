-- ============================================================================
-- NOCTURNA · categorías = temas del curso de Precálculo
--
-- Estas categorías son las que usa el menú de temas de la portada
-- (src/lib/proyecto.ts). Si el catálogo usa otras, edita este archivo y
-- vuelve a ejecutarlo: el script es idempotente.
-- ============================================================================

insert into public.categories (slug, name)
values
  ('algebra', 'Álgebra'),
  ('funciones', 'Funciones'),
  ('exponenciales-y-logaritmos', 'Exponenciales y logaritmos'),
  ('trigonometria', 'Trigonometría'),
  ('geometria-analitica', 'Geometría analítica'),
  ('numeros-complejos', 'Números complejos')
on conflict do nothing;
