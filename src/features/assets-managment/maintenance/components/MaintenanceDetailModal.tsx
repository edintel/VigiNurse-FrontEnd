"use client";
import { useEffect, useRef, useState } from "react";
import { changeMantenimientoEstado } from "@/features/assets-managment/maintenance/services/maintenanceService";
import { getActivoById } from "@/features/assets-managment/inventory/services/assetService";
import {
  MantenimientoEstado,
  MantenimientoTipo,
} from "@/features/assets-managment/maintenance/types";
import type { Mantenimiento } from "@/features/assets-managment/maintenance/types";
import type { Activo } from "@/features/assets-managment/inventory/types";
import { toast } from "@/lib/toast";

interface MantenimientoDetailModalProps {
  open: boolean;
  mantenimiento: Mantenimiento | null;
  onClose: () => void;
  onUpdated: (m: Mantenimiento) => void;
}

// Obtiene la fecha de hoy en formato YYYY-MM-DD
function getTodayStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

// Un mantenimiento se considera vencido si está programado y su fecha programada es anterior a hoy
function isVencido(m: Mantenimiento): boolean {
  return (
    m.estado === MantenimientoEstado.Programado &&
    m.fechaProgramada.slice(0, 10) < getTodayStr()
  );
}

// Devuelve la etiqueta de estado, considerando el caso especial de "Vencido"
function getEstadoLabel(m: Mantenimiento): string {
  if (isVencido(m)) return "Vencido";
  switch (m.estado) {
    case MantenimientoEstado.EnProceso:
      return "En Proceso";
    case MantenimientoEstado.Finalizado:
      return "Finalizado";
    case MantenimientoEstado.Cancelado:
      return "Cancelado";
    default:
      return "Programado";
  }
}

// Devuelve el color asociado al estado, considerando el caso especial de "Vencido"
function getEstadoColor(m: Mantenimiento): string {
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

// Formatea una fecha ISO a formato DD/MM/YYYY, o devuelve "—" si no es válida
function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return `${String(d.getUTCDate()).padStart(2, "0")}/${String(d.getUTCMonth() + 1).padStart(2, "0")}/${d.getUTCFullYear()}`;
}

// Limite máximo de caracteres para el campo de resultado/observaciones
const MAX_RESULTADO = 500;

