import { type RecetaDisplayItem } from "@/features/patients/components/episodios/RecetaAltaModal";


// Componente para mostrar la sección de receta de alta en el resumen del episodio. 
// Permite visualizar los medicamentos recetados y acceder a la edición/agregación de la receta.
export function RecetaAltaSection({
  recetaItems,
  submitting,
  onOpenReceta,
}: {
  recetaItems: RecetaDisplayItem[] | null;
  submitting: boolean;
  onOpenReceta: () => void;
}) {
  return (
    <div className="mx-6 mt-5">
      <div className="flex items-center justify-between mb-2">
        <p className="text-[11px] font-bold uppercase tracking-[0.5px] text-[#64748b]">
          Receta de alta
        </p>
        <button
          type="button"
          className="btn btn-xs btn-ghost text-[#09268E] hover:bg-[#f0f4ff]"
          onClick={onOpenReceta}
          disabled={submitting}
        >
          {recetaItems ? "Editar receta" : "Agregar receta"}
        </button>
      </div>

      {recetaItems ? (
        <div className="rounded-lg border border-[#e2e8f0] overflow-hidden">
          <div className="px-4 py-2 bg-[#f8fafc] border-b border-[#e2e8f0]">
            <span className="text-[10px] font-bold uppercase tracking-[0.5px] text-[#64748b]">
              {recetaItems.length} medicamento{recetaItems.length !== 1 ? "s" : ""} recetado{recetaItems.length !== 1 ? "s" : ""}
            </span>
          </div>
          <div className="divide-y divide-[#f1f5f9]">
            {recetaItems.map((item, idx) => (
              <div key={idx} className="px-4 py-2.5 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-[#0f172a] truncate">
                    {item.medicamentoLabel}
                  </p>
                  <p className="text-xs text-[#64748b] mt-0.5">
                    {item.dosis} · {item.frecuencia} · {item.duracion}
                  </p>
                  {item.instrucciones && (
                    <p className="text-xs text-[#94a3b8] mt-0.5 italic">{item.instrucciones}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="rounded-lg border border-dashed border-[#e2e8f0] px-4 py-3 text-center">
          <p className="text-xs text-[#94a3b8]">
            Sin receta de alta. Opcional — puede agregarse antes de finalizar.
          </p>
        </div>
      )}
    </div>
  );
}
