import { MantenimientoEstado } from "@/features/assets-managment/maintenance/types";
import type { Mantenimiento } from "@/features/assets-managment/maintenance/types";

// Devuelve el rango de fechas (desde y hasta) para un mes específico
export function getMonthRange(year: number, month: number) {
  return {
    desde: new Date(year, month, 1).toISOString(),
    hasta: new Date(year, month + 1, 0, 23, 59, 59, 999).toISOString(),
  };
}

// Agrupa los mantenimientos por fecha (YYYY-MM-DD)
export function groupByDate(
  data: Mantenimiento[],
): Record<string, Mantenimiento[]> {
  const map: Record<string, Mantenimiento[]> = {};
  for (const m of data) {
    const key = m.fechaProgramada.slice(0, 10);
    if (!map[key]) map[key] = [];
    map[key].push(m);
  }
  return map;
}

// Devuelve la fecha actual en formato YYYY-MM-DD
export function getTodayStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

// Verifica si un mantenimiento programado está vencido (fecha programada anterior a hoy)
export function isVencido(m: Mantenimiento): boolean {
  return (
    m.estado === MantenimientoEstado.Programado &&
    m.fechaProgramada.slice(0, 10) < getTodayStr()
  );
}

// Devuelve el color correspondiente al estado del mantenimiento (vencido, en proceso, finalizado, cancelado)
export function getStatusColor(m: Mantenimiento): string {
  if (isVencido(m)) return "#ff627d";
  switch (m.estado) {
    case MantenimientoEstado.EnProceso:
      return "#3b82f6";
    case MantenimientoEstado.Finalizado:
      return "#00d390";
    case MantenimientoEstado.Cancelado:
      return "#94a3b8";
    default:
      return "#fcbc13";
  }
}
