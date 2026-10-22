export default function Cargando() {
  return (
    <div className="mx-auto max-w-[86rem] px-5 py-16 md:px-8" aria-busy="true" aria-live="polite">
      <span className="sr-only">Cargando el catálogo…</span>

      <div className="h-3 w-24 rounded-full bg-noche-700 cargando-pulso" />
      <div className="mt-6 h-12 w-3/4 max-w-2xl rounded bg-noche-800 cargando-pulso md:h-16" />

      <div className="mt-16 grid grid-cols-1 gap-x-6 gap-y-12 md:grid-cols-6 lg:grid-cols-12">
        {Array.from({ length: 6 }).map((_, indice) => (
          <div
            key={indice}
            className={`${indice === 0 ? "md:col-span-3 lg:col-span-4" : "md:col-span-3 lg:col-span-2"}`}
          >
            <div className="aspect-video w-full rounded bg-noche-800 cargando-pulso" />
            <div className="mt-4 h-3 w-24 rounded-full bg-noche-800 cargando-pulso" />
            <div className="mt-3 h-6 w-4/5 rounded bg-noche-800 cargando-pulso" />
            <div className="mt-2 h-4 w-full rounded bg-noche-800 cargando-pulso" />
          </div>
        ))}
      </div>
    </div>
  );
}
