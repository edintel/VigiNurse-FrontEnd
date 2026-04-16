"use client";
import { useEffect, useState } from "react";
import { changeOrderStatus } from "@/features/patients/services/orderService";
import {
  getOrderAttachments,
  downloadOrderAttachment,
} from "@/features/medical-orders/services/medicalOrdersService";
import { getPatientStudies } from "@/features/patients/services/medicalImagesService";
import { OHIFViewerModal } from "@/features/patients/components/medicalImages/OHIFViewerModal";
import type { ArchivoOrdenDto, EstudioImagen } from "@/features/patients/types";
import {
  OrdenEstado,
  ORDEN_ESTADO_CONFIG,
  TipoOrden,
  TIPO_ORDEN_LABELS,
  OrdenPrioridad,
  ORDEN_PRIORIDAD_CONFIG,
  type Dato,
} from "@/features/patients/types";
import { formatDate } from "@/features/medical-orders/utils/formatters";
import { Field } from "@/features/medical-orders/components/OrderField";
import { getOrderTypeIconBg, OrderTypeIcon } from "@/features/medical-orders/components/OrderTypeIcon";
import { toast } from "@/lib/toast";

interface OrderDetailModalProps {
  orden: Dato;
  episodioId: number;
  pacienteId: number;
  onClose: () => void;
  onCancelled: () => void;
}

