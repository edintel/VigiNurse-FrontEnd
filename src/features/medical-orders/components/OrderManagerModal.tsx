"use client";
import { useEffect, useRef, useState } from "react";
import { changeOrderStatus } from "@/features/patients/services/orderService";
import { getEpisodeById } from "@/features/patients/services/episodeService";
import { getPatientStudies } from "@/features/patients/services/medicalImagesService";
import { getOrderAttachments } from "@/features/medical-orders/services/medicalOrdersService";
import {
  OrdenEstado,
  ORDEN_ESTADO_CONFIG,
  TipoOrden,
  TIPO_ORDEN_LABELS,
  OrdenPrioridad,
  ORDEN_PRIORIDAD_CONFIG,
  type OrdenMedicaDto,
  type ArchivoOrdenDto,
} from "@/features/patients/types";
import { LinkPACSStudyModal } from "./LinkPACSStudyModal";
import { formatDate } from "@/features/medical-orders/utils/formatters";
import { Field } from "@/features/medical-orders/components/OrderField";
import { getOrderTypeIconBg, OrderTypeIcon } from "@/features/medical-orders/components/OrderTypeIcon";
import { InProgressForm, CompleteOrderForm, CancelOrderForm } from "./OrderActionForms";
import { toast } from "@/lib/toast";
import { useHasPermission } from "@/lib/hasPermission";

type ActionView = "none" | "en_proceso" | "completar" | "cancelar";

interface Props {
  orden: OrdenMedicaDto;
  onClose: () => void;
  onUpdated: () => void;
}

