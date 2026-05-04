import {
  EstadoDisponibilidadPersonal,
  PrioridadTarea,
} from "@/features/staff-monitoring/types";

export const PRIORITY_BORDER: Record<PrioridadTarea, string> = {
  [PrioridadTarea.Alta]: "#f43f5e",
  [PrioridadTarea.Media]: "#f59e0b",
  [PrioridadTarea.Baja]: "#10b981",
};

export const PRIORITY_STAT: Record<
  PrioridadTarea,
  { label: string; iconBg: string; iconColor: string }
> = {
  [PrioridadTarea.Alta]: { label: "Alta prioridad", iconBg: "#fff1f2", iconColor: "#f43f5e" },
  [PrioridadTarea.Media]: { label: "Media prioridad", iconBg: "#fffbeb", iconColor: "#f59e0b" },
  [PrioridadTarea.Baja]: { label: "Baja prioridad", iconBg: "#f0fdf4", iconColor: "#10b981" },
};

export const ESTADO_CONFIG: Record<
  EstadoDisponibilidadPersonal,
  { label: string; dot: string; bg: string; border: string; text: string }
> = {
  [EstadoDisponibilidadPersonal.Disponible]: {
    label: "Disponible",
    dot: "bg-emerald-500",
    bg: "bg-emerald-50",
    border: "border-emerald-200",
    text: "text-emerald-700",
  },
  [EstadoDisponibilidadPersonal.Ocupado]: {
    label: "Ocupado",
    dot: "bg-amber-500",
    bg: "bg-amber-50",
    border: "border-amber-200",
    text: "text-amber-700",
  },
  [EstadoDisponibilidadPersonal.EnBreak]: {
    label: "En break",
    dot: "bg-slate-400",
    bg: "bg-slate-100",
    border: "border-slate-200",
    text: "text-slate-600",
  },
};

export const ESTADO_OPTIONS = [
  EstadoDisponibilidadPersonal.Disponible,
  EstadoDisponibilidadPersonal.Ocupado,
  EstadoDisponibilidadPersonal.EnBreak,
] as const;

export const TRIAGE_MINI: Record<number, { label: string; bg: string; color: string }> = {
  0: { label: "N/A", bg: "#f1f5f9", color: "#64748b" },
  1: { label: "Reanimación", bg: "#7f1d1d", color: "#fff" },
  2: { label: "Emergencia", bg: "#fef2f2", color: "#dc2626" },
  3: { label: "Urgencia", bg: "#fff7ed", color: "#ea580c" },
  4: { label: "Prioritario", bg: "#fefce8", color: "#ca8a04" },
  5: { label: "No urgente", bg: "#f0fdf4", color: "#16a34a" },
};
