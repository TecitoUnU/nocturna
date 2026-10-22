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
  ('algebra', 'Álgebra'),
  ('funciones', 'Funciones'),
  ('exponenciales-y-logaritmos', 'Exponenciales y logaritmos'),
  ('trigonometria', 'Trigonometría'),
  ('geometria-analitica', 'Geometría analítica'),
  ('numeros-complejos', 'Números complejos')
on conflict do nothing;

-- Comprobación:
-- select name, slug from public.categories order by name;
