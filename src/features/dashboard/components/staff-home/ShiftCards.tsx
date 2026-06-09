import type { TurnoPersonal } from "@/features/staff-monitoring/types";
import {
  fmtShiftDate,
  fmtShiftTime,
  isTodayIso,
} from "@/features/dashboard/utils/staffHomeUtils";


// Tarjeta para mostrar el turno actual o próximo en formato compacto, ideal para la sección superior del dashboard.
export function ShiftInfoCard({
  current,
  next,
  loadingTurnos,
}: {
  current: TurnoPersonal | null;
  next: TurnoPersonal | null;
  loadingTurnos: boolean;
}) {
  if (loadingTurnos) {
    return <div className="h-[68px] bg-[#f1f5f9] rounded-xl animate-pulse" />;
  }
  const turno = current ?? next;
  if (!turno) {
    return (
      <div className="bg-[#f8fafc] rounded-xl border border-[#e2e8f0] px-4 py-3 flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="size-4 text-slate-300"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
          </svg>
        </div>
        <div>
          <p className="text-xs font-semibold text-slate-400">Sin turnos próximos</p>
          <p className="text-[10px] text-slate-300 mt-0.5">No hay turnos en los próximos días.</p>
        </div>
      </div>
    );
  }
  const isCurrent = !!current;
  return (
    <div
      className={`bg-[#f8fafc] rounded-xl border px-4 py-3 flex items-center gap-3 ${
        isCurrent ? "border-emerald-200" : "border-[#e2e8f0]"
      }`}
    >
      <div
        className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
          isCurrent ? "bg-emerald-100" : "bg-blue-100"
        }`}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className={`size-4 ${isCurrent ? "text-emerald-700" : "text-[#09268E]"}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
        </svg>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 mb-0.5">
          <span
            className={`text-[9px] font-bold rounded-full px-1.5 py-0.5 ${
              isCurrent ? "bg-emerald-100 text-emerald-700" : "bg-blue-100 text-[#09268E]"
            }`}
          >
            {isCurrent ? "En curso" : "Próximo"}
          </span>
          {!isTodayIso(turno.fechaInicio) && (
            <span className="text-[10px] text-slate-400 truncate capitalize">
              {fmtShiftDate(turno.fechaInicio)}
            </span>
          )}
        </div>
        <p className="text-sm font-extrabold text-[#0f172a] leading-tight">
          {fmtShiftTime(turno)}
        </p>
        <p className="text-[10px] text-slate-400 truncate">{turno.nombreArea}</p>
      </div>
    </div>
  );
}

export function FullShiftCard({
  current,
  next,
}: {
  current: TurnoPersonal | null;
  next: TurnoPersonal | null;
}) {
  const turno = current ?? next;
  if (!turno) return null;
  const isCurrent = !!current;

  return (
    <div
      className={`rounded-xl border p-5 flex items-start gap-4 ${
        isCurrent
          ? "bg-emerald-50/40 border-emerald-200"
          : "bg-white border-[#e2e8f0] shadow-sm"
      }`}
    >
      <div
        className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
          isCurrent ? "bg-emerald-100" : "bg-blue-100"
        }`}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className={`size-6 ${isCurrent ? "text-emerald-700" : "text-[#09268E]"}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
        </svg>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span
            className={`text-[10px] font-bold rounded-full px-2.5 py-0.5 uppercase tracking-wide ${
              isCurrent ? "bg-emerald-500 text-white" : "bg-[#09268E] text-white"
            }`}
          >
            {isCurrent ? "Turno en curso" : "Próximo turno"}
          </span>
          {!isTodayIso(turno.fechaInicio) && (
            <span className="text-xs text-slate-500 capitalize">
              {fmtShiftDate(turno.fechaInicio)}
            </span>
          )}
        </div>
        <p className="text-2xl font-extrabold text-[#0f172a] leading-tight mb-1">
          {fmtShiftTime(turno)}
        </p>
        <p className="text-sm text-slate-600 font-medium">{turno.nombreArea}</p>
        {turno.nombrePlantilla && (
          <p className="text-xs text-slate-400 mt-0.5">{turno.nombrePlantilla}</p>
        )}
      </div>
    </div>
  );
}
