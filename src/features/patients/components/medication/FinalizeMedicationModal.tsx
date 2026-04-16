"use client";
import { useEffect, useRef, useState } from "react";
import { changeMedicationStatus } from "@/features/patients/services/medicationService";
import {
  MedicacionEstado,
  MEDICACION_ESTADO_CONFIG,
  type Medicacion,
} from "@/features/patients/types";
import { toast } from "@/lib/toast";

function formatDate(s: string) {
  try {
    return new Date(s).toLocaleDateString("es-ES", { day: "2-digit", month: "short", year: "numeric" });
  } catch { return s; }
}

interface Props {
  open: boolean;
  medicacion: Medicacion | null;
  episodioId: number;
  onClose: () => void;
  onUpdated: (m: Medicacion) => void;
}

// Funcion para finalizar una medicación, cambiando su estado a "Completada" y registrando el motivo de finalización. 
// Se muestra un modal con la información de la medicación y un campo para ingresar el motivo, junto con advertencias sobre la acción irreversible.
export function FinalizeMedicationModal({ open, medicacion, episodioId, onClose, onUpdated }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [motivo, setMotivo] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) { dialogRef.current?.showModal(); setMotivo(""); }
    else dialogRef.current?.close();
  }, [open]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!medicacion || !motivo.trim()) return;
    setSubmitting(true);
    try {
      const updated = await changeMedicationStatus(episodioId, medicacion.id, {
        nuevoEstado: MedicacionEstado.Completada,
        justificacion: motivo.trim(),
      });
      toast.success("Medicación finalizada.");
      onUpdated(updated);
      onClose();
    } catch {
      toast.error("No se pudo finalizar la medicación.");
    } finally {
      setSubmitting(false);
    }
  }

  const estadoCfg = medicacion
    ? MEDICACION_ESTADO_CONFIG[medicacion.estado]
    : MEDICACION_ESTADO_CONFIG[MedicacionEstado.Activa];

  return (
    <dialog ref={dialogRef} className="modal">
      <div className="modal-box max-w-lg p-0 rounded-xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-5 border-b border-[#f1f5f9] flex items-start justify-between gap-4 flex-shrink-0">
          <div>
            <h3 className="text-lg font-bold text-[#0f172a]">Finalizar medicación</h3>
            <p className="text-sm text-[#64748b] mt-0.5">La medicación quedará en estado <span className="font-semibold text-[#334155]">Finalizado</span> y no podrá reanudarse.</p>
          </div>
          <button type="button" className="btn btn-sm btn-ghost btn-circle text-[#64748b]" onClick={onClose} disabled={submitting}>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" className="size-4"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <form onSubmit={(e) => void handleSubmit(e)} noValidate className="flex flex-col flex-1 min-h-0">
          <div className="px-6 py-5 space-y-4 overflow-y-auto flex-1">
            {/* Info card */}
            {medicacion && (
              <div className="bg-[#f8fafc] border border-[#e2e8f0] rounded-xl p-4 grid grid-cols-2 gap-3">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.5px] text-[#94a3b8] mb-0.5">Medicamento</p>
                  <p className="text-sm font-semibold text-[#334155]">{medicacion.medicamentoNombre}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.5px] text-[#94a3b8] mb-0.5">Dosis</p>
                  <p className="text-sm font-semibold text-[#334155]">{medicacion.dosis} {medicacion.unidadMedida}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.5px] text-[#94a3b8] mb-0.5">Inicio</p>
                  <p className="text-sm font-semibold text-[#334155]">{formatDate(medicacion.fechaInicio)}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.5px] text-[#94a3b8] mb-0.5">Estado actual</p>
                  <span className={`inline-flex items-center text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${estadoCfg.bgCls} ${estadoCfg.textCls}`}>
                    {estadoCfg.label}
                  </span>
                </div>
              </div>
            )}

            {/* Motivo */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-[0.5px] text-[#334155] mb-1.5">
                Motivo de finalización <span className="text-[#ff627d]">*</span>
              </label>
              <textarea
                className="w-full min-h-[100px] bg-white border border-[#e2e8f0] rounded-xl px-4 py-3 text-sm text-[#0f172a] placeholder:text-[#94a3b8] resize-none focus:outline-none focus:border-[#09268E] transition-colors"
                placeholder="Describa el motivo clínico por el cual se finaliza el tratamiento..."
                value={motivo}
                onChange={(e) => setMotivo(e.target.value)}
                disabled={submitting}
              />
            </div>

            {/* Warning banner */}
            <div className="flex items-start gap-3 bg-[#fff1f2] border border-[#fecdd3] rounded-xl p-4">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="#e11d48" className="size-4 mt-0.5 shrink-0">
                <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495ZM10 5a.75.75 0 0 1 .75.75v3.5a.75.75 0 0 1-1.5 0v-3.5A.75.75 0 0 1 10 5Zm0 9a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" clipRule="evenodd" />
              </svg>
              <div>
                <p className="text-xs font-bold text-[#e11d48] mb-1.5 uppercase tracking-[0.5px]">Acción permanente e irreversible</p>
                <ul className="space-y-1">
                  {[
                    "No se permitirán más administraciones de esta receta.",
                    "El tratamiento no podrá ser reanudado, tendrá que iniciar uno nuevo si lo desea.",
                    "La acción quedará registrada en el historial clínico del paciente de forma definitiva.",
                  ].map((t) => (
                    <li key={t} className="text-xs text-[#be123c]">{t}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 bg-[#F8FAFC] border-t border-[#f1f5f9] flex-shrink-0 flex justify-end gap-2">
            <button type="button" className="btn btn-sm border-[#cbd5e1] text-[#475569] bg-white" onClick={onClose} disabled={submitting}>Cancelar</button>
            <button
              type="submit"
              className="btn btn-sm text-white shadow-sm"
              style={{ backgroundColor: "#ff627d", borderColor: "#ff627d", opacity: motivo.trim() ? 1 : 0.5 }}
              disabled={submitting || !motivo.trim()}
            >
              {submitting && <span className="loading loading-spinner loading-xs" />}
              Confirmar finalización
            </button>
          </div>
        </form>
      </div>
      <form method="dialog" className="modal-backdrop" onSubmit={onClose}><button type="submit">close</button></form>
    </dialog>
  );
}
