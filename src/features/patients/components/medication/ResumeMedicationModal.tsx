"use client";
import { useEffect, useRef, useState } from "react";
import { changeMedicationStatus } from "@/features/patients/services/medicationService";
import {
  MedicacionEstado,
  MEDICACION_ESTADO_CONFIG,
  type Medicacion,
} from "@/features/patients/types";
import { toast } from "@/lib/toast";

interface Props {
  open: boolean;
  medicacion: Medicacion | null;
  episodioId: number;
  onClose: () => void;
  onUpdated: (m: Medicacion) => void;
}

// Modal para reanudar una medicación suspendida, solicitando una justificación clínica.
//  Al confirmar, cambia el estado a Activa y registra la justificación en el historial clínico.
export function ResumeMedicationModal({ open, medicacion, episodioId, onClose, onUpdated }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [justificacion, setJustificacion] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) { dialogRef.current?.showModal(); setJustificacion(""); }
    else dialogRef.current?.close();
  }, [open]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!medicacion || !justificacion.trim()) return;
    setSubmitting(true);
    try {
      const updated = await changeMedicationStatus(episodioId, medicacion.id, {
        nuevoEstado: MedicacionEstado.Activa,
        justificacion: justificacion.trim(),
      });
      toast.success("Medicación reanudada.");
      onUpdated(updated);
      onClose();
    } catch {
      toast.error("No se pudo reanudar la medicación.");
    } finally {
      setSubmitting(false);
    }
  }

  const suspCfg = MEDICACION_ESTADO_CONFIG[MedicacionEstado.Suspendida];

  return (
    <dialog ref={dialogRef} className="modal">
      <div className="modal-box max-w-lg p-0 rounded-xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-5 border-b border-[#f1f5f9] flex items-start justify-between gap-4 flex-shrink-0">
          <div>
            <h3 className="text-lg font-bold text-[#0f172a]">Reanudar medicación</h3>
            <p className="text-sm text-[#64748b] mt-0.5">El estado volverá a <span className="font-semibold text-[#334155]">Activo</span></p>
          </div>
          <button type="button" className="btn btn-sm btn-ghost btn-circle text-[#64748b]" onClick={onClose} disabled={submitting}>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" className="size-4"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <form onSubmit={(e) => void handleSubmit(e)} noValidate className="flex flex-col flex-1 min-h-0">
          <div className="px-6 py-5 space-y-4 overflow-y-auto flex-1">
            {/* Info card */}
            {medicacion && (
              <div className="bg-[#f8fafc] border border-[#e2e8f0] rounded-xl p-4 grid grid-cols-3 gap-3">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.5px] text-[#94a3b8] mb-0.5">Medicamento</p>
                  <p className="text-sm font-semibold text-[#334155] truncate">{medicacion.medicamentoNombre}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.5px] text-[#94a3b8] mb-0.5">Dosis</p>
                  <p className="text-sm font-semibold text-[#334155]">{medicacion.dosis} {medicacion.unidadMedida}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.5px] text-[#94a3b8] mb-0.5">Estado actual</p>
                  <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold uppercase px-2 py-0.5 rounded ${suspCfg.bgCls} ${suspCfg.textCls}`}>
                    <span className="w-1.5 h-1.5 rounded-full bg-[#94a3b8]" />
                    {suspCfg.label}
                  </span>
                </div>
              </div>
            )}

            {/* Justification */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-[0.5px] text-[#334155] mb-1.5">
                Justificación de reanudación <span className="text-[#ef4444]">*</span>
              </label>
              <textarea
                className="w-full min-h-[100px] bg-white border border-[#cbd5e1] rounded-xl px-4 py-3 text-sm text-[#0f172a] placeholder:text-[#94a3b8] resize-none focus:outline-none focus:border-[#09268E] transition-colors"
                placeholder="Describa el motivo clínico por el cual se reanuda el tratamiento..."
                value={justificacion}
                onChange={(e) => setJustificacion(e.target.value)}
                disabled={submitting}
              />
            </div>

            {/* Info banner */}
            <div className="flex items-start gap-3 bg-[#eff6ff] border-l-4 border-[#092168] rounded-r-xl pl-5 pr-4 py-4">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="#092168" className="size-4 mt-0.5 shrink-0">
                <path fillRule="evenodd" d="M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0Zm-7-4a1 1 0 1 1-2 0 1 1 0 0 1 2 0ZM9 9a.75.75 0 0 0 0 1.5h.253a.25.25 0 0 1 .244.304l-.459 2.066A1.75 1.75 0 0 0 10.747 15H11a.75.75 0 0 0 0-1.5h-.253a.25.25 0 0 1-.244-.304l.459-2.066A1.75 1.75 0 0 0 9.253 9H9Z" clipRule="evenodd" />
              </svg>
              <div>
                <p className="text-xs font-bold text-[#092168] mb-1">Aviso informativo</p>
                <p className="text-xs text-[#092168]/80 leading-relaxed">Al confirmar, el estado cambiará a <strong>Activo</strong> y se podrán volver a registrar administraciones. La justificación quedará registrada en el historial clínico.</p>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 bg-[#F8FAFC] border-t border-[#f1f5f9] flex-shrink-0 flex justify-end gap-2">
            <button type="button" className="btn btn-sm border-[#cbd5e1] text-[#475569] bg-white" onClick={onClose} disabled={submitting}>Cancelar</button>
            <button
              type="submit"
              className="btn btn-sm text-white shadow-sm transition-opacity"
              style={{ backgroundColor: "#092168", borderColor: "#092168", opacity: justificacion.trim() ? 1 : 0.5 }}
              disabled={submitting || !justificacion.trim()}
            >
              {submitting && <span className="loading loading-spinner loading-xs" />}
              Confirmar reanudación
            </button>
          </div>
        </form>
      </div>
      <form method="dialog" className="modal-backdrop" onSubmit={onClose}><button type="submit">close</button></form>
    </dialog>
  );
}
