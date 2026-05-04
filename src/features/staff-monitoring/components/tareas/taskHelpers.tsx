"use client";
import React from "react";
import {
  EstadoTarea,
  PrioridadTarea,
  NivelCarga,
  EstadoDisponibilidadPersonal,
} from "../../types";

export function EstadoTareaBadge({
  estado,
  showDot = true,
}: {
  estado: EstadoTarea;
  showDot?: boolean;
}) {
  const cfg = {
    [EstadoTarea.Pendiente]: { cls: "bg-slate-100 text-slate-600 border-slate-200", dot: "bg-slate-400", label: "Pendiente" },
    [EstadoTarea.Asignada]:  { cls: "bg-blue-50 text-blue-700 border-blue-200",     dot: "bg-blue-500",  label: "Asignada" },
    [EstadoTarea.Cancelada]: { cls: "bg-red-50 text-red-600 border-red-200",         dot: "bg-red-500",   label: "Cancelada" },
    [EstadoTarea.Completada]:{ cls: "bg-emerald-50 text-emerald-700 border-emerald-200", dot: "bg-emerald-500", label: "Completada" },
  }[estado] ?? { cls: "bg-slate-100 text-slate-600 border-slate-200", dot: "bg-slate-400", label: "—" };
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold border ${cfg.cls}`}>
      {showDot && <span className={`size-1.5 rounded-full ${cfg.dot}`} />}
      {cfg.label}
    </span>
  );
}

export function PrioridadBadge({ prioridad }: { prioridad: PrioridadTarea }) {
  const cfg = {
    [PrioridadTarea.Baja]:  { cls: "bg-emerald-50 text-emerald-700 border-emerald-200", label: "Baja" },
    [PrioridadTarea.Media]: { cls: "bg-amber-50 text-amber-700 border-amber-200",       label: "Media" },
    [PrioridadTarea.Alta]:  { cls: "bg-rose-50 text-rose-700 border-rose-200",           label: "Alta" },
  }[prioridad] ?? { cls: "bg-slate-100 text-slate-600 border-slate-200", label: "—" };
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold border ${cfg.cls}`}>
      {cfg.label}
    </span>
  );
}

export function NivelCargaBadge({ nivel, descripcion }: { nivel: NivelCarga; descripcion?: string }) {
  const cfg = {
    [NivelCarga.Libre]:   { cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
    [NivelCarga.Baja]:    { cls: "bg-blue-50 text-blue-700 border-blue-200" },
    [NivelCarga.Media]:   { cls: "bg-amber-50 text-amber-700 border-amber-200" },
    [NivelCarga.Alta]:    { cls: "bg-orange-50 text-orange-700 border-orange-200" },
    [NivelCarga.Critica]: { cls: "bg-red-50 text-red-700 border-red-200" },
  }[nivel] ?? { cls: "bg-slate-100 text-slate-600 border-slate-200" };
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold border ${cfg.cls}`}>
      {descripcion ?? NivelCarga[nivel]}
    </span>
  );
}

export function DisponibilidadBadge({
  estado,
  descripcion,
}: {
  estado: EstadoDisponibilidadPersonal;
  descripcion?: string;
}) {
  const cfg = {
    [EstadoDisponibilidadPersonal.Disponible]: { cls: "bg-emerald-50 text-emerald-700 border-emerald-200", dot: "bg-emerald-500" },
    [EstadoDisponibilidadPersonal.Ocupado]:    { cls: "bg-amber-50 text-amber-700 border-amber-200",       dot: "bg-amber-500" },
    [EstadoDisponibilidadPersonal.EnBreak]:    { cls: "bg-slate-100 text-slate-600 border-slate-200",      dot: "bg-slate-400" },
  }[estado] ?? { cls: "bg-slate-100 text-slate-600 border-slate-200", dot: "bg-slate-400" };
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold border ${cfg.cls}`}>
      <span className={`size-1.5 rounded-full ${cfg.dot}`} />
      {descripcion ?? EstadoDisponibilidadPersonal[estado]}
    </span>
  );
}

export function extractApiError(err: unknown, fallback: string): string {
  if (err && typeof err === "object" && "response" in err) {
    const r = (err as { response?: { data?: { mensaje?: string } } }).response;
    if (r?.data?.mensaje) return r.data.mensaje;
  }
  return fallback;
}

export function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export function fmtDateTime(iso: string): string {
  return new Date(iso).toLocaleString("es-ES", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
