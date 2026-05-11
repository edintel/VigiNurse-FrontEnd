"use client";
import { useCallback, useEffect, useState } from "react";
import { getAlerts } from "@/features/baby-monitoring/services/babyService";
import {
  EstadoUbicacionBebe,
  EstadoAlertaBLE,
  SeveridadAlerta,
} from "@/features/baby-monitoring/types";
import type { Bebe, UbicacionBebe, AsignacionBrazalete } from "@/features/baby-monitoring/types";

interface BabyRiskSummaryProps {
  bebe: Bebe;
  ubicacion: UbicacionBebe | null;
  asignacionActiva: AsignacionBrazalete | null;
  loading: boolean;
  refreshKey: number;
}

function formatRelative(dateStr: string | null): string {
  if (!dateStr) return "—";
  try {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "Ahora";
    if (mins < 60) return `Hace ${mins}m`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `Hace ${hrs}h`;
    return new Date(dateStr).toLocaleDateString("es-ES", { day: "2-digit", month: "2-digit" });
  } catch { return dateStr; }
}

// Componente que muestra un resumen del estado operativo del bebé, combinando información de ubicación y alertas para determinar un nivel de riesgo general.
export function BabyRiskSummary({ bebe, ubicacion, asignacionActiva, loading, refreshKey }: BabyRiskSummaryProps) {
  const [openCount, setOpenCount] = useState(0);
  const [criticalCount, setCriticalCount] = useState(0);
  const [loadingAlerts, setLoadingAlerts] = useState(true);

  const fetchAlertCounts = useCallback(async () => {
    setLoadingAlerts(true);
    try {
      const [openRes, critRes] = await Promise.all([
        getAlerts({ babyId: bebe.pacienteId, pageSize: 1 }),
        getAlerts({ babyId: bebe.pacienteId, severity: SeveridadAlerta.Critica, status: EstadoAlertaBLE.Abierta, pageSize: 1 }),
      ]);
      setOpenCount(openRes.totalRegistros);
      setCriticalCount(critRes.totalRegistros);
    } catch {
      // fail silently
    } finally {
      setLoadingAlerts(false);
    }
  }, [bebe.pacienteId]);

  useEffect(() => { void fetchAlertCounts(); }, [fetchAlertCounts, refreshKey]);

  const bateriaBaja = (ubicacion?.nivelBateria ?? 100) < 20 && ubicacion?.nivelBateria != null;

  let riskLevel: "critico" | "advertencia" | "sin-senal" | "normal" = "normal";
  if (criticalCount > 0) riskLevel = "critico";
  else if (ubicacion?.estadoActual === EstadoUbicacionBebe.Critical) riskLevel = "critico";
  else if (ubicacion?.estadoActual === EstadoUbicacionBebe.Warning) riskLevel = "advertencia";
  else if (ubicacion?.estadoActual === EstadoUbicacionBebe.NoSignal || (!asignacionActiva && !loading)) riskLevel = "sin-senal";

  const riskConfig = {
    critico: { bg: "bg-red-50 border-red-200", dot: "bg-red-500", text: "text-red-700", label: "Estado crítico" },
    advertencia: { bg: "bg-amber-50 border-amber-200", dot: "bg-amber-500", text: "text-amber-700", label: "Advertencia" },
    "sin-senal": { bg: "bg-slate-100 border-slate-300", dot: "bg-slate-400", text: "text-slate-600", label: "Sin señal" },
    normal: { bg: "bg-emerald-50 border-emerald-200", dot: "bg-emerald-500", text: "text-emerald-700", label: "Normal" },
  }[riskLevel];

  return (
    <div className="bg-white rounded-xl shadow-sm border border-[#E2E8F0] overflow-hidden">
      <div className="px-5 py-3.5 border-b border-[#f1f5f9] bg-[#F8FAFC]">
        <span className="text-xs font-bold uppercase tracking-[0.5px] text-[#64748b]">Resumen operativo</span>
      </div>
      <div className="p-4">
        {(loading || loadingAlerts) ? (
          <div className="flex items-center gap-2 py-1">
            <span className="loading loading-spinner loading-xs text-[#09268E]" />
            <span className="text-sm text-slate-400">Calculando estado...</span>
          </div>
        ) : (
          <div className="flex flex-wrap gap-3">
            {/* Estado global */}
            <div className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-semibold ${riskConfig.bg} ${riskConfig.text}`}>
              <span className={`size-2 rounded-full inline-block ${riskConfig.dot}`} />
              {riskConfig.label}
            </div>

            {/* Alertas abiertas */}
            <div className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border text-sm font-semibold ${openCount > 0 ? "bg-red-50 border-red-200 text-red-700" : "bg-slate-50 border-slate-200 text-slate-500"}`}>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="size-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" />
              </svg>
              {openCount} alerta{openCount !== 1 ? "s" : ""} {openCount > 0 ? "abiertas" : "abiertas"}
            </div>

            {/* Alertas críticas */}
            {criticalCount > 0 && (
              <div className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border text-sm font-semibold bg-red-100 border-red-300 text-red-800">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="size-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
                </svg>
                {criticalCount} crítica{criticalCount !== 1 ? "s" : ""}
              </div>
            )}

            {/* Batería */}
            {ubicacion?.nivelBateria != null && (
              <div className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border text-sm font-semibold ${bateriaBaja ? "bg-red-50 border-red-200 text-red-700" : "bg-slate-50 border-slate-200 text-slate-600"}`}>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="size-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 10.5h.375c.621 0 1.125.504 1.125 1.125v2.25c0 .621-.504 1.125-1.125 1.125H21M4.5 10.5H18V15H4.5v-4.5ZM3.75 18h15A2.25 2.25 0 0 0 21 15.75v-6a2.25 2.25 0 0 0-2.25-2.25h-15A2.25 2.25 0 0 0 1.5 9.75v6A2.25 2.25 0 0 0 3.75 18Z" />
                </svg>
                {ubicacion.nivelBateria}%{bateriaBaja ? " — Batería baja" : ""}
              </div>
            )}

            {/* Última señal */}
            {ubicacion?.ultimaDeteccion && (
              <div className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border text-sm font-semibold bg-slate-50 border-slate-200 text-slate-600">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="size-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.288 15.038a5.25 5.25 0 0 1 7.424 0M5.106 11.856c3.807-3.808 9.98-3.808 13.788 0M1.924 8.674c5.565-5.565 14.587-5.565 20.152 0M12.53 18.22l-.53.53-.53-.53a.75.75 0 0 1 1.06 0Z" />
                </svg>
                Señal: {formatRelative(ubicacion.ultimaDeteccion)}
              </div>
            )}

            {/* Zona actual */}
            {ubicacion?.ultimaZonaNombre && (
              <div className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border text-sm font-semibold bg-blue-50 border-blue-200 text-blue-700">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="size-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
                </svg>
                {ubicacion.ultimaZonaNombre}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
