"use client";
import { useState } from "react";
import type { ReactNode } from "react";
import { cambiarEstadoOrden } from "@/features/patients/services/ordenService";
import {
  OrdenEstado,
  ORDEN_ESTADO_CONFIG,
  TipoOrden,
  TIPO_ORDEN_LABELS,
  OrdenPrioridad,
  ORDEN_PRIORIDAD_CONFIG,
  type Dato,
} from "@/features/patients/types";

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "—";
  try {
    const d = new Date(dateStr);
    const date = d.toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
    const time = d.toLocaleTimeString("es-ES", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
    return `${date} ${time}`;
  } catch {
    return dateStr;
  }
}

function Field({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[10px] font-bold uppercase tracking-[0.5px] text-[#94a3b8]">
        {label}
      </span>
      <span className="text-sm font-semibold text-[#334155]">{value ?? "—"}</span>
    </div>
  );
}


// Funcion para obtener el color de fondo del icono según el tipo de orden
function getTipoIconBg(tipo: TipoOrden): string {
  const map: Record<TipoOrden, string> = {
    [TipoOrden.Laboratorio]: "#eff6ff",
    [TipoOrden.Imagen]: "#f3e8ff",
    [TipoOrden.Medicamento]: "#ecfdf5",
    [TipoOrden.Procedimiento]: "#fff7ed",
    [TipoOrden.Interconsulta]: "#f0fdfa",
    [TipoOrden.Otro]: "#f1f5f9",
  };
  return map[tipo] ?? "#f1f5f9";
}

function getTipoIconColor(tipo: TipoOrden): string {
  const map: Record<TipoOrden, string> = {
    [TipoOrden.Laboratorio]: "#2563eb",
    [TipoOrden.Imagen]: "#7e22ce",
    [TipoOrden.Medicamento]: "#059669",
    [TipoOrden.Procedimiento]: "#ea580c",
    [TipoOrden.Interconsulta]: "#0d9488",
    [TipoOrden.Otro]: "#64748b",
  };
  return map[tipo] ?? "#64748b";
}

function TipoIcon({ tipo }: { tipo: TipoOrden }) {
  const color = getTipoIconColor(tipo);
  const props = {
    xmlns: "http://www.w3.org/2000/svg",
    fill: "none",
    viewBox: "0 0 24 24",
    strokeWidth: "1.8",
    stroke: color,
    className: "size-6",
  };
  switch (tipo) {
    case TipoOrden.Laboratorio:
      return (
        <svg {...props}>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9.75 3.104v5.714a2.25 2.25 0 0 1-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 0 1 4.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0 1 12 15a9.065 9.065 0 0 1-6.23-.693L4.2 15.3m15.6 0-1.58 5.583A2.25 2.25 0 0 1 15.94 22H8.06a2.25 2.25 0 0 1-2.18-1.117L4.2 15.3"
          />
        </svg>
      );
    case TipoOrden.Imagen:
      return (
        <svg {...props}>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0ZM18.75 10.5h.008v.008h-.008V10.5Z"
          />
        </svg>
      );
    case TipoOrden.Medicamento:
      return (
        <svg {...props}>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z"
          />
        </svg>
      );
    case TipoOrden.Procedimiento:
      return (
        <svg {...props}>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M11.42 15.17 17.25 21A2.652 2.652 0 0 0 21 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 1 1-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 0 0 4.486-6.336l-3.276 3.277a3.004 3.004 0 0 1-2.25-2.25l3.276-3.276a4.5 4.5 0 0 0-6.336 4.486c.091 1.076-.071 2.264-.904 2.95l-.102.085m-1.745 1.437L5.909 7.5H4.5L2.25 3.75l1.5-1.5L7.5 4.5v1.409l4.26 4.26m-1.745 1.437 1.745-1.437m6.615 8.206L15.75 15.75M4.867 19.125h.008v.008h-.008v-.008Z"
          />
        </svg>
      );
    case TipoOrden.Interconsulta:
      return (
        <svg {...props}>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z"
          />
        </svg>
      );
    default:
      return (
        <svg {...props}>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z"
          />
        </svg>
      );
  }
}

interface OrdenDetailModalProps {
  orden: Dato;
  episodioId: number;
  onClose: () => void;
  onCancelled: () => void;
}

// Componente principal del modal de detalle de orden
export function OrdenDetailModal({
  orden,
  episodioId,
  onClose,
  onCancelled,
}: OrdenDetailModalProps) {
  const [showCancelForm, setShowCancelForm] = useState(false);
  const [justificacion, setJustificacion] = useState("");
  const [cancelling, setCancelling] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);

  const estado = orden.estado as OrdenEstado;
  const tipo = orden.tipoOrden as TipoOrden;
  const prioridad = orden.prioridad as OrdenPrioridad;

  const estadoCfg =
    ORDEN_ESTADO_CONFIG[estado] ?? ORDEN_ESTADO_CONFIG[OrdenEstado.Pendiente];
  const prioridadCfg =
    ORDEN_PRIORIDAD_CONFIG[prioridad] ??
    ORDEN_PRIORIDAD_CONFIG[OrdenPrioridad.Normal];

  async function handleConfirmCancel() {
    if (!justificacion.trim()) return;
    setCancelling(true);
    setCancelError(null);
    try {
      await cambiarEstadoOrden(episodioId, orden.id, {
        nuevoEstado: OrdenEstado.Cancelada,
        comentarioEjecucion: null,
        justificacionCancelacion: justificacion.trim(),
      });
      onCancelled();
    } catch {
      setCancelError("No se pudo cancelar la orden. Intente nuevamente.");
      setCancelling(false);
    }
  }

  return (
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
                  style={{ backgroundColor: getTipoIconBg(tipo) }}
                >
                  <TipoIcon tipo={tipo} />
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
                <p className="text-xs font-bold uppercase tracking-[0.6px] text-[#334155] mb-4">
                  Detalles de Ejecución
                </p>
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
  );
}
