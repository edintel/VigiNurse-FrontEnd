import {
  TRIAGE_CONFIG,
  TIPO_EPISODIO_LABELS,
  ESTADO_EPISODIO_CONFIG,
  EpisodioEstado,
  type EpisodioHistorial,
} from "@/features/patients/types";

interface EpisodeInfoCardProps {
  episodio: EpisodioHistorial;
  onAssignDoctor?: (mode: "principal" | "actual") => void;
}

// Componente para mostrar la información principal de un episodio en formato tarjeta
export function EpisodeInfoCard({ episodio, onAssignDoctor }: EpisodeInfoCardProps) {
  const triageCfg = TRIAGE_CONFIG[episodio.nivelTriage];

  const fechaAdmision = new Date(episodio.fechaAdmision).toLocaleString("es-ES", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const estadoCfg =
    ESTADO_EPISODIO_CONFIG[episodio.estado] ??
    ESTADO_EPISODIO_CONFIG[EpisodioEstado.Pendiente];

  return (
    <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm overflow-hidden">
      <div className="px-5 py-3.5 border-b border-[#f1f5f9] bg-[#F8FAFC]/50 flex items-center gap-2">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth="1.8"
          stroke="#64748b"
          className="size-4 flex-shrink-0"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M11.35 3.836c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25ZM6.75 12h.008v.008H6.75V12Zm0 3h.008v.008H6.75V15Zm0 3h.008v.008H6.75V18Z"
          />
        </svg>
        <span className="text-xs font-bold uppercase tracking-[0.6px] text-[#64748b]">
          Información del episodio
        </span>
      </div>
      <div className="divide-y divide-[#f1f5f9]">
        {/* Fila 1: Tipo | Motivo | Prioridad | Estado */}
        <div className="p-5 grid grid-cols-2 sm:grid-cols-4 gap-x-6 gap-y-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.4px] text-[#94a3b8] mb-1">
              Tipo de episodio
            </p>
            <p className="text-sm font-semibold text-[#1e293b]">
              {TIPO_EPISODIO_LABELS[episodio.tipo] ?? String(episodio.tipo)}
            </p>
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.4px] text-[#94a3b8] mb-1">
              Motivo de consulta
            </p>
            <p className="text-sm font-semibold text-[#1e293b]">
              {episodio.razonVisita}
            </p>
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.4px] text-[#94a3b8] mb-1">
              Nivel de prioridad
            </p>
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold uppercase border ${triageCfg.bgCls} ${triageCfg.borderCls} ${triageCfg.textCls}`}
            >
              {episodio.nivelTriage} — {triageCfg.label}
            </span>
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.4px] text-[#94a3b8] mb-1">
              Estado
            </p>
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${estadoCfg.bgCls} ${estadoCfg.borderCls} ${estadoCfg.textCls}`}
            >
              {estadoCfg.label}
            </span>
          </div>
        </div>

        {/* Fila 2: Área | Admitido por | Hospital | Fecha/Hora de ingreso */}
        <div className="p-5 grid grid-cols-2 sm:grid-cols-4 gap-x-6 gap-y-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.4px] text-[#94a3b8] mb-1">
              Área
            </p>
            <p className="text-sm font-semibold text-[#1e293b]">{episodio.areaNombre}</p>
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.4px] text-[#94a3b8] mb-1">
              Admitido por
            </p>
            <p className="text-sm font-semibold text-[#1e293b]">
              {episodio.admitidoPorNombre}
            </p>
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.4px] text-[#94a3b8] mb-1">
              Hospital
            </p>
            <p className="text-sm font-semibold text-[#1e293b]">{episodio.hospitalNombre}</p>
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.4px] text-[#94a3b8] mb-1">
              Fecha/Hora de ingreso
            </p>
            <p className="text-sm font-semibold text-[#1e293b]">{fechaAdmision}</p>
          </div>
        </div>

        {/* Fila 3: Equipo médico */}
        <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
          {/* Médico principal */}
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.4px] text-[#94a3b8] mb-1">
                Médico principal
              </p>
              <p className={`text-sm font-semibold ${episodio.medicoPrincipalNombre ? "text-[#1e293b]" : "text-[#94a3b8] italic"}`}>
                {episodio.medicoPrincipalNombre ?? "Sin asignar"}
              </p>
            </div>
            {onAssignDoctor && episodio.estado === EpisodioEstado.EnCurso && (
              <button
                type="button"
                onClick={() => onAssignDoctor("principal")}
                className="btn btn-xs btn-outline border-[#09268E] text-[#09268E] hover:bg-[#09268E] hover:text-white shrink-0 mt-0.5"
              >
                {episodio.medicoPrincipalId ? "Cambiar" : "Asignar"}
              </button>
            )}
          </div>

          {/* Médico actual */}
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.4px] text-[#94a3b8] mb-1">
                Médico en atención
              </p>
              <p className={`text-sm font-semibold ${episodio.medicoActualNombre ? "text-[#1e293b]" : "text-[#94a3b8] italic"}`}>
                {episodio.medicoActualNombre ?? "Sin asignar"}
              </p>
            </div>
            {onAssignDoctor && episodio.estado === EpisodioEstado.EnCurso && (
              <button
                type="button"
                onClick={() => onAssignDoctor("actual")}
                className="btn btn-xs btn-outline border-[#09268E] text-[#09268E] hover:bg-[#09268E] hover:text-white shrink-0 mt-0.5"
              >
                {episodio.medicoActualId ? "Cambiar" : "Asignar"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
