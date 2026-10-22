-- ============================================================================
-- NOCTURNA · alta de los temas del curso en instalaciones anteriores
--
-- Si ya habías ejecutado la versión anterior de 0002 (categorías de estilo
-- editorial: Ensayo, Documental, Entrevista…), ejecuta este archivo para
-- añadir los temas del curso de Precálculo.
--
-- Las categorías antiguas no se borran aquí: los videos ya publicados las
-- tienen asignadas. Puedes eliminarlas desde el panel (Estudio → Categorías)
-- cuando no haya ninguna pieza usándolas.
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

-- Comprobación:
-- select name, slug from public.categories order by name;