export function OrderDetailModal({
  orden,
  episodioId,
  pacienteId,
  onClose,
  onCancelled,
}: OrderDetailModalProps) {
  const [showCancelForm, setShowCancelForm] = useState(false);
  const [justificacion, setJustificacion] = useState("");
  const [cancelling, setCancelling] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);

  const [archivos, setArchivos] = useState<ArchivoOrdenDto[]>([]);
  const [loadingArchivos, setLoadingArchivos] = useState(true);
  const [downloadingId, setDownloadingId] = useState<number | null>(null);

  const [estudioVinculado, setEstudioVinculado] = useState<EstudioImagen | null>(null);
  const [showVisor, setShowVisor] = useState(false);

  useEffect(() => {
    void (async () => {
      try {
        const lista = await getOrderAttachments(orden.id);
        setArchivos(lista);
      } catch {
        toast.error("No se pudieron cargar los archivos adjuntos de la orden.");
      } finally {
        setLoadingArchivos(false);
      }
    })();

    if ((orden.tipoOrden as TipoOrden) === TipoOrden.Imagen &&
        (orden.estado as OrdenEstado) === OrdenEstado.Completada) {
      void getPatientStudies(pacienteId, 1, 1, undefined, undefined, orden.id)
        .then((r) => setEstudioVinculado(r.datos[0] ?? null))
        .catch(() => {
          setEstudioVinculado(null);
          toast.error("No se pudo cargar el estudio vinculado para visualizar la imagen.");
        });
    }
  }, [orden.id, orden.tipoOrden, orden.estado, pacienteId]);

  const estado = orden.estado as OrdenEstado;
  const tipo = orden.tipoOrden as TipoOrden;
  const prioridad = orden.prioridad as OrdenPrioridad;

  const estadoCfg =
    ORDEN_ESTADO_CONFIG[estado] ?? ORDEN_ESTADO_CONFIG[OrdenEstado.Pendiente];
  const prioridadCfg =
    ORDEN_PRIORIDAD_CONFIG[prioridad] ??
    ORDEN_PRIORIDAD_CONFIG[OrdenPrioridad.Normal];

  async function handleConfirmCancel() {
    if (!justificacion.trim()) {
      toast.error("La justificación de cancelación es obligatoria.");
      return;
    }
    setCancelling(true);
    setCancelError(null);
    try {
      await changeOrderStatus(episodioId, orden.id, {
        nuevoEstado: OrdenEstado.Cancelada,
        comentarioEjecucion: null,
        justificacionCancelacion: justificacion.trim(),
      });
      toast.success("Orden cancelada correctamente.");
      onCancelled();
    } catch {
      setCancelError("No se pudo cancelar la orden. Intente nuevamente.");
      toast.error("No se pudo cancelar la orden.");
      setCancelling(false);
    }
  }

  async function handleDownload(archivo: ArchivoOrdenDto) {
    setDownloadingId(archivo.id);
    try {
      const blob = await downloadOrderAttachment(archivo.id);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = archivo.nombreOriginal;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Archivo descargado correctamente.");
    } catch {
      toast.error("No se pudo descargar el archivo adjunto.");
    } finally {
      setDownloadingId(null);
    }
  }

  return (
    <>
    {showVisor && estudioVinculado && (
      <OHIFViewerModal
        estudio={estudioVinculado}
        onClose={() => setShowVisor(false)}
      />
    )}
    <dialog open className="modal modal-open">
      <div className="modal-box max-w-2xl p-0 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between px-8 py-5 border-b border-[#f1f5f9] flex-shrink-0">
          <div>
            <h3 className="text-lg font-bold text-[#092168]">
              Detalle de la Orden
            </h3>

          </div>
          <button
            type="button"
            onClick={onClose}
            className="btn btn-ghost btn-circle btn-sm text-[#64748b]"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="2"
              stroke="currentColor"
              className="size-4"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18 18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Scrollable content */}
        <div className="overflow-y-auto flex-1 px-8 py-6 space-y-4">
          {/* Card 1 — Order info */}
          <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm">
            <div className="p-5">
              <div className="flex items-start gap-4">
                <div
                  className="rounded-xl p-3 flex-shrink-0"
                  style={{ backgroundColor: getOrderTypeIconBg(tipo) }}
                >
                  <OrderTypeIcon tipo={tipo} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="text-lg font-bold text-[#1e293b]">
                      {TIPO_ORDEN_LABELS[tipo]}: {orden.categoria}
                    </h4>
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${estadoCfg.bgCls} ${estadoCfg.borderCls} ${estadoCfg.textCls}`}
                    >
                      {estadoCfg.label}
                    </span>
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${prioridadCfg.bgCls} ${prioridadCfg.borderCls} ${prioridadCfg.textCls}`}
                    >
                      {prioridadCfg.label}
                    </span>
                  </div>
                  <p className="text-sm text-[#64748b] mt-0.5">
                    ID de Orden: {orden.id}
                  </p>
                </div>
              </div>

              {/* Metadata */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-6 gap-y-4 mt-5">
                <Field
                  label="Tipo de Orden"
                  value={TIPO_ORDEN_LABELS[tipo]}
                />
                <Field label="Categoría" value={orden.categoria} />
                <Field
                  label="Fecha de Solicitud"
                  value={formatDate(orden.fechaEmision)}
                />
                <Field
                  label="Médico Solicitante"
                  value={orden.solicitanteNombre}
                />
              </div>

              {/* Description */}
              <div className="mt-4 bg-[#f8fafc] rounded-lg p-4">
                <p className="text-[10px] font-bold uppercase tracking-[0.5px] text-[#94a3b8] mb-2">
                  Descripción de la solicitud
                </p>
                <p className="text-sm text-[#475569]">{orden.descripcion}</p>
              </div>
            </div>
          </div>

          {/* Card 2 — Execution details */}
          {estado === OrdenEstado.Completada && (
            <div
              className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm overflow-hidden"
              style={{ borderLeftWidth: "4px", borderLeftColor: "#00d390" }}
            >
              <div className="p-5">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-xs font-bold uppercase tracking-[0.6px] text-[#334155]">
                    Detalles de Ejecución
                  </p>
                  {estudioVinculado && (
                    <button
                      type="button"
                      onClick={() => setShowVisor(true)}
                      className="btn btn-xs text-white gap-1.5"
                      style={{ backgroundColor: "#7e22ce", borderColor: "#7e22ce" }}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none"
                        viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor"
                        className="size-3.5">
                        <path strokeLinecap="round" strokeLinejoin="round"
                          d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                        <path strokeLinecap="round" strokeLinejoin="round"
                          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      Ver imagen
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div className="flex items-start gap-2">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth="1.8"
                        stroke="#94a3b8"
                        className="size-4 mt-0.5 flex-shrink-0"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5"
                        />
                      </svg>
                      <div>
                        <p className="text-[10px] uppercase tracking-[0.5px] font-bold text-[#94a3b8]">
                          Fecha de ejecución
                        </p>
                        <p className="text-sm font-semibold text-[#334155]">
                          {formatDate(orden.fechaEjecucion)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth="1.8"
                        stroke="#94a3b8"
                        className="size-4 mt-0.5 flex-shrink-0"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z"
                        />
                      </svg>
                      <div>
                        <p className="text-[10px] uppercase tracking-[0.5px] font-bold text-[#94a3b8]">
                          Profesional ejecutor
                        </p>
                        <p className="text-sm font-semibold text-[#334155]">
                          {orden.ejecutanteNombre ?? "—"}
                        </p>
                      </div>
                    </div>
                  </div>
                  {orden.comentarioEjecucion && (
                    <div
                      className="rounded-lg p-3 border"
                      style={{
                        backgroundColor: "rgba(236,253,245,0.5)",
                        borderColor: "#d1fae5",
                      }}
                    >
                      <p className="text-[10px] uppercase tracking-[0.5px] font-bold text-[#94a3b8] mb-1.5">
                        Observaciones
                      </p>
                      <p className="text-sm text-[#475569]">
                        {orden.comentarioEjecucion}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Card 2 — Cancellation details */}
          {estado === OrdenEstado.Cancelada && (
            <div
              className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm overflow-hidden"
              style={{ borderLeftWidth: "4px", borderLeftColor: "#ff627d" }}
            >
              <div className="p-5">
                <p className="text-xs font-bold uppercase tracking-[0.6px] text-[#334155] mb-4">
                  Detalles de Cancelación
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.5px] font-bold text-[#94a3b8]">
                      Fecha de cancelación
                    </p>
                    <p className="text-sm font-semibold text-[#334155] mt-0.5">
                      {formatDate(orden.fechaCancelacion)}
                    </p>
                  </div>
                  {orden.justificacionCancelacion && (
                    <div
                      className="rounded-lg p-3 border"
                      style={{
                        backgroundColor: "rgba(255,241,242,0.5)",
                        borderColor: "#ffe4e6",
                      }}
                    >
                      <p className="text-[10px] uppercase tracking-[0.5px] font-bold text-[#94a3b8] mb-1.5">
                        Motivo de cancelación
                      </p>
                      <p className="text-sm text-[#475569]">
                        {orden.justificacionCancelacion}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Archivos adjuntos */}
          {!loadingArchivos && archivos.length > 0 && (
            <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm">
              <div className="p-5">
                <p className="text-xs font-bold uppercase tracking-[0.6px] text-[#334155] mb-3">
                  Archivos adjuntos
                </p>
                <ul className="space-y-2">
                  {archivos.map((archivo) => (
                    <li
                      key={archivo.id}
                      className="flex items-center justify-between gap-3 bg-[#f8fafc] rounded-lg px-4 py-2.5 border border-[#E2E8F0]"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none"
                          viewBox="0 0 24 24" strokeWidth="1.8" stroke="#64748b"
                          className="size-4 flex-shrink-0">
                          <path strokeLinecap="round" strokeLinejoin="round"
                            d="M18.375 12.739l-7.693 7.693a4.5 4.5 0 0 1-6.364-6.364l10.94-10.94A3 3 0 1 1 19.5 7.372L8.552 18.32m.009-.01-.01.01m5.699-9.941-7.81 7.81a1.5 1.5 0 0 0 2.112 2.13" />
                        </svg>
                        <span className="text-sm text-[#334155] truncate">
                          {archivo.nombreOriginal}
                        </span>
                      </div>
                      <button
                        type="button"
                        title="Descargar archivo"
                        disabled={downloadingId === archivo.id}
                        onClick={() => void handleDownload(archivo)}
                        className="btn btn-xs btn-ghost text-[#09268E] flex-shrink-0"
                      >
                        {downloadingId === archivo.id ? (
                          <span className="loading loading-spinner loading-xs" />
                        ) : (
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none"
                            viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor"
                            className="size-4">
                            <path strokeLinecap="round" strokeLinejoin="round"
                              d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
                          </svg>
                        )}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Cancel section — only when Pendiente */}
          {estado === OrdenEstado.Pendiente && (
            <div>
              {!showCancelForm ? (
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => setShowCancelForm(true)}
                    className="btn btn-sm btn-outline btn-error gap-1.5"
                  >
                    Cancelar orden
                  </button>
                </div>
              ) : (
                <div className="bg-white rounded-xl border border-[#fecdd3] shadow-sm p-5 space-y-4">
                  <p className="text-sm font-bold text-[#e11d48]">
                    Cancelar orden médica
                  </p>

                  {cancelError && (
                    <div role="alert" className="alert alert-error text-sm py-2.5">
                      <span>{cancelError}</span>
                    </div>
                  )}

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[#64748b] text-[11px] font-bold uppercase tracking-[0.55px]">
                      Justificación <span className="text-[#f43f5e]">*</span>
                    </label>
                    <textarea
                      className="bg-[#f8fafc] border border-[#e2e8f0] rounded-lg w-full px-4 py-3 text-sm text-[#0f172a] placeholder:text-[#6b7280] min-h-[100px] focus:outline-none focus:border-[#09268E] transition-colors resize-none"
                      placeholder="Ingrese el motivo de cancelación..."
                      value={justificacion}
                      onChange={(e) => setJustificacion(e.target.value)}
                    />
                  </div>

                  <div className="flex items-center justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setShowCancelForm(false);
                        setJustificacion("");
                        setCancelError(null);
                      }}
                      className="btn btn-ghost btn-sm text-[#475569]"
                    >
                      Volver
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleConfirmCancel()}
                      disabled={!justificacion.trim() || cancelling}
                      className="btn btn-sm btn-error font-bold gap-1.5 disabled:opacity-60"
                    >
                      {cancelling ? (
                        <span className="loading loading-spinner loading-xs" />
                      ) : null}
                      Confirmar cancelación
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>


      </div>
      <div className="modal-backdrop" onClick={onClose} />
    </dialog>
    </>
  );
}
