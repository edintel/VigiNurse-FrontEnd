import Link from "next/link";
import type { Mantenimiento } from "@/features/assets-managment/maintenance/types";
import {
  getStatusColor,
  groupByDate,
} from "@/features/assets-managment/maintenance/utils/calendarHelpers";

const MONTH_NAMES = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];

const DAY_NAMES = ["Lu", "Ma", "Mi", "Ju", "Vi", "Sa", "Do"];

const now = new Date();

interface CalendarWidgetProps {
  data: Mantenimiento[];
  loading: boolean;
  year: number;
  month: number;
  onMonthChange: (year: number, month: number) => void;
  tipoActivoMap: Record<number, string>;
}

// Calendario mensual que muestra los mantenimientos programados para cada día. Permite navegar entre meses y años, y al hacer hover sobre un día con mantenimientos, muestra un tooltip con los detalles de cada mantenimiento programado para ese día.
export function CalendarWidget({
  data,
  loading,
  year,
  month,
  onMonthChange,
  tipoActivoMap,
}: CalendarWidgetProps) {
  const byDate = groupByDate(data);
  const firstDay = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startOffset = (firstDay.getDay() + 6) % 7;
  const totalRows = Math.ceil((startOffset + daysInMonth) / 7);

  function prevMonth() {
    if (month === 0) {
      onMonthChange(year - 1, 11);
      return;
    }
    onMonthChange(year, month - 1);
  }

  function nextMonth() {
    if (month === 11) {
      onMonthChange(year + 1, 0);
      return;
    }
    onMonthChange(year, month + 1);
  }

  return (
    <div className="bg-white border border-[#E2E8F0] rounded-xl shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#F1F5F9]">
        <button
          type="button"
          className="btn btn-ghost btn-sm btn-square text-slate-500"
          onClick={prevMonth}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth="2.5"
            stroke="currentColor"
            className="size-4"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15.75 19.5 8.25 12l7.5-7.5"
            />
          </svg>
        </button>

        <div className="flex items-center gap-3">
          <select
            className="select select-ghost select-sm font-bold text-[#1A2B5E] focus:outline-none w-[130px]"
            value={month}
            onChange={(e) => onMonthChange(year, Number(e.target.value))}
          >
            {MONTH_NAMES.map((name, i) => (
              <option key={i} value={i}>
                {name}
              </option>
            ))}
          </select>
          <select
            className="select select-ghost select-sm font-bold text-[#1A2B5E] focus:outline-none w-[105px] !pr-10"
            value={year}
            onChange={(e) => onMonthChange(Number(e.target.value), month)}
          >
            {Array.from({ length: 2050 - 1980 + 1 }, (_, i) => 1980 + i).map(
              (y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ),
            )}
          </select>
        </div>

        <button
          type="button"
          className="btn btn-ghost btn-sm btn-square text-slate-500"
          onClick={nextMonth}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth="2.5"
            stroke="currentColor"
            className="size-4"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="m8.25 4.5 7.5 7.5-7.5 7.5"
            />
          </svg>
        </button>
      </div>

      <div className="grid grid-cols-7 px-4 pt-4 pb-2">
        {DAY_NAMES.map((d) => (
          <div
            key={d}
            className="text-center text-xs font-bold text-slate-400 uppercase pb-1"
          >
            {d}
          </div>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <span className="loading loading-spinner loading-sm text-[#09268E]" />
        </div>
      ) : (
        <div className="grid grid-cols-7 px-4 pb-4 gap-1">
          {Array.from({ length: totalRows * 7 }).map((_, i) => {
            const dayNum = i - startOffset + 1;
            const isValid = dayNum >= 1 && dayNum <= daysInMonth;
            if (!isValid) return <div key={i} className="min-h-[60px]" />;

            const dateKey = `${year}-${String(month + 1).padStart(2, "0")}-${String(dayNum).padStart(2, "0")}`;
            const items = byDate[dateKey] ?? [];
            const isToday =
              year === now.getFullYear() &&
              month === now.getMonth() &&
              dayNum === now.getDate();

            return (
              <div
                key={i}
                className={`relative group flex flex-col items-center py-3 min-h-[60px] rounded-lg transition-colors cursor-default border ${isToday ? "bg-[#09268E]/5 border-[#09268E]/30 hover:bg-[#09268E]/10" : "border-transparent hover:bg-[#F8FAFC] hover:border-[#E2E8F0]"}`}
              >
                <span
                  className={`text-sm font-semibold ${isToday ? "text-[#09268E]" : "text-slate-600"}`}
                >
                  {isToday ? (
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-[#09268E] text-white text-xs">
                      {dayNum}
                    </span>
                  ) : (
                    dayNum
                  )}
                </span>
                {items.length > 0 && (
                  <div className="flex gap-1 flex-wrap justify-center mt-1.5">
                    {items.slice(0, 4).map((m) => (
                      <span
                        key={m.id}
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ backgroundColor: getStatusColor(m) }}
                      />
                    ))}
                    {items.length > 4 && (
                      <span className="text-[9px] text-slate-400 font-bold">
                        +{items.length - 4}
                      </span>
                    )}
                  </div>
                )}
                {items.length > 0 && (
                  <div className="absolute top-1 left-1/2 -translate-x-1/2 -translate-y-full hidden group-hover:block z-50 min-w-[200px] bg-white border border-[#E2E8F0] rounded-lg shadow-lg p-1.5 text-left">
                    {items.map((m) => (
                      <Link
                        key={m.id}
                        href={`/assets-management/${m.activoId}`}
                        className="flex items-center gap-2 py-1.5 px-1.5 rounded hover:bg-[#F8FAFC] transition-colors cursor-pointer"
                      >
                        <span
                          className="w-2 h-2 rounded-full shrink-0"
                          style={{ backgroundColor: getStatusColor(m) }}
                        />
                        <div className="min-w-0 flex-1">
                          {tipoActivoMap[m.activoId] && (
                            <p className="text-[11px] font-semibold text-slate-700 leading-tight truncate">
                              {tipoActivoMap[m.activoId]}
                            </p>
                          )}
                          {m.activoNumeroSerie && (
                            <p className="text-[10px] text-slate-400 leading-tight truncate">
                              {m.activoNumeroSerie}
                            </p>
                          )}
                          {!tipoActivoMap[m.activoId] &&
                            !m.activoNumeroSerie && (
                              <p className="text-[11px] text-slate-500 truncate">
                                {m.razon}
                              </p>
                            )}
                        </div>
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth="2"
                          stroke="currentColor"
                          className="size-3 text-slate-300 shrink-0"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="m8.25 4.5 7.5 7.5-7.5 7.5"
                          />
                        </svg>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <div className="border-t border-[#F1F5F9] px-4 py-3 flex flex-wrap gap-x-6 gap-y-2">
        {[
          { color: "#3b82f6", label: "En Proceso" },
          { color: "#fcbc13", label: "Programado" },
          { color: "#00d390", label: "Finalizado" },
          { color: "#ff627d", label: "Vencido" },
          { color: "#94a3b8", label: "Cancelado" },
        ].map(({ color, label }) => (
          <div key={label} className="flex items-center gap-2">
            <span
              className="w-3 h-3 rounded-full shrink-0"
              style={{ backgroundColor: color }}
            />
            <span className="text-sm font-medium text-slate-500">{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
