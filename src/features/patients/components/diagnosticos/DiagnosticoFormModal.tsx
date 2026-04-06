"use client";
import { useEffect, useRef, useState } from "react";
import { createDiagnostico } from "@/features/patients/services/diagnosticoService";
import { TIPO_EPISODIO_LABELS } from "@/features/patients/types";
import type { Diagnostico, EpisodioHistorial } from "@/features/patients/types";
import { loadSession } from "@/lib/session";
import { toast } from "@/lib/toast";

interface DiagnosticoFormModalProps {
  open: boolean;
  episodio: EpisodioHistorial;
  onClose: () => void;
  onCreated: (diagnostico: Diagnostico) => void;
}

// Modal para crear un nuevo diagnóstico asociado al episodio activo. 
// Se encarga de validar el formulario, mostrar errores, y llamar al servicio para crear el diagnóstico. También muestra metadata relevante en el footer.
export function DiagnosticoFormModal({
  open,
  episodio,
  onClose,
  onCreated,
}: DiagnosticoFormModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [cie, setCie] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [errors, setErrors] = useState<{ cie?: string; descripcion?: string }>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      dialogRef.current?.showModal();
      setCie("");
      setDescripcion("");
      setErrors({});
    } else {
      dialogRef.current?.close();
    }
  }, [open]);

  function validate() {
    const next: typeof errors = {};
    if (!cie.trim()) next.cie = "El CIE es obligatorio.";
    if (!descripcion.trim()) next.descripcion = "La descripción es obligatoria.";
    return next;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    setSubmitting(true);
    try {
      const created = await createDiagnostico(episodio.id, {
        cie: cie.trim(),
        descripcion: descripcion.trim(),
        fecha: new Date().toISOString(),
      });
      toast.success("Diagnóstico registrado correctamente.");
      onCreated(created);
      onClose();
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { mensaje?: string; message?: string } } })
          ?.response?.data?.mensaje ??
        (err as { response?: { data?: { mensaje?: string; message?: string } } })
          ?.response?.data?.message ??
        "No se pudo registrar el diagnóstico. Intente nuevamente.";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  }

  const tipoLabel = TIPO_EPISODIO_LABELS[episodio.tipo] ?? String(episodio.tipo);
  const profesional = loadSession()?.user.name ?? "—";
  const fechaHora = new Date().toLocaleString("es-ES", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <dialog ref={dialogRef} className="modal">
      <div className="modal-box max-w-lg p-0 rounded-xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-5 border-b border-[#f1f5f9] relative">
          <h3 className="text-lg font-bold text-[#0f172a]">Nuevo diagnóstico</h3>
          <p className="text-sm text-[#64748b] mt-0.5">
            Este diagnóstico quedará asociado al episodio activo.
          </p>
          <button
            type="button"
            className="absolute top-4 right-4 btn btn-sm btn-ghost btn-circle text-[#64748b]"
            onClick={onClose}
            disabled={submitting}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="2.5"
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

        {/* Form */}
        <form onSubmit={(e) => void handleSubmit(e)} noValidate>
          <div className="px-6 py-5 space-y-4">
            {/* CIE */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-[0.6px] text-[#64748b] mb-1.5">
                Diagnóstico CIE11
                <span className="text-red-500 ml-0.5">*</span>
              </label>
              <input
                id="diagnostico-cie"
                type="text"
                className={`input input-bordered w-full text-sm rounded-lg ${errors.cie ? "input-error" : ""}`}
                placeholder="Resumen del diagnóstico"
                value={cie}
                onChange={(e) => {
                  setCie(e.target.value);
                  setErrors((p) => ({ ...p, cie: undefined }));
                }}
                disabled={submitting}
              />
              {errors.cie && (
                <p className="text-xs text-error mt-1">{errors.cie}</p>
              )}
            </div>

            {/* Descripción */}
            <div>
              <label
                htmlFor="diagnostico-descripcion"
                className="block text-[11px] font-bold uppercase tracking-[0.6px] text-[#64748b] mb-1.5"
              >
                Descripción del diagnóstico
                <span className="text-red-500 ml-0.5">*</span>
              </label>
              <textarea
                id="diagnostico-descripcion"
                rows={7}
                className={`textarea textarea-bordered w-full text-sm rounded-lg resize-none leading-relaxed ${
                  errors.descripcion ? "textarea-error" : ""
                }`}
                placeholder="Describa el diagnóstico clínico..."
                value={descripcion}
                onChange={(e) => {
                  setDescripcion(e.target.value);
                  setErrors((p) => ({ ...p, descripcion: undefined }));
                }}
                disabled={submitting}
              />
              {errors.descripcion && (
                <p className="text-xs text-error mt-1">{errors.descripcion}</p>
              )}
            </div>
          </div>

          {/* Footer metadata + actions */}
          <div className="px-6 py-4 bg-[#F8FAFC] border-t border-[#f1f5f9]">
            {/* Metadata row */}
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div>
                <p className="text-[9px] font-bold uppercase tracking-[0.5px] text-[#94a3b8] mb-0.5">
                  Episodio activo
                </p>
                <p className="text-xs font-semibold text-[#334155]">{tipoLabel}</p>
              </div>
              <div>
                <p className="text-[9px] font-bold uppercase tracking-[0.5px] text-[#94a3b8] mb-0.5">
                  Profesional
                </p>
                <p className="text-xs font-semibold text-[#334155] truncate">
                  {profesional}
                </p>
              </div>
              <div>
                <p className="text-[9px] font-bold uppercase tracking-[0.5px] text-[#94a3b8] mb-0.5">
                  Fecha y hora
                </p>
                <p className="text-xs font-semibold text-[#334155]">{fechaHora}</p>
              </div>
            </div>

            {/* Buttons */}
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                className="btn btn-sm border-[#e2e8f0] text-[#475569] bg-white"
                onClick={onClose}
                disabled={submitting}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="btn btn-sm text-white shadow-sm"
                style={{ backgroundColor: "#09268E", borderColor: "#09268E" }}
                disabled={submitting}
              >
                {submitting && (
                  <span className="loading loading-spinner loading-xs" />
                )}
                Registrar diagnóstico
              </button>
            </div>
          </div>
        </form>
      </div>
      <form method="dialog" className="modal-backdrop" onSubmit={onClose}>
        <button type="submit">close</button>
      </form>
    </dialog>
  );
}
