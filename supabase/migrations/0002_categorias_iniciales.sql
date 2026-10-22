-- ============================================================================
-- NOCTURNA · categorías iniciales
--
-- Edita la lista según tu criterio editorial. Si ya existe una categoría con
-- ese nombre, no se inserta de nuevo (el script es idempotente).
-- ============================================================================

insert into public.categories (slug, name)
values
  ('ensayo', 'Ensayo'),
  ('documental', 'Documental'),
  ('entrevista', 'Entrevista'),
  ('recital', 'Recital'),
  ('archivo', 'Archivo'),
  ('experimental', 'Experimental')
on conflict (slug) do nothing;
