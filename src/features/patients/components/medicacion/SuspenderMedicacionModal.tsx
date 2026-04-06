"use client";
import { useEffect, useRef, useState } from "react";
import { cambiarEstadoMedicacion } from "@/features/patients/services/medicacionService";
import {
  MedicacionEstado,
  MEDICACION_ESTADO_CONFIG,
  type Medicacion,
} from "@/features/patients/types";
import { toast } from "@/lib/toast";

function formatDate(s: string) {
  try {
    return new Date(s).toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return s;
  }
}

interface Props {
  open: boolean;
  medicacion: Medicacion | null;
  episodioId: number;
  onClose: () => void;
  onUpdated: (m: Medicacion) => void;
}

// Modal para suspender una medicación activa. 
// Solo se muestra el campo de justificación, y al confirmar se cambia el estado a suspendida (sin eliminar la indicación).
export function SuspenderMedicacionModal({
  open,
  medicacion,
  episodioId,
  onClose,
  onUpdated,
}: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [justificacion, setJustificacion] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      dialogRef.current?.showModal();
      setJustificacion("");
    } else {
      dialogRef.current?.close();
    }
  }, [open]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!medicacion || !justificacion.trim()) return;
    setSubmitting(true);
    try {
      const updated = await cambiarEstadoMedicacion(episodioId, medicacion.id, {
        nuevoEstado: MedicacionEstado.Suspendida,
        justificacion: justificacion.trim(),
      });
      toast.success("Medicación suspendida.");
      onUpdated(updated);
      onClose();
    } catch {
      toast.error("No se pudo suspender la medicación.");
    } finally {
      setSubmitting(false);
    }
  }

  const estadoCfg = MEDICACION_ESTADO_CONFIG[MedicacionEstado.Activa];

  return (
    <dialog ref={dialogRef} className="modal">
      <div className="modal-box max-w-lg p-0 rounded-xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-5 border-b border-[#f1f5f9] flex items-start justify-between gap-4 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-[#fffbeb] flex items-center justify-center shrink-0">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="#d97706" className="size-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25v13.5m-7.5-13.5v13.5" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-bold text-[#0f172a]">Suspender medicación</h3>
              <p className="text-sm text-[#64748b] mt-0.5">El estado pasará a <span className="font-semibold text-[#334155]">Suspendido</span></p>
            </div>
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
                  <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${estadoCfg.bgCls} ${estadoCfg.textCls}`}>
                    <span className="w-1.5 h-1.5 rounded-full bg-[#2563eb]" />
                    {estadoCfg.label}
                  </span>
                </div>
              </div>
            )}

            {/* Justification */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold uppercase tracking-[0.5px] text-[#475569]">Justificación de suspensión</label>
                <span className="text-xs text-[#ef4444]">Obligatorio</span>
              </div>
              <textarea
                className="w-full min-h-[100px] bg-white border border-[#e2e8f0] rounded-xl px-4 py-3 text-sm text-[#0f172a] placeholder:text-[#94a3b8] resize-none focus:outline-none focus:border-[#09268E] transition-colors"
                placeholder="Describa el motivo clínico por el cual se suspende el tratamiento..."
                value={justificacion}
                onChange={(e) => setJustificacion(e.target.value)}
                disabled={submitting}
              />
            </div>

            {/* Info banner */}
            <div className="flex items-start gap-3 bg-[#eff6ff]/50 border border-[#dbeafe] rounded-xl p-4">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="#3b82f6" className="size-4 mt-0.5 shrink-0">
                <path fillRule="evenodd" d="M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0Zm-7-4a1 1 0 1 1-2 0 1 1 0 0 1 2 0ZM9 9a.75.75 0 0 0 0 1.5h.253a.25.25 0 0 1 .244.304l-.459 2.066A1.75 1.75 0 0 0 10.747 15H11a.75.75 0 0 0 0-1.5h-.253a.25.25 0 0 1-.244-.304l.459-2.066A1.75 1.75 0 0 0 9.253 9H9Z" clipRule="evenodd" />
              </svg>
              <div>
                <p className="text-xs font-semibold text-[#1d4ed8] mb-1">Información importante:</p>
                <ul className="space-y-0.5">
                  {["La indicación no será eliminada del historial.", "Las administraciones quedarán deshabilitadas.", "Puede reanudar el tratamiento en cualquier momento."].map((t) => (
                    <li key={t} className="text-xs text-[#1d4ed8]/90">{t}</li>
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
              className="btn btn-sm text-[#4d3a00] shadow-sm transition-opacity"
              style={{ backgroundColor: "#fcbc13", borderColor: "#fcbc13", opacity: justificacion.trim() ? 1 : 0.5 }}
              disabled={submitting || !justificacion.trim()}
            >
              {submitting && <span className="loading loading-spinner loading-xs" />}
              Confirmar suspensión
            </button>
          </div>
        </form>
      </div>
      <form method="dialog" className="modal-backdrop" onSubmit={onClose}><button type="submit">close</button></form>
    </dialog>
  );
}
