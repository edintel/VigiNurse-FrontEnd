import {
  TRIAGE_CONFIG,
  TIPO_EPISODIO_LABELS,
  type EpisodioHistorial,
} from "@/features/patients/types";


// Componente que muestra un resumen del episodio actual, incluyendo tipo, fecha de admisión, área, admitido por y nivel de triage.
export function EpisodeSummarySection({ episodio }: { episodio: EpisodioHistorial }) {
  const triageCfg = TRIAGE_CONFIG[episodio.nivelTriage];

  const fechaAdmision = new Date(episodio.fechaAdmision).toLocaleString("es-ES", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="mx-6 mt-4 rounded-lg border border-[#E2E8F0] overflow-hidden">
      <div className="px-4 py-2.5 bg-[#F8FAFC] border-b border-[#E2E8F0]">
        <span className="text-[11px] font-bold uppercase tracking-[0.5px] text-[#64748b]">
          Resumen del episodio
        </span>
      </div>
      <div className="grid grid-cols-2 gap-px bg-[#E2E8F0]">
        {[
          {
            label: "Tipo",
            value: TIPO_EPISODIO_LABELS[episodio.tipo] ?? String(episodio.tipo),
          },
          { label: "Ingreso", value: fechaAdmision },
          { label: "Área", value: episodio.areaNombre },
          { label: "Admitido por", value: episodio.admitidoPorNombre },
        ].map(({ label, value }) => (
          <div key={label} className="bg-white px-4 py-3">
            <p className="text-[10px] font-bold uppercase tracking-[0.4px] text-[#94a3b8] mb-0.5">
              {label}
            </p>
            <p className="text-sm font-semibold text-[#1e293b]">{value}</p>
          </div>
        ))}
      </div>
      <div className="bg-white border-t border-[#E2E8F0] px-4 py-2.5 flex items-center gap-2">
        <span className="text-[10px] font-bold uppercase tracking-[0.4px] text-[#94a3b8]">
          Triage:
        </span>
        <span
          className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${triageCfg.bgCls} ${triageCfg.borderCls} ${triageCfg.textCls}`}
        >
          {triageCfg.label}
        </span>
      </div>
    </div>
  );
}
