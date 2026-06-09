"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  getBabyLocation,
  getAvailableBracelets,
  getBraceletAssignmentsByEpisode,
  getActiveBraceletAssignmentByPatient,
  assignBraceletToBaby,
  unassignBraceletFromBaby,
  getAlerts,
} from "@/features/baby-monitoring/services/babyService";
import { BabyAllowedZonesSection } from "@/features/baby-monitoring/components/zones/BabyAllowedZonesSection";
import { BabyRecentAlerts } from "@/features/baby-monitoring/components/bracelet/BabyRecentAlerts";
import { BabyMovementHistory } from "@/features/baby-monitoring/components/bracelet/BabyMovementHistory";
import { BabyFloorPlanMap } from "@/features/baby-monitoring/components/BabyFloorPlanMap";
import { toast } from "@/lib/toast";
import { EstadoBrazalete, EstadoUbicacionBebe, EstadoAlertaBLE } from "@/features/baby-monitoring/types";
import type {
  Bebe,
  AsignacionBrazalete,
  Brazalete,
  UbicacionBebe,
  AsignarBrazaleteABebeDTO,
  DesasignarBrazaleteABebeDTO,
} from "@/features/baby-monitoring/types";

interface BabyLocationTabProps {
  bebe: Bebe;
  readOnly: boolean;
}

type LocationSubTab = "resumen" | "alertas" | "autorizaciones" | "historial";

function mVToPercent(mv: number): number {
  return Math.min(100, Math.max(0, Math.round((mv - 2000) / 1000 * 100)));
}

const SUB_TABS: { id: LocationSubTab; label: string }[] = [
  { id: "resumen", label: "Resumen" },
  { id: "alertas", label: "Alertas" },
  { id: "autorizaciones", label: "Zonas permitidas" },
  { id: "historial", label: "Historial de movimientos" },
];

