-- ============================================================================
-- NOCTURNA · categorías = temas del curso de Precálculo
--
-- Estas categorías son las que usa el menú de temas de la portada
-- (src/lib/proyecto.ts). Si el catálogo usa otras, edita este archivo y
-- vuelve a ejecutarlo: el script es idempotente.
-- ============================================================================

insert into public.categories (slug, name)
values
  ('exponentes-y-radicales', 'Exponentes y radicales'),
  ('expresiones-racionales', 'Expresiones racionales'),
  ('ecuaciones', 'Ecuaciones'),
  ('modelado-con-ecuaciones', 'Modelado con ecuaciones'),
  ('geometria-de-coordenadas', 'Geometría de coordenadas'),
  ('rectas', 'Rectas'),
  ('funciones', 'Funciones'),
  ('analisis-de-funciones', 'Análisis de funciones'),
  ('funciones-cuadraticas', 'Funciones cuadráticas'),
  ('funciones-polinomiales-y-ceros-reales', 'Funciones polinomiales y ceros reales')
on conflict do nothing;