export function OrderManagerModal({ orden: initialOrden, onClose, onUpdated }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [orden, setOrden] = useState(initialOrden);
  const canLinkPACS = useHasPermission("medicalImaging.upload");

  const estado = orden.estado as OrdenEstado;
  const tipo = orden.tipoOrden as TipoOrden;
  const prioridad = orden.prioridad as OrdenPrioridad;
  const estadoCfg = ORDEN_ESTADO_CONFIG[estado] ?? ORDEN_ESTADO_CONFIG[OrdenEstado.Pendiente];
  const prioridadCfg = ORDEN_PRIORIDAD_CONFIG[prioridad] ?? ORDEN_PRIORIDAD_CONFIG[OrdenPrioridad.Normal];
  const esImagen = tipo === TipoOrden.Imagen;
  const canActuar = estado === OrdenEstado.Pendiente || estado === OrdenEstado.EnProceso;

  const [actionView, setActionView] = useState<ActionView>("none");
  const [actionError, setActionError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [observacion, setObservacion] = useState("");
  const [archivos, setArchivos] = useState<ArchivoOrdenDto[]>([]);
  const [loadingArchivos, setLoadingArchivos] = useState(false);
  const [pacsVinculado, setPacsVinculado] = useState(false);
  const [pacsCheckLoading, setPacsCheckLoading] = useState(false);
  const [showLinkPACS, setShowLinkPACS] = useState(false);

  const [justificacion, setJustificacion] = useState("");

  useEffect(() => { dialogRef.current?.showModal(); }, []);

  useEffect(() => {
    if (!esImagen || !canActuar || !canLinkPACS) return;
    setPacsCheckLoading(true);
    void getEpisodeById(orden.episodioId)
      .then((ep) => getPatientStudies(ep.pacienteId, 1, 1, undefined, undefined, orden.id))
      .then((r) => { if (r.datos.some((e) => e.orthancStudyId !== null)) setPacsVinculado(true); })
      .catch(() => { })
      .finally(() => setPacsCheckLoading(false));
  }, [orden.id]); // eslint-disable-line react-hooks/exhaustive-deps

  function handleClose() { dialogRef.current?.close(); onClose(); }

  function openAction(view: ActionView) {
    setActionView(view);
    setActionError(null);
    setJustificacion("");
    setObservacion("");
    if (view === "completar" && (!esImagen || !canLinkPACS)) {
      setLoadingArchivos(true);
      void getOrderAttachments(orden.id)
        .then(setArchivos)
        .catch(() => setArchivos([]))
        .finally(() => setLoadingArchivos(false));
    }
  }

  async function handleSetInProgress() {
    setSaving(true); setActionError(null);
    try {
      await changeOrderStatus(orden.episodioId, orden.id, {
        nuevoEstado: OrdenEstado.EnProceso,
        comentarioEjecucion: null,
        justificacionCancelacion: null,
      });
      setOrden((o) => ({ ...o, estado: OrdenEstado.EnProceso }));
      setActionView("none");
      toast.success("Orden marcada en proceso.");
      onUpdated();
    } catch {
      setActionError("No se pudo actualizar el estado. Intente nuevamente.");
      toast.error("No se pudo iniciar la orden.");
    }
    finally { setSaving(false); }
  }

  async function handleComplete() {
    setSaving(true); setActionError(null);
    try {
      await changeOrderStatus(orden.episodioId, orden.id, {
        nuevoEstado: OrdenEstado.Completada,
        comentarioEjecucion: observacion.trim(),
        justificacionCancelacion: null,
      });
      setOrden((o) => ({
        ...o,
        estado: OrdenEstado.Completada,
        comentarioEjecucion: observacion.trim(),
        fechaEjecucion: new Date().toISOString(),
      }));
      setActionView("none");
      toast.success("Orden completada correctamente.");
      onUpdated();
    } catch {
      setActionError("No se pudo completar la orden. Intente nuevamente.");
      toast.error("No se pudo completar la orden.");
    }
    finally { setSaving(false); }
  }

  async function handleCancel() {
    if (!justificacion.trim()) return;
    setSaving(true); setActionError(null);
    try {
      await changeOrderStatus(orden.episodioId, orden.id, {
        nuevoEstado: OrdenEstado.Cancelada,
        comentarioEjecucion: null,
        justificacionCancelacion: justificacion.trim(),
      });
      setOrden((o) => ({
        ...o,
        estado: OrdenEstado.Cancelada,
        justificacionCancelacion: justificacion.trim(),
        fechaCancelacion: new Date().toISOString(),
      }));
      setActionView("none");
      toast.success("Orden cancelada correctamente.");
      onUpdated();
    } catch {
      setActionError("No se pudo cancelar la orden. Intente nuevamente.");
      toast.error("No se pudo cancelar la orden.");
    }
    finally { setSaving(false); }
  }

  return (
    <>
      <dialog ref={dialogRef} className="modal">
        <div className="modal-box max-w-2xl p-0 max-h-[90vh] flex flex-col">

          {/* Header */}
          <div className="flex items-start justify-between px-8 py-5 border-b border-[#f1f5f9] flex-shrink-0">
            <h3 className="text-lg font-bold text-[#092168]">Gestión de Orden Médica</h3>
            <button type="button" onClick={handleClose}
              className="btn btn-ghost btn-circle btn-sm text-[#64748b]">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
                strokeWidth="2" stroke="currentColor" className="size-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Scrollable body */}
          <div className="overflow-y-auto flex-1 px-8 py-6 space-y-4">

            {/* ── Order info ────────────────────────────────────────────── */}
            <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm p-5">
              <div className="flex items-start gap-4">
                <div className="rounded-xl p-3 flex-shrink-0"
                  style={{ backgroundColor: getOrderTypeIconBg(tipo) }}>
                  <OrderTypeIcon tipo={tipo} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="text-lg font-bold text-[#1e293b]">
                      {TIPO_ORDEN_LABELS[tipo]}{orden.categoria ? `: ${orden.categoria}` : ""}
                    </h4>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${estadoCfg.bgCls} ${estadoCfg.borderCls} ${estadoCfg.textCls}`}>
                      {estadoCfg.label}
                    </span>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${prioridadCfg.bgCls} ${prioridadCfg.borderCls} ${prioridadCfg.textCls}`}>
                      {prioridadCfg.label}
                    </span>
                  </div>
                  <p className="text-sm text-[#64748b] mt-0.5">Orden #{orden.id} · Episodio #{orden.episodioId}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-6 gap-y-4 mt-5">
                <Field label="Paciente" value={orden.pacienteNombre} />
                <Field label="Cédula" value={orden.cedulaPaciente} />
                <Field label="Área" value={orden.areaNombre} />
                <Field label="Solicitante" value={orden.solicitanteNombre} />
                <Field label="Fecha de emisión" value={formatDate(orden.fechaEmision)} />
              </div>

              {orden.descripcion && (
                <div className="mt-4 bg-[#f8fafc] rounded-lg p-4">
                  <p className="text-[10px] font-bold uppercase tracking-[0.5px] text-[#94a3b8] mb-2">Descripción</p>
                  <p className="text-sm text-[#475569]">{orden.descripcion}</p>
                </div>
              )}
            </div>

            {/* ── Execution details (if Completed) ──────────────────────── */}
            {estado === OrdenEstado.Completada && (
              <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm overflow-hidden"
                style={{ borderLeftWidth: "4px", borderLeftColor: "#00d390" }}>
                <div className="p-5">
                  <p className="text-xs font-bold uppercase tracking-[0.6px] text-[#334155] mb-4">Detalles de Ejecución</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <Field label="Fecha de ejecución" value={formatDate(orden.fechaEjecucion)} />
                      <Field label="Profesional ejecutor" value={orden.ejecutanteNombre} />
                    </div>
                    {orden.comentarioEjecucion && (
                      <div className="rounded-lg p-3 border" style={{ backgroundColor: "rgba(236,253,245,0.5)", borderColor: "#d1fae5" }}>
                        <p className="text-[10px] uppercase tracking-[0.5px] font-bold text-[#94a3b8] mb-1.5">Observaciones</p>
                        <p className="text-sm text-[#475569]">{orden.comentarioEjecucion}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* ── Cancellation details ───────────────────────────────────── */}
            {estado === OrdenEstado.Cancelada && (
              <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm overflow-hidden"
                style={{ borderLeftWidth: "4px", borderLeftColor: "#ff627d" }}>
                <div className="p-5">
                  <p className="text-xs font-bold uppercase tracking-[0.6px] text-[#334155] mb-4">Detalles de Cancelación</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Field label="Fecha de cancelación" value={formatDate(orden.fechaCancelacion)} />
                    {orden.justificacionCancelacion && (
                      <div className="rounded-lg p-3 border" style={{ backgroundColor: "rgba(255,241,242,0.5)", borderColor: "#ffe4e6" }}>
                        <p className="text-[10px] uppercase tracking-[0.5px] font-bold text-[#94a3b8] mb-1.5">Motivo</p>
                        <p className="text-sm text-[#475569]">{orden.justificacionCancelacion}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* ── Action buttons ─────────────────────────────────────────── */}
            {canActuar && actionView === "none" && (
              <div className="flex flex-wrap gap-2 justify-end items-center">
                {pacsCheckLoading && (
                  <span className="loading loading-spinner loading-xs text-[#09268E]" />
                )}
                {estado === OrdenEstado.Pendiente && (
                  <button type="button"
                    onClick={() => openAction("en_proceso")}
                    className="btn btn-sm text-white"
                    style={{ backgroundColor: "#2563eb", borderColor: "#2563eb" }}>
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="size-3.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 0 1 0 1.972l-11.54 6.347a1.125 1.125 0 0 1-1.667-.986V5.653Z" />
                    </svg>
                    Iniciar orden
                  </button>
                )}
                {estado === OrdenEstado.EnProceso && (
                  <button type="button"
                    onClick={() => openAction("completar")}
                    className="btn btn-sm text-white"
                    style={{ backgroundColor: "#059669", borderColor: "#059669" }}>
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="size-3.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                    </svg>
                    Completar orden
                  </button>
                )}
                {!(esImagen && pacsVinculado) && (
                  <button type="button"
                    onClick={() => openAction("cancelar")}
                    className="btn btn-sm btn-outline btn-error">
                    Cancelar orden
                  </button>
                )}
              </div>
            )}

            {/* ── Action forms ───────────────────────────────────────────── */}
            {actionView === "en_proceso" && (
              <InProgressForm
                saving={saving}
                actionError={actionError}
                onVolver={() => setActionView("none")}
                onConfirm={() => void handleSetInProgress()}
              />
            )}

            {actionView === "completar" && (
              <CompleteOrderForm
                ordenId={orden.id}
                esImagen={esImagen}
                canLinkPACS={canLinkPACS}
                saving={saving}
                pacsCheckLoading={pacsCheckLoading}
                pacsVinculado={pacsVinculado}
                observacion={observacion}
                archivos={archivos}
                loadingArchivos={loadingArchivos}
                actionError={actionError}
                onObservacionChange={setObservacion}
                onArchivosChange={setArchivos}
                onVincularPACS={() => setShowLinkPACS(true)}
                onVolver={() => setActionView("none")}
                onConfirm={() => void handleComplete()}
              />
            )}

            {actionView === "cancelar" && (
              <CancelOrderForm
                saving={saving}
                actionError={actionError}
                justificacion={justificacion}
                onJustificacionChange={setJustificacion}
                onVolver={() => setActionView("none")}
                onConfirm={() => void handleCancel()}
              />
            )}
          </div>
        </div>
        <form method="dialog" className="modal-backdrop">
          <button onClick={handleClose}>close</button>
        </form>
      </dialog>

      {/* Link PACS modal stacked */}
      {showLinkPACS && (
        <LinkPACSStudyModal
          orden={orden}
          onClose={() => setShowLinkPACS(false)}
          onVinculado={(descripcion) => {
            setShowLinkPACS(false);
            setPacsVinculado(true);
            setObservacion(descripcion ?? "");
          }}
        />
      )}
    </>
  );
}