function formatDateTime(dateStr: string | null): string {
  if (!dateStr) return "—";
  try {
    return new Date(dateStr).toLocaleString("es-ES", {
      day: "2-digit", month: "2-digit", year: "numeric",
      hour: "2-digit", minute: "2-digit", hour12: false,
    });
  } catch { return dateStr; }
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

function InfoField({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5 min-w-[120px]">
      <span className="text-[10px] font-bold uppercase tracking-[0.5px] text-[#94a3b8]">{label}</span>
      <span className="text-sm font-semibold text-[#334155]">{value ?? "—"}</span>
    </div>
  );
}

function LocationStatusBadge({ estado, mensaje }: { estado: EstadoUbicacionBebe; mensaje: string }) {
  const config = ({
    [EstadoUbicacionBebe.Normal]:   { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200", dot: "bg-emerald-500" },
    [EstadoUbicacionBebe.Warning]:  { bg: "bg-amber-50",   text: "text-amber-700",   border: "border-amber-200",   dot: "bg-amber-500"   },
    [EstadoUbicacionBebe.Critical]: { bg: "bg-red-50",     text: "text-red-700",     border: "border-red-200",     dot: "bg-red-500"     },
    [EstadoUbicacionBebe.NoSignal]: { bg: "bg-slate-100",  text: "text-slate-600",   border: "border-slate-300",   dot: "bg-slate-400"   },
  } as const)[estado] ?? { bg: "bg-slate-100", text: "text-slate-600", border: "border-slate-300", dot: "bg-slate-400" };

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${config.bg} ${config.text} border ${config.border}`}>
      <span className={`size-1.5 rounded-full inline-block ${config.dot}`} />
      {mensaje}
    </span>
  );
}

// ─── Stat card for resumen ─────────────────────────────────────────────────────

function StatCard({
  label, value, highlight = false, icon,
}: { label: string; value: string; highlight?: boolean; icon: React.ReactNode }) {
  return (
    <div className={`rounded-xl border p-4 flex flex-col gap-1.5 ${highlight ? "bg-red-50 border-red-200" : "bg-white border-[#E2E8F0]"}`}>
      <div className={`size-8 rounded-lg flex items-center justify-center ${highlight ? "bg-red-100" : "bg-slate-100"}`}>
        <span className={highlight ? "text-red-600" : "text-slate-500"}>{icon}</span>
      </div>
      <span className={`text-2xl font-bold ${highlight ? "text-red-700" : "text-[#1A2B5E]"}`}>{value}</span>
      <span className="text-xs text-slate-500 font-medium">{label}</span>
    </div>
  );
}

// ─── Modal: Asignar Brazalete ─────────────────────────────────────────────────

interface AssignBraceletModalProps {
  open: boolean;
  bebeId: number;
  onClose: () => void;
  onAssigned: () => void;
}

function AssignBraceletModal({ open, bebeId, onClose, onAssigned }: AssignBraceletModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [bracelets, setBracelets] = useState<Brazalete[]>([]);
  const [selectedId, setSelectedId] = useState<number | "">("");
  const [loadingBracelets, setLoadingBracelets] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      dialogRef.current?.showModal();
      setSelectedId("");
      setLoadingBracelets(true);
      getAvailableBracelets()
        .then(setBracelets)
        .catch(() => toast.error("No se pudieron cargar los brazaletes disponibles."))
        .finally(() => setLoadingBracelets(false));
    } else {
      dialogRef.current?.close();
    }
  }, [open]);

  const isValid = selectedId !== "";
  const selectedBracelet = bracelets.find((b) => b.id === Number(selectedId)) ?? null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isValid || !selectedBracelet) return;
    setSubmitting(true);
    try {
      const dto: AsignarBrazaleteABebeDTO = { codigoBrazalete: selectedBracelet.codigo };
      await assignBraceletToBaby(bebeId, dto);
      toast.success("Brazalete asignado correctamente.");
      onAssigned();
      onClose();
    } catch (err: unknown) {
      const data = (err as { response?: { data?: { mensaje?: string; message?: string } } })?.response?.data;
      toast.error(data?.mensaje ?? data?.message ?? "No se pudo asignar el brazalete.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <dialog ref={dialogRef} className="modal" onCancel={(e) => { e.preventDefault(); if (!submitting) onClose(); }}>
      <div className="modal-box max-w-md p-0 overflow-hidden rounded-xl">
        <div className="px-6 py-4 border-b border-[#E2E8F0]">
          <h3 className="text-base font-bold text-[#0f172a]">Asignar brazalete</h3>
        </div>
        <form onSubmit={(e) => void handleSubmit(e)} className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-sm font-semibold text-[#334155] mb-1.5">
              Brazalete disponible <span className="text-red-500">*</span>
            </label>
            {loadingBracelets ? (
              <div className="flex items-center gap-2 py-2">
                <span className="loading loading-spinner loading-xs text-[#09268E]" />
                <span className="text-sm text-slate-500">Cargando brazaletes...</span>
              </div>
            ) : bracelets.length === 0 ? (
              <p className="text-sm text-slate-500 py-2">No hay brazaletes disponibles en este momento.</p>
            ) : (
              <select
                className="select select-bordered w-full text-sm"
                value={selectedId}
                onChange={(e) => setSelectedId(e.target.value === "" ? "" : Number(e.target.value))}
                disabled={submitting}
              >
                <option value="">Seleccionar brazalete...</option>
                {bracelets.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.codigo}{b.descripcion ? ` — ${b.descripcion}` : ""}
                  </option>
                ))}
              </select>
            )}
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" className="btn btn-sm btn-ghost" onClick={onClose} disabled={submitting}>Cancelar</button>
            <button
              type="submit"
              className="btn btn-sm text-white"
              style={!isValid || submitting || bracelets.length === 0
                ? { backgroundColor: "#cbd5e1", borderColor: "#cbd5e1", color: "#94a3b8", cursor: "not-allowed" }
                : { backgroundColor: "#09268E", borderColor: "#09268E" }}
              disabled={!isValid || !selectedBracelet || submitting || bracelets.length === 0}
            >
              {submitting && <span className="loading loading-spinner loading-xs" />}
              Asignar
            </button>
          </div>
        </form>
      </div>
      <form method="dialog" className="modal-backdrop">
        <button type="button" onClick={() => { if (!submitting) onClose(); }}>close</button>
      </form>
    </dialog>
  );
}

// ─── Modal: Desasignar Brazalete ──────────────────────────────────────────────

interface UnassignBraceletModalProps {
  open: boolean;
  bebeId: number;
  brazaleteIdentificador: string;
  onClose: () => void;
  onUnassigned: () => void;
}

function UnassignBraceletModal({ open, bebeId, brazaleteIdentificador, onClose, onUnassigned }: UnassignBraceletModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [razon, setRazon] = useState("");
  const [estadoSiguiente, setEstadoSiguiente] = useState<EstadoBrazalete>(EstadoBrazalete.Disponible);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) { dialogRef.current?.showModal(); setRazon(""); setEstadoSiguiente(EstadoBrazalete.Disponible); }
    else dialogRef.current?.close();
  }, [open]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const dto: DesasignarBrazaleteABebeDTO = { razon: razon.trim() || null, estadoSiguienteBrazalete: estadoSiguiente };
      await unassignBraceletFromBaby(bebeId, dto);
      toast.success("Brazalete desasignado correctamente.");
      onUnassigned();
      onClose();
    } catch (err: unknown) {
      const data = (err as { response?: { data?: { mensaje?: string; message?: string } } })?.response?.data;
      toast.error(data?.mensaje ?? data?.message ?? "No se pudo desasignar el brazalete.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <dialog ref={dialogRef} className="modal" onCancel={(e) => { e.preventDefault(); if (!submitting) onClose(); }}>
      <div className="modal-box max-w-md p-0 overflow-hidden rounded-xl">
        <div className="px-6 py-4 border-b border-[#E2E8F0]">
          <h3 className="text-base font-bold text-[#0f172a]">Desasignar brazalete</h3>
        </div>
        <form onSubmit={(e) => void handleSubmit(e)} className="px-6 py-5 space-y-4">
          <div className="rounded-lg bg-amber-50 border border-amber-200 px-4 py-3">
            <p className="text-sm text-amber-800">
              ¿Confirma que desea desasignar el brazalete <strong>{brazaleteIdentificador}</strong> de este bebé?
            </p>
          </div>
          <div>
            <label className="block text-sm font-semibold text-[#334155] mb-1.5">
              Estado siguiente del brazalete <span className="text-red-500">*</span>
            </label>
            <select
              className="select select-bordered w-full text-sm"
              value={estadoSiguiente}
              onChange={(e) => setEstadoSiguiente(Number(e.target.value) as EstadoBrazalete)}
              disabled={submitting}
            >
              <option value={EstadoBrazalete.Disponible}>Disponible</option>
              <option value={EstadoBrazalete.Mantenimiento}>Mantenimiento</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-[#334155] mb-1.5">
              Razón <span className="text-xs font-normal text-slate-400">(opcional)</span>
            </label>
            <textarea
              className="textarea textarea-bordered w-full text-sm rounded-lg resize-none"
              rows={3}
              placeholder="Motivo de desasignación..."
              value={razon}
              onChange={(e) => setRazon(e.target.value)}
              disabled={submitting}
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" className="btn btn-sm btn-ghost" onClick={onClose} disabled={submitting}>Cancelar</button>
            <button
              type="submit"
              className="btn btn-sm text-white"
              style={submitting
                ? { backgroundColor: "#cbd5e1", borderColor: "#cbd5e1", color: "#94a3b8", cursor: "not-allowed" }
                : { backgroundColor: "#dc2626", borderColor: "#dc2626" }}
              disabled={submitting}
            >
              {submitting && <span className="loading loading-spinner loading-xs" />}
              Desasignar
            </button>
          </div>
        </form>
      </div>
      <form method="dialog" className="modal-backdrop">
        <button type="button" onClick={() => { if (!submitting) onClose(); }}>close</button>
      </form>
    </dialog>
  );
}

// ─── Historial de assignments ─────────────────────────────

function AssignmentHistoryTable({ assignments, loading }: { assignments: AsignacionBrazalete[]; loading: boolean }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-[#E2E8F0] overflow-hidden">
      <div className="px-5 py-3.5 border-b border-[#f1f5f9] bg-[#F8FAFC] flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-[0.5px] text-[#64748b]">Historial de assignments</span>
        {!loading && assignments.length > 0 && (
          <span className="text-xs font-bold bg-[#f1f5f9] text-[#64748b] rounded-full px-2 py-0.5">{assignments.length}</span>
        )}
      </div>
      <div className="overflow-x-auto">
        <table className="table table-zebra w-full table-fixed [&_td]:py-2.5 [&_th]:py-2.5">
          <colgroup>
            <col className="w-[20%]" />
            <col className="w-[22%]" />
            <col className="w-[22%]" />
            <col className="w-[24%]" />
            <col className="w-[12%]" />
          </colgroup>
          <thead>
            <tr className="bg-[#F8FAFC] text-[#1A2B5E]">
              <th className="text-xs font-semibold uppercase tracking-wide whitespace-nowrap">Brazalete (MAC)</th>
              <th className="text-xs font-semibold uppercase tracking-wide whitespace-nowrap">Asignado el</th>
              <th className="text-xs font-semibold uppercase tracking-wide whitespace-nowrap">Liberado el</th>
              <th className="text-xs font-semibold uppercase tracking-wide">Asignado por</th>
              <th className="text-xs font-semibold uppercase tracking-wide">Estado</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} className="text-center py-10"><span className="loading loading-spinner loading-md text-[#09268E]" /></td></tr>
            ) : assignments.length === 0 ? (
              <tr><td colSpan={5} className="text-center py-10 text-base-content/40 text-sm">No hay historial de assignments para este episodio.</td></tr>
            ) : (
              assignments.map((a) => (
                <tr key={a.id} className="hover:bg-base-200">
                  <td className="text-sm text-[#475569] font-mono whitespace-nowrap truncate">{a.brazaleteMac}</td>
                  <td className="text-sm text-[#475569] whitespace-nowrap">{formatDateTime(a.fechaAsignacion)}</td>
                  <td className="text-sm text-[#475569] whitespace-nowrap">{a.fechaDesasignacion ? formatDateTime(a.fechaDesasignacion) : "—"}</td>
                  <td className="text-sm text-[#475569] truncate">{a.asignadoPorNombre}</td>
                  <td>
                    {a.activa ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 whitespace-nowrap">
                        <span className="size-1.5 rounded-full bg-emerald-500 inline-block" />
                        Activo
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-500 border border-slate-200 whitespace-nowrap">
                        Liberado
                      </span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Componente que muestra la ubicación actual del bebé, el estado del brazalete asignado y 
// permite asignar/desasignar brazaletes, además de mostrar sub-tabs con información detallada. 
// Se muestra en la pestaña "Ubicación y brazalete" del detalle del bebé.

export function BabyLocationTab({ bebe, readOnly }: BabyLocationTabProps) {
  const [ubicacion, setUbicacion] = useState<UbicacionBebe | null>(null);
  const [asignacionActiva, setAsignacionActiva] = useState<AsignacionBrazalete | null>(null);
  const [assignments, setAssignments] = useState<AsignacionBrazalete[]>([]);
  const [openAlertsCount, setOpenAlertsCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showUnassignModal, setShowUnassignModal] = useState(false);
  const [alertsKey, setAlertsKey] = useState(0);
  const [activeSubTab, setActiveSubTab] = useState<LocationSubTab>("resumen");

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [loc, asigs, activa, alertsRes] = await Promise.all([
        getBabyLocation(bebe.id).catch(() => null),
        getBraceletAssignmentsByEpisode(bebe.episodioId).catch(() => [] as AsignacionBrazalete[]),
        getActiveBraceletAssignmentByPatient(bebe.pacienteId),
        getAlerts({ babyId: bebe.pacienteId, status: EstadoAlertaBLE.Abierta, pageSize: 1 }).catch(() => null),
      ]);
      setUbicacion(loc);
      setAsignacionActiva(activa);
      setOpenAlertsCount(alertsRes?.totalRegistros ?? 0);
      setAssignments(
        [...asigs].sort((a, b) => new Date(b.fechaAsignacion).getTime() - new Date(a.fechaAsignacion).getTime())
      );
    } catch {
      setError("No se pudo cargar la información de ubicación.");
    } finally {
      setLoading(false);
    }
  }, [bebe.id, bebe.episodioId, bebe.pacienteId]);

  useEffect(() => { void loadData(); }, [loadData]);

  // Refresh open alerts count after alert actions
  useEffect(() => {
    if (alertsKey === 0) return;
    getAlerts({ babyId: bebe.pacienteId, status: EstadoAlertaBLE.Abierta, pageSize: 1 })
      .then(res => setOpenAlertsCount(res.totalRegistros))
      .catch(() => {});
  }, [bebe.pacienteId, alertsKey]);

  const brazaleteIdentificador = ubicacion?.codigoBrazalete ?? asignacionActiva?.brazaleteMac ?? "";

  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <h2 className="text-lg font-bold text-[#0f172a]">Ubicación y brazalete</h2>
        {!readOnly && !loading && (
          asignacionActiva ? (
            <button
              type="button"
              className="btn btn-sm text-white cursor-pointer"
              style={{ backgroundColor: "#dc2626", borderColor: "#dc2626" }}
              onClick={() => setShowUnassignModal(true)}
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="size-[1.1em]">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
              </svg>
              Desasignar brazalete
            </button>
          ) : (
            <button
              type="button"
              className="btn text-white cursor-pointer"
              style={{ backgroundColor: "#09268E", borderColor: "#09268E" }}
              onClick={() => setShowAssignModal(true)}
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" className="size-[1.2em]">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              Asignar brazalete
            </button>
          )
        )}
      </div>

      {readOnly && (
        <div className="rounded-lg bg-slate-50 border border-slate-200 px-4 py-2.5">
          <p className="text-xs text-slate-500">Bebé dado de alta. Los registros se muestran en modo historial.</p>
        </div>
      )}

      {error && (
        <div role="alert" className="alert alert-error text-sm py-3">
          <span>{error}</span>
          <button className="btn btn-xs btn-ghost" onClick={() => void loadData()}>Reintentar</button>
        </div>
      )}

      {/* Estado actual del brazalete — siempre visible */}
      <div className="bg-white rounded-xl shadow-sm border border-[#E2E8F0] overflow-hidden">
        <div className="px-5 py-3.5 border-b border-[#f1f5f9] bg-[#F8FAFC] flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-[0.5px] text-[#64748b]">Estado actual del brazalete</span>
          {openAlertsCount > 0 && (
            <button
              type="button"
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-50 text-red-700 border border-red-200 cursor-pointer hover:bg-red-100 transition-colors duration-150"
              onClick={() => setActiveSubTab("alertas")}
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="size-3.5">
                <path fillRule="evenodd" d="M9.401 3.003c1.155-2 4.043-2 5.197 0l7.355 12.748c1.154 2-.29 4.5-2.599 4.5H4.645c-2.309 0-3.752-2.5-2.598-4.5L9.4 3.003ZM12 8.25a.75.75 0 0 1 .75.75v3.75a.75.75 0 0 1-1.5 0V9a.75.75 0 0 1 .75-.75Zm0 8.25a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Z" clipRule="evenodd" />
              </svg>
              {openAlertsCount} alerta{openAlertsCount !== 1 ? "s" : ""} abierta{openAlertsCount !== 1 ? "s" : ""}
            </button>
          )}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-10">
            <span className="loading loading-spinner loading-md text-[#09268E]" />
          </div>
        ) : asignacionActiva ? (
          <div className="p-5">
            <div className="flex flex-wrap gap-x-8 gap-y-4">
              {ubicacion?.codigoBrazalete && (
                <InfoField label="Código de brazalete" value={<span className="font-mono">{ubicacion.codigoBrazalete}</span>} />
              )}
              <InfoField label="MAC del brazalete" value={<span className="font-mono text-xs">{asignacionActiva.brazaleteMac}</span>} />
              <InfoField label="Asignado el" value={formatDateTime(asignacionActiva.fechaAsignacion)} />
              <InfoField label="Asignado por" value={asignacionActiva.asignadoPorNombre} />
              {ubicacion?.ultimaZonaNombre && (
                <InfoField label="Zona actual" value={ubicacion.ultimaZonaNombre} />
              )}
              {ubicacion?.ultimoSensorNombre && (
                <InfoField label="Sensor" value={ubicacion.ultimoSensorNombre} />
              )}
              {ubicacion?.nivelBateria != null && (
                <InfoField label="Batería" value={
                  <span className={mVToPercent(ubicacion.nivelBateria) < 20 ? "text-red-600" : undefined}>
                    {mVToPercent(ubicacion.nivelBateria)}%
                    {mVToPercent(ubicacion.nivelBateria) < 20 && " — Baja"}
                  </span>
                } />
              )}
              {ubicacion?.ultimaDeteccion && (
                <InfoField label="Última señal" value={formatDateTime(ubicacion.ultimaDeteccion)} />
              )}
            </div>
            {ubicacion && (
              <div className="mt-4">
                <LocationStatusBadge estado={ubicacion.estadoActual} mensaje={ubicacion.mensajeEstado} />
              </div>
            )}
            {ubicacion?.ultimaZonaId != null && (
              <BabyFloorPlanMap
                zonaId={ubicacion.ultimaZonaId}
                pacienteId={bebe.pacienteId}
                zonaNombre={ubicacion.ultimaZonaNombre}
              />
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-10 gap-3 text-center">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.3" stroke="#cbd5e1" className="size-12">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
            </svg>
            <div>
              <p className="text-sm font-semibold text-[#475569]">Sin brazalete asignado</p>
              <p className="text-xs text-slate-400 mt-0.5">Este bebé no tiene un brazalete de localización activo.</p>
            </div>
            {!readOnly && (
              <button
                type="button"
                className="btn btn-sm text-white mt-1 cursor-pointer"
                style={{ backgroundColor: "#09268E", borderColor: "#09268E" }}
                onClick={() => setShowAssignModal(true)}
              >
                Asignar brazalete
              </button>
            )}
          </div>
        )}
      </div>

      {/* Sub-tabs navegación */}
      <div className="flex gap-1 p-1 bg-slate-100 rounded-xl w-full overflow-x-auto">
        {SUB_TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveSubTab(tab.id)}
            className={[
              "flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition-all duration-150 whitespace-nowrap cursor-pointer flex-1 justify-center",
              activeSubTab === tab.id
                ? "bg-white text-[#09268E] shadow-sm"
                : "text-slate-500 hover:text-slate-700",
            ].join(" ")}
          >
            {tab.label}
            {tab.id === "alertas" && openAlertsCount > 0 && (
              <span className="bg-red-500 text-white text-[10px] font-bold rounded-full px-1.5 py-0.5 leading-none min-w-[18px] text-center">
                {openAlertsCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Sub-tab: Resumen */}
      {activeSubTab === "resumen" && (
        <div className="space-y-4">
          {/* Quick stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <StatCard
              label="Alertas abiertas"
              value={openAlertsCount.toString()}
              highlight={openAlertsCount > 0}
              icon={
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="size-4">
                  <path fillRule="evenodd" d="M9.401 3.003c1.155-2 4.043-2 5.197 0l7.355 12.748c1.154 2-.29 4.5-2.599 4.5H4.645c-2.309 0-3.752-2.5-2.598-4.5L9.4 3.003ZM12 8.25a.75.75 0 0 1 .75.75v3.75a.75.75 0 0 1-1.5 0V9a.75.75 0 0 1 .75-.75Zm0 8.25a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Z" clipRule="evenodd" />
                </svg>
              }
            />
            <StatCard
              label="Asignaciones totales"
              value={loading ? "—" : assignments.length.toString()}
              icon={
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.8" stroke="currentColor" className="size-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757m13.35-.622 1.757-1.757a4.5 4.5 0 0 0-6.364-6.364l-4.5 4.5a4.5 4.5 0 0 0 1.242 7.244" />
                </svg>
              }
            />
            <StatCard
              label="Zona actual"
              value={loading ? "—" : (ubicacion?.ultimaZonaNombre ?? "Sin zona")}
              icon={
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.8" stroke="currentColor" className="size-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
                </svg>
              }
            />
            <StatCard
              label="Última señal"
              value={loading ? "—" : formatRelative(ubicacion?.ultimaDeteccion ?? null)}
              icon={
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.8" stroke="currentColor" className="size-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.288 15.038a5.25 5.25 0 0 1 7.424 0M5.106 11.856c3.807-3.808 9.98-3.808 13.788 0M1.924 8.674c5.565-5.565 14.587-5.565 20.152 0M12.53 18.22l-.53.53-.53-.53a.75.75 0 0 1 1.06 0Z" />
                </svg>
              }
            />
          </div>

          {/* Historial de assignments */}
          <AssignmentHistoryTable assignments={assignments} loading={loading} />
        </div>
      )}

      {/* Sub-tab: Alertas */}
      {activeSubTab === "alertas" && (
        <BabyRecentAlerts
          bebe={bebe}
          readOnly={readOnly}
          onAlertsChanged={() => setAlertsKey(k => k + 1)}
        />
      )}

      {/* Sub-tab: Zonas permitidas */}
      {activeSubTab === "autorizaciones" && (
        <BabyAllowedZonesSection
          bebe={bebe}
          readOnly={readOnly}
          onRefreshLocation={() => void loadData()}
        />
      )}

      {/* Sub-tab: Historial de movimientos */}
      {activeSubTab === "historial" && (
        <BabyMovementHistory
          bebe={bebe}
          assignments={assignments}
          assignmentsLoading={loading}
        />
      )}

      <AssignBraceletModal
        open={showAssignModal}
        bebeId={bebe.id}
        onClose={() => setShowAssignModal(false)}
        onAssigned={() => { void loadData(); }}
      />

      {asignacionActiva && (
        <UnassignBraceletModal
          open={showUnassignModal}
          bebeId={bebe.id}
          brazaleteIdentificador={brazaleteIdentificador}
          onClose={() => setShowUnassignModal(false)}
          onUnassigned={() => { void loadData(); }}
        />
      )}
    </>
  );
}
