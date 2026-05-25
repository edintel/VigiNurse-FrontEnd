import type { EpisodioHistorial } from "@/features/patients/types";
import { formatDateTime } from "@/features/administration/users/utils/helpers";
import { TRIAGE_MINI } from "./staffHomeConfig";


// Componente para mostrar un episodio en el home del staff
export function PatientEpisodeCard({
  ep,
  onView,
}: {
  ep: EpisodioHistorial;
  onView: () => void;
}) {
  const triage = TRIAGE_MINI[ep.nivelTriage] ?? TRIAGE_MINI[0];

  return (
    <div className="bg-white rounded-xl border border-[#e2e8f0] shadow-sm p-4 hover:shadow-md transition-shadow flex flex-col gap-3">
      {/* Name + button */}
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-bold text-[#0f172a] leading-snug">{ep.pacienteNombre}</p>
        <button
          type="button"
          onClick={onView}
          className="shrink-0 flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold bg-[#09268E] text-white hover:bg-[#1A2B5E] transition cursor-pointer"
        >
          Ver
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="size-3"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2.5}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
          </svg>
        </button>
      </div>

      {/* Razón de visita */}
      {ep.razonVisita && (
        <p className="text-[11px] text-slate-500 leading-snug line-clamp-2">
          <span className="font-semibold text-slate-600">Razón de visita:</span>{" "}
          {ep.razonVisita}
        </p>
      )}

      {/* Details */}
      <div className="space-y-1.5 text-[11px] text-slate-500">
        {/* Triage */}
        <div className="flex items-center gap-2">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="size-3.5 shrink-0"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
            style={{ color: triage.color }}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
          </svg>
          <span className="font-semibold" style={{ color: triage.color }}>
            Nivel de triage:
          </span>
          <span
            className="rounded-full px-1.5 py-0.5 text-[10px] font-bold"
            style={{ background: triage.bg, color: triage.color }}
          >
            {ep.nivelTriage} — {triage.label}
          </span>
        </div>

        {/* Área */}
        <div className="flex items-center gap-2">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="size-3.5 shrink-0 text-slate-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
          </svg>
          <span className="font-semibold text-slate-600">Área:</span>
          <span className="truncate">{ep.areaNombre}</span>
        </div>

        {/* Ingreso */}
        <div className="flex items-center gap-2">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="size-3.5 shrink-0 text-slate-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
          </svg>
          <span className="font-semibold text-slate-600">Ingreso:</span>
          <span>{formatDateTime(ep.fechaAdmision)}</span>
        </div>
      </div>
    </div>
  );
}
