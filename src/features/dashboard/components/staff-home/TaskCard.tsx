import type { AsignacionTarea, Tarea } from "@/features/staff-monitoring/types";
import { PrioridadBadge } from "@/features/staff-monitoring/components/tareas/taskHelpers";
import { formatDateTime } from "@/features/administration/users/utils/helpers";
import { PRIORITY_BORDER } from "./staffHomeConfig";


// Componente para mostrar una tarea asignada en el dashboard del staff
export function TaskCard({
  tarea,
  asignacion,
  onViewDetail,
  onRequestComplete,
  completing,
}: {
  tarea: Tarea;
  asignacion: AsignacionTarea;
  onViewDetail: () => void;
  onRequestComplete: () => void;
  completing: boolean;
}) {
  const border = PRIORITY_BORDER[tarea.prioridad] ?? "#10b981";

  return (
    <div
      className="bg-white rounded-xl border border-[#e2e8f0] shadow-sm flex flex-col overflow-hidden transition-shadow hover:shadow-md"
      style={{ borderLeft: `3px solid ${border}` }}
    >
      <div className="px-4 pt-4 pb-3 flex-1 space-y-2.5">
        <div className="flex items-start justify-between gap-2">
          <span
            className="text-[10px] font-bold uppercase tracking-widest truncate"
            style={{ color: border }}
          >
            {tarea.nombreTipoTarea}
          </span>
          <PrioridadBadge prioridad={tarea.prioridad} />
        </div>
        <p className="text-sm font-medium text-[#0f172a] line-clamp-2 leading-snug">
          {tarea.descripcion}
        </p>
        <div className="space-y-1">
          <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="size-3 shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
            </svg>
            <span className="font-medium text-slate-700 truncate">{tarea.nombreArea}</span>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="size-3 shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
            </svg>
            <span>{formatDateTime(asignacion.fechaAsignacion)}</span>
          </div>
        </div>
      </div>
      <div className="px-4 py-2.5 bg-[#f8fafc] border-t border-[#f1f5f9] flex items-center justify-end gap-2">
        <button
          type="button"
          onClick={onViewDetail}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold border border-[#e2e8f0] bg-white text-slate-600 hover:bg-slate-50 transition cursor-pointer"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="size-3.5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.641 0-8.573-3.007-9.963-7.178Z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
          </svg>
          Ver detalle
        </button>
        <button
          type="button"
          disabled={completing}
          onClick={onRequestComplete}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {completing ? (
            <span className="loading loading-spinner loading-xs" />
          ) : (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="size-3.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.5}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
            </svg>
          )}
          Completar
        </button>
      </div>
    </div>
  );
}
