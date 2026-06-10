"use client";
import { useEffect, useRef, useState } from "react";
import { verifyPendingOrders } from "@/features/patients/services/orderService";
import { verifyPendingMedication } from "@/features/patients/services/medicationService";
import { PendingVerificationsSection } from "@/features/patients/components/episodes/finalize/PendingVerificationsSection";
import { dischargeBaby, getActiveBraceletAssignmentByPatient } from "@/features/baby-monitoring/services/babyService";
import { toast } from "@/lib/toast";
import type { Bebe } from "@/features/baby-monitoring/types";
import type { EpisodioHistorial } from "@/features/patients/types";
import { formatBabyName } from "@/shared/utils/personName";

interface DischargeBabyModalProps {
  open: boolean;
  bebe: Bebe;
  episodio: EpisodioHistorial;
  onClose: () => void;
  onDadoDeAlta: () => void;
}

// Modal para dar de alta a un bebé, con verificaciones similares a las del alta de pacientes pero adaptadas al contexto neonatal. Incluye:
// - Verificación de órdenes pendientes (si el episodio tiene órdenes activas sin completar).
// - Verificación de medicación pendiente (si hay medications activos sin administrar).
// - Verificación de brazalete BLE asignado (si el bebé tiene un brazalete vinculado que no ha sido desasignado).
// - Campo de observaciones obligatorio para registrar el motivo del alta.
// - Botón de confirmación que solo se habilita si no hay pendientes y se han ingresado observaciones.
export function DischargeBabyModal({
  open,
  bebe,
  episodio,
  onClose,
  onDadoDeAlta,
}: DischargeBabyModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  const [observaciones, setObservaciones] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [ordenesPendientes, setOrdenesPendientes] = useState<number | null>(null);
  const [loadingOrdenes, setLoadingOrdenes] = useState(false);
  const [medicacionPendiente, setMedicacionPendiente] = useState<number | null>(null);
  const [loadingMedicacion, setLoadingMedicacion] = useState(false);
  const [brazaleteAsignado, setBrazaleteAsignado] = useState<boolean | null>(null);
  const [loadingBrazalete, setLoadingBrazalete] = useState(false);

  useEffect(() => {
    if (open) {
      dialogRef.current?.showModal();
      setObservaciones("");

      setLoadingOrdenes(true);
      setOrdenesPendientes(null);
      verifyPendingOrders(episodio.id)
        .then((count) => setOrdenesPendientes(count))
        .catch(() => {
          setOrdenesPendientes(null);
          toast.error("No se pudieron verificar las órdenes pendientes.");
        })
        .finally(() => setLoadingOrdenes(false));

      setLoadingMedicacion(true);
      setMedicacionPendiente(null);
      verifyPendingMedication(episodio.id)
        .then((count) => setMedicacionPendiente(count))
        .catch(() => {
          setMedicacionPendiente(null);
          toast.error("No se pudo verificar la medicación pendiente.");
        })
        .finally(() => setLoadingMedicacion(false));

      setLoadingBrazalete(true);
      setBrazaleteAsignado(null);
      getActiveBraceletAssignmentByPatient(bebe.pacienteId)
        .then((asignacion) => setBrazaleteAsignado(asignacion !== null))
        .catch(() => setBrazaleteAsignado(null))
        .finally(() => setLoadingBrazalete(false));
    } else {
      dialogRef.current?.close();
    }
  }, [open, episodio.id, bebe.pacienteId]);

  const isConfirmDisabled =
    submitting ||
    !observaciones.trim() ||
    (ordenesPendientes !== null && ordenesPendientes > 0) ||
    (medicacionPendiente !== null && medicacionPendiente > 0) ||
    brazaleteAsignado === true;

  async function handleConfirmar() {
    if (!observaciones.trim()) return;
    setSubmitting(true);
    try {
      await dischargeBaby(bebe.id, { observaciones: observaciones.trim() });
      toast.success(
        `Alta registrada para ${formatBabyName(bebe.nombre, bebe.apellidos, bebe.nombreMadre, bebe.apellidosMadre)} correctamente.`,
      );
      onDadoDeAlta();
      onClose();
    } catch (err: unknown) {
      const data = (err as { response?: { data?: { mensaje?: string; message?: string } } })
        ?.response?.data;
      const msg =
        data?.mensaje ?? data?.message ?? "No se pudo registrar el alta. Intente nuevamente.";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <dialog
      ref={dialogRef}
      className="modal"
      onCancel={(e) => { e.preventDefault(); if (!submitting) onClose(); }}
    >
      <div className="modal-box max-w-lg p-0 overflow-hidden rounded-xl flex flex-col max-h-[92vh] relative">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#E2E8F0] flex items-center gap-3 flex-shrink-0">
          <div className="w-9 h-9 rounded-full bg-[#eff6ff] flex items-center justify-center flex-shrink-0">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="1.8"
              stroke="#3b82f6"
              className="size-5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
              />
            </svg>
          </div>
          <div>
            <h3 className="text-base font-bold text-[#0f172a]">Dar de alta al bebé</h3>
            <p className="text-xs text-[#64748b]">
              Esta acción cerrará el episodio neonatal asociado.
            </p>
          </div>
        </div>

        {/* Contenido scrollable */}
        <div className="flex-1 overflow-y-auto">
          {/* Warning banner */}
          <div className="mx-6 mt-5 rounded-lg bg-blue-50 border border-blue-100 px-4 py-3">
            <p className="text-xs text-blue-700 leading-relaxed">
              El alta del recién nacido finalizará el episodio neonatal y cerrará el
              seguimiento en el módulo de Control de Bebés. Esta acción no puede
              revertirse.
            </p>
          </div>

          {/* Verificaciones pendientes (misma lógica que en pacientes) */}
          <PendingVerificationsSection
            loadingOrdenes={loadingOrdenes}
            ordenesPendientes={ordenesPendientes}
            loadingMedicacion={loadingMedicacion}
            medicacionPendiente={medicacionPendiente}
          />

          {/* Verificación de brazalete */}
          <div className="mx-6 mt-2">
            <div className="flex items-center justify-between rounded-lg border border-[#E2E8F0] px-4 py-2.5">
              <span className="text-sm text-[#334155]">Brazalete BLE vinculado</span>
              {loadingBrazalete ? (
                <span className="loading loading-spinner loading-xs text-[#09268E]" />
              ) : brazaleteAsignado === null ? (
                <span className="text-xs text-[#94a3b8]">No disponible</span>
              ) : brazaleteAsignado ? (
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-red-600">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="size-4">
                    <path fillRule="evenodd" d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16ZM8.28 7.22a.75.75 0 0 0-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 1 0 1.06 1.06L10 11.06l1.72 1.72a.75.75 0 1 0 1.06-1.06L11.06 10l1.72-1.72a.75.75 0 0 0-1.06-1.06L10 8.94 8.28 7.22Z" clipRule="evenodd" />
                  </svg>
                  Brazalete asignado — desasignar primero
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-green-600">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="size-4">
                    <path fillRule="evenodd" d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm3.857-9.809a.75.75 0 0 0-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 1 0-1.06 1.061l2.5 2.5a.75.75 0 0 0 1.137-.089l4-5.5Z" clipRule="evenodd" />
                  </svg>
                  Sin brazalete asignado
                </span>
              )}
            </div>
            {brazaleteAsignado && (
              <p className="text-xs text-red-600 mt-1.5 px-1">
                Debe desasignar el brazalete BLE del bebé antes de proceder con el alta.
              </p>
            )}
          </div>

          {/* Observaciones (obligatorio) */}
          <div className="mx-6 mt-5 mb-2">
            <label className="block text-sm font-semibold text-[#334155] mb-1.5">
              Observaciones del alta
              <span className="text-red-500 ml-0.5">*</span>
            </label>
            <textarea
              className="textarea textarea-bordered w-full text-sm rounded-lg resize-none"
              rows={3}
              placeholder="Ej. Alta indicada por evolución favorable y signos vitales estables..."
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
              disabled={submitting}
            />
            {!observaciones.trim() && (
              <p className="text-xs text-slate-400 mt-1">
                Las observaciones son obligatorias para proceder con el alta.
              </p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[#E2E8F0] flex items-center justify-end gap-2 flex-shrink-0">
          <button
            type="button"
            className="btn btn-sm btn-ghost"
            onClick={onClose}
            disabled={submitting}
          >
            Cancelar
          </button>
          <button
            type="button"
            className="btn btn-sm text-white"
            style={
              isConfirmDisabled
                ? { backgroundColor: "#cbd5e1", borderColor: "#cbd5e1", color: "#94a3b8", cursor: "not-allowed" }
                : { backgroundColor: "#09268E", borderColor: "#09268E" }
            }
            onClick={() => void handleConfirmar()}
            disabled={isConfirmDisabled}
          >
            {submitting && <span className="loading loading-spinner loading-xs" />}
            Confirmar alta
          </button>
        </div>
      </div>
      <form method="dialog" className="modal-backdrop">
        <button type="button" onClick={() => { if (!submitting) onClose(); }}>
          close
        </button>
      </form>
    </dialog>
  );
}
