import { PrioridadTarea } from "@/features/staff-monitoring/types";
import { PRIORITY_BORDER, PRIORITY_STAT } from "./staffHomeConfig";


// Componente para mostrar una tarjeta de estadística de prioridad en el dashboard del staff
export function PriorityStatCard({
  prioridad,
  count,
  active,
  onClick,
}: {
  prioridad: PrioridadTarea;
  count: number;
  active: boolean;
  onClick: () => void;
}) {
  const { label, iconBg, iconColor } = PRIORITY_STAT[prioridad];
  const border = PRIORITY_BORDER[prioridad];

  return (
    <button
      type="button"
      onClick={onClick}
      className={`bg-white rounded-xl shadow-sm px-5 py-4 flex items-center gap-4 w-full text-left transition cursor-pointer hover:shadow-md ${
        active ? "border-2" : "border border-[#e2e8f0]"
      }`}
      style={active ? { borderColor: border } : undefined}
    >
      <div
        className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
        style={{ backgroundColor: iconBg }}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="size-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke={iconColor}
          strokeWidth={2.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M3 4.5h14.25M3 9h9.75M3 13.5h9.75m4.5-4.5v12m0 0-3.75-3.75M17.25 21 21 17.25"
          />
        </svg>
      </div>
      <div>
        <p className="text-2xl font-extrabold text-[#0f172a]">{count}</p>
        <p className="text-xs font-medium" style={{ color: iconColor }}>
          {label}
        </p>
      </div>
      {active && (
        <div
          className="ml-auto w-1.5 h-8 rounded-full"
          style={{ backgroundColor: border }}
        />
      )}
    </button>
  );
}
