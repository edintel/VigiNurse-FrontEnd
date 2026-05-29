"use client";
import { useCallback, useEffect, useState } from "react";
import { toast } from "@/lib/toast";
import { getAlerts, acknowledgeAlert } from "@/features/baby-monitoring/services/babyService";
import {
  EstadoAlertaBLE,
  SeveridadAlerta,
  TIPO_ALERTA_BLE_LABELS,
  SEVERIDAD_ALERTA_LABELS,
  ESTADO_ALERTA_BLE_LABELS,
} from "@/features/baby-monitoring/types";
import type { Bebe, AlertaBrazalete } from "@/features/baby-monitoring/types";
import { CloseAlertModal } from "./CloseAlertModal";

interface BabyRecentAlertsProps {
  bebe: Bebe;
  readOnly: boolean;
  onAlertsChanged: () => void;
}

function SeveridadBadge({ s }: { s: SeveridadAlerta }) {
  const cfg = {
    [SeveridadAlerta.Critica]: "bg-red-50 text-red-700 border-red-200",
    [SeveridadAlerta.Alta]:    "bg-orange-50 text-orange-700 border-orange-200",
    [SeveridadAlerta.Media]:   "bg-amber-50 text-amber-700 border-amber-200",
    [SeveridadAlerta.Baja]:    "bg-slate-100 text-slate-500 border-slate-200",
  }[s] ?? "bg-slate-100 text-slate-500 border-slate-200";
  return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border whitespace-nowrap ${cfg}`}>{SEVERIDAD_ALERTA_LABELS[s]}</span>;
}

function StatusBadge({ e }: { e: EstadoAlertaBLE }) {
  const cfg = {
    [EstadoAlertaBLE.Abierta]:    "bg-red-50 text-red-700 border-red-200",
    [EstadoAlertaBLE.Reconocida]: "bg-blue-50 text-blue-700 border-blue-200",
    [EstadoAlertaBLE.Cerrada]:    "bg-emerald-50 text-emerald-700 border-emerald-200",
  }[e] ?? "bg-slate-100 text-slate-500 border-slate-200";
  return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border whitespace-nowrap ${cfg}`}>{ESTADO_ALERTA_BLE_LABELS[e]}</span>;
}

function formatDT(d: string) {
  try {
    return new Date(d).toLocaleString("es-ES", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit", hour12: false });
  } catch { return d; }
}

// Componente de tabla para mostrar las alertas recientes del bebé, 
// con acciones para reconocer o cerrar cada alerta.
export function BabyRecentAlerts({ bebe, readOnly, onAlertsChanged }: BabyRecentAlertsProps) {
  const [alerts, setAlerts] = useState<AlertaBrazalete[]>([]);
  const [loading, setLoading] = useState(true);
  const [acknowledging, setAcknowledging] = useState<number | null>(null);
  const [closeModalAlertId, setCloseModalAlertId] = useState<number | null>(null);

  const loadAlerts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getAlerts({ babyId: bebe.pacienteId, page: 1, pageSize: 5 });
      setAlerts(res.datos);
    } catch {
      // fail silently — section-level failure
    } finally {
      setLoading(false);
    }
  }, [bebe.pacienteId]);

  useEffect(() => { void loadAlerts(); }, [loadAlerts]);

  async function handleAcknowledge(id: number) {
    setAcknowledging(id);
    try {
      await acknowledgeAlert(id);
      toast.success("Alerta reconocida.");
      void loadAlerts();
      onAlertsChanged();
    } catch (err: unknown) {
      const data = (err as { response?: { data?: { mensaje?: string; message?: string } } })?.response?.data;
      toast.error(data?.mensaje ?? data?.message ?? "No se pudo reconocer la alerta.");
    } finally {
      setAcknowledging(null);
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-[#E2E8F0] overflow-hidden">
      <div className="px-5 py-3.5 border-b border-[#f1f5f9] bg-[#F8FAFC] flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-[0.5px] text-[#64748b]">Alertas recientes</span>
        {!loading && alerts.length > 0 && (
          <span className="text-xs font-bold bg-red-100 text-red-600 rounded-full px-2 py-0.5">{alerts.length}</span>
        )}
      </div>
      <div className="overflow-x-auto">
        <table className="table table-zebra w-full [&_td]:py-2.5 [&_th]:py-2.5">
          <thead>
            <tr className="bg-[#F8FAFC] text-[#1A2B5E]">
              <th className="text-xs font-semibold uppercase tracking-wide whitespace-nowrap">Fecha</th>
              <th className="text-xs font-semibold uppercase tracking-wide">Tipo</th>
              <th className="text-xs font-semibold uppercase tracking-wide">Severidad</th>
              <th className="text-xs font-semibold uppercase tracking-wide">Estado</th>
              <th className="text-xs font-semibold uppercase tracking-wide">Zona</th>
              <th className="text-xs font-semibold uppercase tracking-wide">Descripción</th>
              {!readOnly && <th className="text-xs font-semibold uppercase tracking-wide">Acciones</th>}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={readOnly ? 6 : 7} className="text-center py-8"><span className="loading loading-spinner loading-md text-[#09268E]" /></td></tr>
            ) : alerts.length === 0 ? (
              <tr><td colSpan={readOnly ? 6 : 7} className="text-center py-8 text-base-content/40 text-sm">No hay alertas recientes para este bebé.</td></tr>
            ) : (
              alerts.map((a) => (
                <tr key={a.id} className="hover:bg-base-200">
                  <td className="text-sm text-[#475569] whitespace-nowrap">{formatDT(a.fechaCreacion)}</td>
                  <td className="text-sm text-[#475569] whitespace-nowrap">{TIPO_ALERTA_BLE_LABELS[a.tipo]}</td>
                  <td><SeveridadBadge s={a.severidad} /></td>
                  <td><StatusBadge e={a.estado} /></td>
                  <td className="text-sm text-[#475569] truncate max-w-[120px]">{a.zonaNombre ?? "—"}</td>
                  <td className="text-sm text-[#475569] truncate max-w-[180px]">{a.descripcion}</td>
                  {!readOnly && (
                    <td>
                      <div className="flex items-center gap-1">
                        {a.estado === EstadoAlertaBLE.Abierta && (
                          <button
                            type="button"
                            className="btn btn-xs btn-outline border-blue-300 text-blue-600 hover:bg-blue-50 hover:border-blue-400"
                            disabled={acknowledging === a.id}
                            onClick={() => void handleAcknowledge(a.id)}
                          >
                            {acknowledging === a.id ? <span className="loading loading-spinner loading-xs" /> : "Reconocer"}
                          </button>
                        )}
                        {a.estado !== EstadoAlertaBLE.Cerrada && (
                          <button
                            type="button"
                            className="btn btn-xs btn-ghost text-slate-500 hover:text-red-600"
                            onClick={() => setCloseModalAlertId(a.id)}
                          >
                            Cerrar
                          </button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {closeModalAlertId != null && (
        <CloseAlertModal
          open={closeModalAlertId != null}
          alertId={closeModalAlertId}
          onClose={() => setCloseModalAlertId(null)}
          onClosed={() => { void loadAlerts(); onAlertsChanged(); }}
        />
      )}
    </div>
  );
}
