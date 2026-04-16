"use client";
import { useEffect, useRef, useState } from "react";
import { createClinicalEvolution } from "../../services/clinicalEvolutionService";
import type { EvolucionClinica } from "@/features/patients/types";
import { loadSession } from "@/lib/session";
import { toast } from "@/lib/toast";

function formatDatetime(d: Date): string {
  return d.toLocaleString("es-ES", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

interface ClinicalEvolutionFormModalProps {
  open: boolean;
  episodioId: number;
  onClose: () => void;
  onCreated: (evolucion: EvolucionClinica) => void;
}

// Función para registrar una nueva evolución clínica en el episodio activo del paciente. 
// Se muestra como un modal con un formulario que incluye un textarea para la descripción de la evolución, 
// validación de campo obligatorio, y un aviso sobre la inmutabilidad del registro. 
export function ClinicalEvolutionFormModal({
  open,
  episodioId,
  onClose,
  onCreated,
}: ClinicalEvolutionFormModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [descripcion, setDescripcion] = useState("");
  const [fieldError, setFieldError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [registroFecha, setRegistroFecha] = useState(new Date());

  const profesional = loadSession()?.user.name ?? "—";

  useEffect(() => {
    if (open) {
      dialogRef.current?.showModal();
      setDescripcion("");
      setFieldError("");
      setRegistroFecha(new Date());
    } else {
      dialogRef.current?.close();
    }
  }, [open]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!descripcion.trim()) {
      const msg = "La descripción de la evolución es obligatoria.";
      setFieldError(msg);
      toast.error(msg);
      return;
    }
    setSubmitting(true);
    try {
      const nota = await createClinicalEvolution(episodioId, {
        descripcion: descripcion.trim(),
        fecha: new Date().toISOString(),
      });
      toast.success("Evolución registrada correctamente.");
      onCreated(nota);
      onClose();
    } catch (err: unknown) {
      const msg =
        (
          err as {
            response?: { data?: { mensaje?: string; message?: string } };
          }
        )?.response?.data?.mensaje ??
        (
          err as {
            response?: { data?: { mensaje?: string; message?: string } };
          }
        )?.response?.data?.message ??
        "No se pudo registrar la evolución clínica. Intente nuevamente.";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <dialog ref={dialogRef} className="modal">
      <div className="modal-box max-w-2xl p-0 rounded-xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-8 py-5 border-b border-[#f1f5f9] flex items-start justify-between gap-4 flex-shrink-0">
          <div>
            <h3 className="text-lg font-bold text-[#0f172a]">
              Registrar nueva evolución clínica
            </h3>
            <p className="text-sm text-[#64748b] mt-0.5">
              Episodio activo del paciente
            </p>
          </div>
          <button
            type="button"
            className="btn btn-sm btn-ghost btn-circle text-[#64748b] mt-0.5"
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

        {/* Scrollable body */}
        <form
          onSubmit={(e) => void handleSubmit(e)}
          noValidate
          className="flex flex-col flex-1 min-h-0"
        >
          <div className="px-8 py-6 flex-1 overflow-y-auto space-y-5">
            {/* Textarea */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-[0.6px] text-[#334155] mb-2">
                Descripción <span style={{ color: "#ff627d" }}>*</span>
              </label>
              <textarea
                className={[
                  "w-full min-h-[260px] bg-white border rounded-xl shadow-sm px-5 py-4 text-sm text-[#0f172a]",
                  "placeholder:text-[#6b7280] resize-none focus:outline-none focus:border-[#09268E] transition-colors leading-relaxed",
                  fieldError ? "border-red-400" : "border-[#e2e8f0]",
                ].join(" ")}
                placeholder="Describa cuidados realizados, observaciones clínicas, eventos relevantes o respuesta del paciente..."
                value={descripcion}
                onChange={(e) => {
                  setDescripcion(e.target.value);
                  setFieldError("");
                }}
                disabled={submitting}
              />
              {fieldError && (
                <p className="text-xs text-error mt-1">{fieldError}</p>
              )}
            </div>

            {/* Warning banner */}
            <div className="flex items-start gap-3 bg-[#fffbeb] border-l-4 border-[#fcbc13] rounded-r-xl pl-5 pr-4 py-4">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="#d97706"
                className="size-5 mt-0.5 shrink-0"
              >
                <path
                  fillRule="evenodd"
                  d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495ZM10 5a.75.75 0 0 1 .75.75v3.5a.75.75 0 0 1-1.5 0v-3.5A.75.75 0 0 1 10 5Zm0 9a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z"
                  clipRule="evenodd"
                />
              </svg>
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.6px] text-[#92400e] mb-1">
                  Aviso
                </p>
                <p className="text-sm text-[#b45309] leading-relaxed">
                  Una vez registrada, la evolución clínica no podrá ser
                  modificada ni eliminada. Este registro es inmutable y formará
                  parte definitiva del expediente clínico.
                </p>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="px-8 py-5 bg-[#F8FAFC] border-t border-[#f1f5f9] flex-shrink-0">
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="bg-white rounded-lg border border-[#e2e8f0] px-3 py-2.5">
                <p className="text-[10px] font-bold uppercase tracking-[0.4px] text-[#94a3b8] mb-0.5">
                  Registrado por
                </p>
                <p className="text-sm font-semibold text-[#0f172a] truncate">
                  {profesional}
                </p>
              </div>
              <div className="bg-white rounded-lg border border-[#e2e8f0] px-3 py-2.5">
                <p className="text-[10px] font-bold uppercase tracking-[0.4px] text-[#94a3b8] mb-0.5">
                  Fecha y hora
                </p>
                <p className="text-sm font-semibold text-[#0f172a]">
                  {formatDatetime(registroFecha)}
                </p>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                className="btn btn-sm border-[#cbd5e1] text-[#475569] bg-white"
                onClick={onClose}
                disabled={submitting}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="btn btn-sm text-white shadow-sm"
                style={{ backgroundColor: "#092168", borderColor: "#092168" }}
                disabled={submitting || !descripcion.trim()}
              >
                Guardar evolución
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
