export default function CargandoEstudio() {
  return (
    <div className="mx-auto max-w-3xl" aria-busy="true">
      <span className="sr-only">Cargando el estudio…</span>
      <div className="h-3 w-40 rounded-full bg-noche-800 cargando-pulso" />
      <div className="mt-6 h-12 w-2/3 rounded bg-noche-800 cargando-pulso" />
      <div className="mt-10 h-64 w-full rounded bg-noche-800 cargando-pulso" />
    </div>
  );
}
