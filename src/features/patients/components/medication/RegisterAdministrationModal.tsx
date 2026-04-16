"use client";
import { useEffect, useRef, useState } from "react";
import { createAdministration } from "@/features/patients/services/medicationService";
import type { Administracion, Medicacion } from "@/features/patients/types";
import { loadSession } from "@/lib/session";
import { toast } from "@/lib/toast";

function formatNowPreview(): string {
  return new Date().toLocaleString("es-ES", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

interface Props {
  open: boolean;
  medicacion: Medicacion | null;
  episodioId: number;
  onClose: () => void;
  onCreated: (a: Administracion) => void;
}

// Modal para confirmar y registrar la administración de un medicamento. 
// La fecha se asigna automáticamente al momento de registrar, pero se muestra una vista previa al usuario. 
// También permite agregar observaciones opcionales sobre la administración.
export function RegisterAdministrationModal({ open, medicacion, episodioId, onClose, onCreated }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [fechaPreview, setFechaPreview] = useState("");
  const [observaciones, setObservaciones] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const profesional = loadSession()?.user.name ?? "—";

  useEffect(() => {
    if (open) {
      dialogRef.current?.showModal();
      setFechaPreview(formatNowPreview());
      setObservaciones("");
    } else {
      dialogRef.current?.close();
    }
  }, [open]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!medicacion) return;
    setSubmitting(true);
    try {
      const admin = await createAdministration(episodioId, medicacion.id, {
        fechaAdministracion: new Date().toISOString(),
        observaciones: observaciones.trim(),
      });
      toast.success("Administración registrada.");
      onCreated(admin);
      onClose();
    } catch {
      toast.error("No se pudo registrar la administración.");
    } finally {
      setSubmitting(false);
    }
  }

  const inputCls = "input input-bordered w-full text-sm bg-white border-[#cbd5e1] text-[#0f172a] focus:border-[#09268E] focus:outline-none";

  return (
    <dialog ref={dialogRef} className="modal">
      <div className="modal-box max-w-lg p-0 rounded-xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-5 border-b border-[#f1f5f9] flex items-start justify-between gap-4 flex-shrink-0">
          <div>
            <h3 className="text-lg font-bold text-[#0f172a]">Registrar administración</h3>
            <p className="text-sm text-[#64748b] mt-0.5">Confirme la administración del medicamento</p>
          </div>
          <button type="button" className="btn btn-sm btn-ghost btn-circle text-[#64748b]" onClick={onClose} disabled={submitting}>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" className="size-4"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <form onSubmit={(e) => void handleSubmit(e)} noValidate className="flex flex-col flex-1 min-h-0">
          <div className="px-6 py-5 space-y-4 overflow-y-auto flex-1">
            {/* Medication context */}
            {medicacion && (
              <div className="bg-[#f8fafc] border border-[#e2e8f0] rounded-xl p-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#dbeafe] flex items-center justify-center shrink-0">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.8" stroke="#2563eb" className="size-4">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 0 1-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 0 1 4.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0 1 12 15a9.065 9.065 0 0 1-6.23-.693L5 14.5m14.8.8 1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0 1 12 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.5px] text-[#94a3b8]">Medicamento</p>
                    <p className="text-sm font-bold text-[#334155]">{medicacion.medicamentoNombre} {medicacion.dosis}{medicacion.unidadMedida}</p>
                  </div>
                </div>
                <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-[#eff6ff] text-[#092168]">Activo</span>
              </div>
            )}

            {/* Fecha */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-[0.5px] text-[#64748b] mb-1.5">
                Fecha y hora de administración <span className="text-[#ff627d]">*</span>
              </label>
              <input
                type="text"
                className={`${inputCls} opacity-75`}
                value={fechaPreview || "Automática (al registrar)"}
                readOnly
                aria-readonly="true"
                disabled={submitting}
              />
              <p className="text-xs text-slate-500 mt-1">
                Se asigna automáticamente al momento de registrar la administración.
              </p>
            </div>

            {/* Profesional (read-only) */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-[0.5px] text-[#64748b] mb-1.5">Profesional que administra</label>
              <div className="input input-bordered w-full text-sm bg-[#f8fafc] border-[#e2e8f0] text-[#64748b] flex items-center">
                {profesional}
              </div>
            </div>

            {/* Observaciones */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-[0.5px] text-[#64748b] mb-1.5">Observaciones (opcional)</label>
              <textarea
                className="w-full min-h-[90px] bg-white border border-[#cbd5e1] rounded-xl px-4 py-3 text-sm text-[#0f172a] placeholder:text-[#6b7280] resize-none focus:outline-none focus:border-[#09268E] transition-colors"
                placeholder="Notas sobre la administración, reacciones observadas..."
                value={observaciones}
                onChange={(e) => setObservaciones(e.target.value)}
                disabled={submitting}
              />
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 bg-[#F8FAFC] border-t border-[#f1f5f9] flex-shrink-0 flex justify-end gap-2">
            <button type="button" className="btn btn-sm border-[#cbd5e1] text-[#475569] bg-white" onClick={onClose} disabled={submitting}>Cancelar</button>
            <button type="submit" className="btn btn-sm text-white shadow-sm" style={{ backgroundColor: "#092168", borderColor: "#092168" }} disabled={submitting}>
              {submitting && <span className="loading loading-spinner loading-xs" />}
              Registrar administración
            </button>
          </div>
        </form>
      </div>
      <form method="dialog" className="modal-backdrop" onSubmit={onClose}><button type="submit">close</button></form>
    </dialog>
  );
}