// Componente principal del modal de detalle de mantenimiento
export function MantenimientoDetailModal({
  open,
  mantenimiento,
  onClose,
  onUpdated,
}: MantenimientoDetailModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const cancelDialogRef = useRef<HTMLDialogElement>(null);
  const finalizeDialogRef = useRef<HTMLDialogElement>(null);

  const [activo, setActivo] = useState<Activo | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [resultado, setResultado] = useState("");
  const [razonCancelacion, setRazonCancelacion] = useState("");
  const [razonError, setRazonError] = useState("");
  const [apiError, setApiError] = useState<string | null>(null);

  // Cuando se abre el modal o cambia el mantenimiento, resetea estados y carga el activo
  useEffect(() => {
    if (open && mantenimiento) {
      dialogRef.current?.showModal();
      setActivo(null);
      setResultado(mantenimiento.resultado ?? "");
      setRazonCancelacion("");
      setRazonError("");
      setApiError(null);

      getActivoById(mantenimiento.activoId)
        .then(setActivo)
        .catch(() => {});
    } else {
      dialogRef.current?.close();
      cancelDialogRef.current?.close();
    }
  }, [open, mantenimiento]);

  // Maneja la acción de iniciar el mantenimiento, cambiando su estado a "En Proceso"
  async function handleIniciar() {
    if (!mantenimiento) return;
    setActionLoading(true);
    setApiError(null);
    try {
      const updated = await changeMantenimientoEstado(
        mantenimiento.activoId,
        mantenimiento.id,
        {
          nuevoEstado: MantenimientoEstado.EnProceso,
          resultado: null,
          nuevoEstadoActivo: null,
          razonCancelacion: null,
        },
      );
      toast.success("Mantenimiento iniciado.");
      onUpdated(updated);
    } catch (err: unknown) {
      const msg =
        extractErrorMsg(err) ?? "No se pudo iniciar el mantenimiento.";
      setApiError(msg);
      toast.error(msg);
    } finally {
      setActionLoading(false);
    }
  }

  // Abre el diálogo de confirmación para finalizar el mantenimiento
  function openFinalizeDialog() {
    finalizeDialogRef.current?.showModal();
  }

  // Maneja la acción de finalizar el mantenimiento, cambiando su estado a "Finalizado" y guardando el resultado
  async function handleFinalizar() {
    if (!mantenimiento) return;
    setActionLoading(true);
    setApiError(null);
    try {
      finalizeDialogRef.current?.close();
      const updated = await changeMantenimientoEstado(
        mantenimiento.activoId,
        mantenimiento.id,
        {
          nuevoEstado: MantenimientoEstado.Finalizado,
          resultado: resultado || null,
          nuevoEstadoActivo: 0,
          razonCancelacion: null,
        },
      );
      toast.success("Mantenimiento finalizado.");
      onUpdated(updated);
    } catch (err: unknown) {
      const msg =
        extractErrorMsg(err) ?? "No se pudo finalizar el mantenimiento.";
      setApiError(msg);
      toast.error(msg);
    } finally {
      setActionLoading(false);
    }
  }

  function openCancelDialog() {
    setRazonCancelacion("");
    setRazonError("");
    cancelDialogRef.current?.showModal();
  }

  async function handleCancelar() {
    if (!mantenimiento) return;
    if (!razonCancelacion.trim()) {
      setRazonError("La razón de cancelación es obligatoria.");
      return;
    }
    setActionLoading(true);
    setApiError(null);
    try {
      const updated = await changeMantenimientoEstado(
        mantenimiento.activoId,
        mantenimiento.id,
        {
          nuevoEstado: MantenimientoEstado.Cancelado,
          resultado: null,
          nuevoEstadoActivo: 0,
          razonCancelacion: razonCancelacion.trim(),
        },
      );
      toast.success("Mantenimiento cancelado.");
      cancelDialogRef.current?.close();
      onUpdated(updated);
    } catch (err: unknown) {
      const msg =
        extractErrorMsg(err) ?? "No se pudo cancelar el mantenimiento.";
      setApiError(msg);
      toast.error(msg);
    } finally {
      setActionLoading(false);
    }
  }

  if (!mantenimiento) return null;

  const isFinal =
    mantenimiento.estado === MantenimientoEstado.Finalizado ||
    mantenimiento.estado === MantenimientoEstado.Cancelado;
  const isProgramado = mantenimiento.estado === MantenimientoEstado.Programado;
  const isEnProceso = mantenimiento.estado === MantenimientoEstado.EnProceso;
  const isFinalizado = mantenimiento.estado === MantenimientoEstado.Finalizado;
  const isCancelado = mantenimiento.estado === MantenimientoEstado.Cancelado;

  const estadoColor = getEstadoColor(mantenimiento);
  const estadoLabel = getEstadoLabel(mantenimiento);

  const activoDisplay = activo
    ? `${activo.tipoActivoNombre} — ${activo.marca} ${activo.modelo}`
    : "—";
  const areaNombre =
    mantenimiento.activoAreaNombre ?? activo?.areaNombre ?? "—";

  return (
    <>
      <dialog ref={dialogRef} className="modal" onClose={onClose}>
        <div className="modal-box bg-[#EEEEEE] w-full max-w-2xl p-0 overflow-hidden flex flex-col max-h-[90vh]">
          {/* Header */}
          <div className="flex items-start justify-between px-6 pt-5 pb-4 bg-[#EEEEEE]">
            <div>
              <h3 className="text-lg font-bold text-[#1A2B5E]">
                Detalle de Mantenimiento
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                ID: {mantenimiento.id}
                {mantenimiento.activoNumeroSerie && (
                  <> | ACTIVO: {mantenimiento.activoNumeroSerie}</>
                )}
              </p>
            </div>
            <button
              type="button"
              className="text-gray-400 hover:text-[#1A2B5E] transition-colors ml-4 mt-0.5"
              onClick={onClose}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="2.5"
                stroke="currentColor"
                className="size-5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18 18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* Scrollable body */}
          <div className="overflow-y-auto flex-1 px-6 pb-6 space-y-4">
            {apiError && (
              <div role="alert" className="alert alert-error text-sm py-3">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 shrink-0 stroke-current"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span>{apiError}</span>
              </div>
            )}

            {/* Status card */}
            <div className="bg-white rounded-xl border border-[#E2E8F0] p-4">
              <div className="grid grid-cols-3 divide-x divide-[#E2E8F0]">
                {/* Tipo */}
                <div className="flex flex-col items-center gap-1.5 px-4 first:pl-0">
                  <span className="text-xs text-slate-400 font-medium uppercase tracking-wide">
                    Tipo
                  </span>
                  <span
                    className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border"
                    style={
                      mantenimiento.tipo === MantenimientoTipo.Preventivo
                        ? {
                            backgroundColor: "rgba(59,130,246,0.08)",
                            borderColor: "rgba(59,130,246,0.25)",
                            color: "#3b82f6",
                          }
                        : {
                            backgroundColor: "rgba(252,188,19,0.1)",
                            borderColor: "rgba(252,188,19,0.3)",
                            color: "#b45309",
                          }
                    }
                  >
                    {mantenimiento.tipo === MantenimientoTipo.Preventivo
                      ? "Preventivo"
                      : "Correctivo"}
                  </span>
                </div>
                {/* Estado */}
                <div className="flex flex-col items-center gap-1.5 px-4">
                  <span className="text-xs text-slate-400 font-medium uppercase tracking-wide">
                    Estado
                  </span>
                  <span
                    className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold"
                    style={{ backgroundColor: estadoColor, color: "#fff" }}
                  >
                    {estadoLabel}
                  </span>
                </div>
                {/* Fecha programada */}
                <div className="flex flex-col items-center gap-1.5 px-4">
                  <span className="text-xs text-slate-400 font-medium uppercase tracking-wide">
                    Fecha programada
                  </span>
                  <span className="text-sm font-semibold text-[#1A2B5E]">
                    {formatDate(mantenimiento.fechaProgramada)}
                  </span>
                </div>
              </div>
            </div>

            {/* Info card */}
            <div className="bg-white rounded-xl border border-[#E2E8F0] p-4 space-y-3">
              <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Información del Mantenimiento
              </h4>
              <div className="space-y-2.5">
                <InfoRow label="Razón" value={mantenimiento.razon} />
                <InfoRow
                  label="Activo"
                  value={activoDisplay}
                  loading={!activo}
                />
                <InfoRow
                  label="Responsable"
                  value={mantenimiento.nombreResponsable}
                />
                {mantenimiento.nombreProgramador && (
                  <InfoRow
                    label="Programado por"
                    value={mantenimiento.nombreProgramador}
                  />
                )}
                {mantenimiento.fechaCreacion && (
                  <InfoRow
                    label="Fecha de creación"
                    value={formatDate(mantenimiento.fechaCreacion)}
                  />
                )}
                <InfoRow
                  label="Área"
                  value={areaNombre}
                  loading={!activo && !mantenimiento.activoAreaNombre}
                />
              </div>
            </div>

            {/* Result card — En Proceso (editable) */}
            {isEnProceso && (
              <div className="bg-white rounded-xl border border-[#E2E8F0] p-4 space-y-3">
                <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Resultado / Observaciones
                </h4>
                <div className="form-control w-full">
                  <textarea
                    className="textarea textarea-bordered bg-[#F8FAFC] text-sm resize-none w-full"
                    rows={4}
                    maxLength={MAX_RESULTADO}
                    placeholder="Describe el resultado o las observaciones del mantenimiento..."
                    value={resultado}
                    onChange={(e) => setResultado(e.target.value)}
                  />
                  <div className="text-right text-xs text-slate-400 mt-1">
                    {resultado.length}/{MAX_RESULTADO}
                  </div>
                </div>
              </div>
            )}

            {/* Result card */}
            {isFinalizado && (
              <div
                className="rounded-xl border p-4 space-y-2"
                style={{
                  backgroundColor: "rgba(0,211,144,0.06)",
                  borderColor: "rgba(0,211,144,0.3)",
                }}
              >
                <h4
                  className="text-xs font-semibold uppercase tracking-wide"
                  style={{ color: "#00d390" }}
                >
                  Resultado del Mantenimiento
                </h4>
                {mantenimiento.fechaFinalizacion && (
                  <p className="text-xs text-slate-500">
                    Finalizado el {formatDate(mantenimiento.fechaFinalizacion)}
                  </p>
                )}
                <p className="text-sm text-slate-700 whitespace-pre-wrap">
                  {mantenimiento.resultado || (
                    <span className="italic text-slate-400">
                      Sin observaciones registradas.
                    </span>
                  )}
                </p>
              </div>
            )}

            {/* Cancellation card — Cancelado */}
            {isCancelado && (
              <div
                className="rounded-xl border p-4 space-y-2"
                style={{
                  backgroundColor: "rgba(255,98,125,0.06)",
                  borderColor: "rgba(255,98,125,0.3)",
                }}
              >
                <h4
                  className="text-xs font-semibold uppercase tracking-wide"
                  style={{ color: "#ff627d" }}
                >
                  Mantenimiento Cancelado
                </h4>
                {mantenimiento.fechaCancelacion && (
                  <p className="text-xs text-slate-500">
                    Cancelado el {formatDate(mantenimiento.fechaCancelacion)}
                  </p>
                )}
                <p className="text-sm text-slate-700 whitespace-pre-wrap">
                  {mantenimiento.razonCancelacion || (
                    <span className="italic text-slate-400">
                      Sin razón registrada.
                    </span>
                  )}
                </p>
              </div>
            )}
          </div>

          {/* Footer action bar */}
          {!isFinal && (
            <div className="flex items-center justify-between gap-3 px-6 py-4 bg-[#EEEEEE] border-t border-[#E2E8F0]">
              <button
                type="button"
                className="btn btn-sm text-white"
                style={{ backgroundColor: "#ff627d", borderColor: "#ff627d" }}
                onClick={openCancelDialog}
                disabled={actionLoading}
              >
                Cancelar mantenimiento
              </button>

              <div className="flex gap-2">
                <button
                  type="button"
                  className="btn btn-sm text-white"
                  style={{ backgroundColor: "#09268E", borderColor: "#09268E" }}
                  onClick={isProgramado ? handleIniciar : openFinalizeDialog}
                  disabled={actionLoading || (isEnProceso && !resultado.trim())}
                >
                  {actionLoading && (
                    <span className="loading loading-spinner loading-xs" />
                  )}
                  {isProgramado
                    ? "Iniciar mantenimiento"
                    : "Finalizar mantenimiento"}
                </button>
              </div>
            </div>
          )}
        </div>
        <form method="dialog" className="modal-backdrop">
          <button type="submit" onClick={onClose}>
            close
          </button>
        </form>
      </dialog>

      {/* Finalize confirmation dialog */}
      <dialog ref={finalizeDialogRef} className="modal">
        <div className="modal-box bg-[#EEEEEE] w-full max-w-md">
          <button
            type="button"
            className="absolute right-3 top-3 text-gray-400 hover:text-[#1A2B5E] transition-colors"
            onClick={() => finalizeDialogRef.current?.close()}
          >
            ✕
          </button>
          <h3 className="text-base font-bold text-[#1A2B5E] mb-1">
            Finalizar mantenimiento
          </h3>
          <p className="text-sm text-slate-500 mb-4">
            Esta acción no se puede deshacer. ¿Estás seguro de que deseas
            finalizar este mantenimiento?
          </p>
          <div className="modal-action mt-4">
            <button
              type="button"
              className="btn btn-sm btn-ghost"
              onClick={() => finalizeDialogRef.current?.close()}
              disabled={actionLoading}
            >
              Cancelar
            </button>
            <button
              type="button"
              className="btn btn-sm text-white"
              style={{ backgroundColor: "#09268E", borderColor: "#09268E" }}
              onClick={handleFinalizar}
              disabled={actionLoading}
            >
              {actionLoading && (
                <span className="loading loading-spinner loading-xs" />
              )}
              Confirmar finalización
            </button>
          </div>
        </div>
        <form method="dialog" className="modal-backdrop">
          <button type="submit">close</button>
        </form>
      </dialog>

      {/* Cancel confirmation dialog */}
      <dialog ref={cancelDialogRef} className="modal">
        <div className="modal-box bg-[#EEEEEE] w-full max-w-md">
          <button
            type="button"
            className="absolute right-3 top-3 text-gray-400 hover:text-[#1A2B5E] transition-colors"
            onClick={() => cancelDialogRef.current?.close()}
          >
            ✕
          </button>
          <h3 className="text-base font-bold text-[#1A2B5E] mb-1">
            Cancelar mantenimiento
          </h3>
          <p className="text-sm text-slate-500 mb-4">
            Esta acción no se puede deshacer. Indica la razón de cancelación.
          </p>

          <div className="form-control w-full">
            <label className="label pb-1">
              <span
                className="label-text text-sm font-medium"
                style={{ color: "#1A2B5E" }}
              >
                Razón de cancelación <span className="text-red-500">*</span>
              </span>
            </label>
            <textarea
              className={`textarea textarea-bordered bg-white text-sm resize-none w-full${razonError ? " textarea-error" : ""}`}
              rows={3}
              placeholder="Describe el motivo de la cancelación..."
              value={razonCancelacion}
              onChange={(e) => {
                setRazonCancelacion(e.target.value);
                if (e.target.value.trim()) setRazonError("");
              }}
            />
            {razonError && (
              <span className="text-xs text-error mt-1">{razonError}</span>
            )}
          </div>

          <div className="modal-action mt-4">
            <button
              type="button"
              className="btn btn-sm btn-ghost"
              onClick={() => cancelDialogRef.current?.close()}
              disabled={actionLoading}
            >
              Volver
            </button>
            <button
              type="button"
              className="btn btn-sm text-white"
              style={{ backgroundColor: "#ff627d", borderColor: "#ff627d" }}
              onClick={handleCancelar}
              disabled={actionLoading}
            >
              {actionLoading && (
                <span className="loading loading-spinner loading-xs" />
              )}
              Confirmar cancelación
            </button>
          </div>
        </div>
        <form method="dialog" className="modal-backdrop">
          <button type="submit">close</button>
        </form>
      </dialog>
    </>
  );
}

function InfoRow({
  label,
  value,
  loading,
}: {
  label: string;
  value: string;
  loading?: boolean;
}) {
  return (
    <div className="flex items-start gap-2">
      <span className="text-xs text-slate-400 font-medium w-36 shrink-0 pt-0.5">
        {label}
      </span>
      {loading ? (
        <span className="skeleton h-4 w-32 rounded" />
      ) : (
        <span className="text-sm text-[#0f172a] flex-1 whitespace-pre-wrap">
          {value || "—"}
        </span>
      )}
    </div>
  );
}

function extractErrorMsg(err: unknown): string | undefined {
  const data = (
    err as { response?: { data?: { message?: string; mensaje?: string } } }
  )?.response?.data;
  return data?.mensaje ?? data?.message;
}
