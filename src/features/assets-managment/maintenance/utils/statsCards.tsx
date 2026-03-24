import { MantenimientoEstado } from "@/features/assets-managment/maintenance/types";
import type { Mantenimiento } from "@/features/assets-managment/maintenance/types";
import { isVencido } from "@/features/assets-managment/maintenance/utils/calendarHelpers";

// Componente para mostrar las estadísticas de mantenimiento en tarjetas
export function StatsCards({ data }: { data: Mantenimiento[] }) {
  const enProceso = data.filter(
    (m) => m.estado === MantenimientoEstado.EnProceso,
  ).length;
  const programados = data.filter(
    (m) => m.estado === MantenimientoEstado.Programado && !isVencido(m),
  ).length;
  const finalizados = data.filter(
    (m) => m.estado === MantenimientoEstado.Finalizado,
  ).length;
  const vencidos = data.filter(isVencido).length;
  const cancelados = data.filter(
    (m) => m.estado === MantenimientoEstado.Cancelado,
  ).length;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
      {[
        {
          label: "En Proceso",
          value: enProceso,
          color: "#3b82f6",
          bg: "rgba(59,130,246,0.07)",
        },
        {
          label: "Programados",
          value: programados,
          color: "#fcbc13",
          bg: "rgba(252,188,19,0.08)",
        },
        {
          label: "Finalizados",
          value: finalizados,
          color: "#00d390",
          bg: "rgba(0,211,144,0.08)",
        },
        {
          label: "Vencidos",
          value: vencidos,
          color: "#ff627d",
          bg: "rgba(255,98,125,0.08)",
        },
        {
          label: "Cancelados",
          value: cancelados,
          color: "#94a3b8",
          bg: "rgba(148,163,184,0.08)",
        },
      ].map(({ label, value, color, bg }) => (
        <div
          key={label}
          className="rounded-xl border p-4 flex flex-col gap-1"
          style={{ backgroundColor: bg, borderColor: `${color}33` }}
        >
          <span className="text-2xl font-bold" style={{ color }}>
            {value}
          </span>
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-[0.5px]">
            {label}
          </span>
        </div>
      ))}
    </div>
  );
}
