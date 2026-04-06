"use client";
import { useEffect, useRef, useState } from "react";
import { finalizarEpisodio, crearRecetaAlta } from "@/features/patients/services/episodioService";
import { verifyPendingOrders } from "@/features/patients/services/ordenService";
import { verifyPendingMedication } from "@/features/patients/services/medicacionService";
import { RecetaAltaModal, type RecetaDisplayItem } from "@/features/patients/components/episodios/RecetaAltaModal";
import { toast } from "@/lib/toast";
import { type EpisodioHistorial } from "@/features/patients/types";
import { EpisodioResumenSection } from "./finalizar/EpisodioResumenSection";
import { VerificacionesPendientesSection } from "./finalizar/VerificacionesPendientesSection";
import { RecetaAltaSection } from "./finalizar/RecetaAltaSection";
import { CloseConfirmOverlay } from "../../utils/CloseConfirmOverlay";

interface FinalizarEpisodioModalProps {
  open: boolean;
  episodio: EpisodioHistorial | null;
  onClose: () => void;
  onFinalizado: () => void;
}

// Modal para finalizar un episodio, con secciones para mostrar resumen del episodio, verificar órdenes y medicación pendientes, 
// agregar receta de alta, y un campo para el motivo de salida. Incluye confirmación al intentar cerrar si hay datos no guardados.
export function FinalizarEpisodioModal({
  open,
  episodio,
  onClose,
  onFinalizado,
}: FinalizarEpisodioModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [razon, setRazon] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [confirmHover, setConfirmHover] = useState(false);
  const [recetaOpen, setRecetaOpen] = useState(false);
  const [recetaItems, setRecetaItems] = useState<RecetaDisplayItem[] | null>(null);
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);
  const [ordenesPendientes, setOrdenesPendientes] = useState<number | null>(null);
  const [loadingOrdenes, setLoadingOrdenes] = useState(false);
  const [medicacionPendiente, setMedicacionPendiente] = useState<number | null>(null);
  const [loadingMedicacion, setLoadingMedicacion] = useState(false);

  useEffect(() => {
    if (open) {
      dialogRef.current?.showModal();
      setRazon("");
      setRecetaItems(null);
      setShowCloseConfirm(false);
      if (episodio) {
        setLoadingOrdenes(true);
        setOrdenesPendientes(null);
        verifyPendingOrders(episodio.id)
          .then((count) => setOrdenesPendientes(count))
          .catch(() => setOrdenesPendientes(null))
          .finally(() => setLoadingOrdenes(false));

        setLoadingMedicacion(true);
        setMedicacionPendiente(null);
        verifyPendingMedication(episodio.id)
          .then((count) => setMedicacionPendiente(count))
          .catch(() => setMedicacionPendiente(null))
          .finally(() => setLoadingMedicacion(false));
      }
    } else {
      dialogRef.current?.close();
    }
  }, [open, episodio]);

  async function handleConfirmar() {
    if (!episodio || !razon.trim()) return;
    setSubmitting(true);
    try {
      if (recetaItems && recetaItems.length > 0) {
        await crearRecetaAlta(episodio.id, {
          detalles: recetaItems.map(({ medicamentoId, dosis, frecuencia, duracion, instrucciones }) => ({
            medicamentoId,
            dosis,
            frecuencia,
            duracion,
            instrucciones,
          })),
        });
      }
      await finalizarEpisodio(episodio.id, {
        razonFinalizacion: razon.trim(),
        fechaSalida: new Date().toISOString(),
      });
      toast.success("Episodio finalizado correctamente.");
      onFinalizado();
      onClose();
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { mensaje?: string; message?: string } } })?.response?.data?.mensaje ??
        (err as { response?: { data?: { mensaje?: string; message?: string } } })?.response?.data?.message ??
        "No se pudo finalizar el episodio. Intente nuevamente.";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  }

  function hasUnsavedData() {
    return (recetaItems !== null && recetaItems.length > 0) || razon.trim() !== "";
  }

  function handleTryClose() {
    if (hasUnsavedData()) {
      setShowCloseConfirm(true);
    } else {
      onClose();
    }
  }

  if (!episodio) return null;

  const isConfirmDisabled = submitting || !razon.trim() || ordenesPendientes! > 0 || medicacionPendiente! > 0;

  return (
    <>
      <dialog
        ref={dialogRef}
        className="modal"
        onCancel={(e) => { e.preventDefault(); handleTryClose(); }}
      >
        <div className="modal-box max-w-lg p-0 overflow-hidden rounded-xl flex flex-col max-h-[92vh] relative">
          {/* Header */}
          <div className="px-6 py-4 border-b border-[#E2E8F0] flex items-center gap-3 flex-shrink-0">
            <div className="w-9 h-9 rounded-full bg-[#ff627d1a] flex items-center justify-center flex-shrink-0">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="1.8"
                stroke="#ff627d"
                className="size-5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
                />
              </svg>
            </div>
            <div>
              <h3 className="text-base font-bold text-[#0f172a]">Finalizar atención</h3>
              <p className="text-xs text-[#64748b]">
                Esta acción cerrará el episodio activo del paciente.
              </p>
            </div>
          </div>

          {/* Contenido scrollable */}
          <div className="flex-1 overflow-y-auto py-5">
            {/* Warning banner */}
            <div className="mx-6 mt-5 rounded-lg bg-[#ff627d1a] border border-[#ff627d33] px-4 py-3 flex items-start gap-2.5">
              <p className="text-xs text-[#ff627d] leading-relaxed">
                Una vez finalizado el episodio, no podrá ser reactivado. Asegúrese
                de que toda la información médica esté correctamente registrada
                antes de continuar.
              </p>
            </div>

            <EpisodioResumenSection episodio={episodio} />

            <VerificacionesPendientesSection
              loadingOrdenes={loadingOrdenes}
              ordenesPendientes={ordenesPendientes}
              loadingMedicacion={loadingMedicacion}
              medicacionPendiente={medicacionPendiente}
            />

            <RecetaAltaSection
              recetaItems={recetaItems}
              submitting={submitting}
              onOpenReceta={() => setRecetaOpen(true)}
            />

            {/* Motivo de salida */}
            <div className="mx-6 mt-5">
              <label className="block text-sm font-semibold text-[#334155] mb-1.5">
                Motivo de salida
                <span className="text-red-500 ml-0.5">*</span>
              </label>
              <textarea
                className="textarea textarea-bordered w-full text-sm rounded-lg resize-none"
                rows={3}
                placeholder="Describa el motivo o razón de la finalización del episodio..."
                value={razon}
                onChange={(e) => setRazon(e.target.value)}
                disabled={submitting}
              />
            </div>
          </div>

          {/* Overlay confirmación de cierre */}
          {showCloseConfirm && (
            <CloseConfirmOverlay
              onContinuar={() => setShowCloseConfirm(false)}
              onConfirmar={() => { setShowCloseConfirm(false); onClose(); }}
            />
          )}

          {/* Footer */}
          <div className="px-6 py-4 border-t border-[#E2E8F0] flex items-center justify-end gap-2 flex-shrink-0">
            <button
              type="button"
              className="btn btn-sm btn-ghost"
              onClick={handleTryClose}
              disabled={submitting}
            >
              Cancelar
            </button>
            <button
              type="button"
              className="btn btn-sm text-white transition-all duration-150"
              style={(() => {
                if (isConfirmDisabled) return { backgroundColor: "#cbd5e1", borderColor: "#cbd5e1", color: "#94a3b8", cursor: "not-allowed" };
                if (confirmHover) return { backgroundColor: "#e0455f", borderColor: "#e0455f", boxShadow: "0 4px 12px rgba(255,98,125,0.4)" };
                return { backgroundColor: "#ff627d", borderColor: "#ff627d" };
              })()}
              onMouseEnter={() => setConfirmHover(true)}
              onMouseLeave={() => setConfirmHover(false)}
              onClick={() => void handleConfirmar()}
              disabled={isConfirmDisabled}
            >
              {submitting ? <span className="loading loading-spinner loading-xs" /> : null}
              Confirmar cierre
            </button>
          </div>
        </div>
        <form method="dialog" className="modal-backdrop">
          <button type="button" onClick={handleTryClose}>close</button>
        </form>
      </dialog>

      <RecetaAltaModal
        open={recetaOpen}
        onClose={() => setRecetaOpen(false)}
        onConfirmar={(items) => {
          setRecetaItems(items.length > 0 ? items : null);
          setRecetaOpen(false);
        }}
        initialItems={recetaItems}
      />
    </>
  );
}
