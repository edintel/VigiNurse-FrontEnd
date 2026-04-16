"use client";
import { useEffect, useRef } from "react";
import type {
  EvolucionClinica,
  EpisodioHistorial,
} from "@/features/patients/types";
import { TIPO_EPISODIO_LABELS } from "@/features/patients/types";

function formatLong(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    return d.toLocaleString("es-ES", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  } catch {
    return dateStr;
  }
}

function formatShort(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

interface ClinicalEvolutionDetailModalProps {
  evolucion: EvolucionClinica;
  episodio: EpisodioHistorial;
  onClose: () => void;
}

// Funcion que muestra el detalle de una evolucion clinica en un modal. 
// Se muestra la fecha, el tipo de episodio, la descripcion y el nombre del doctor responsable. 
// El modal se cierra al hacer click en el boton de cerrar o al hacer click fuera del modal.
export function ClinicalEvolutionDetailModal({
  evolucion,
  episodio,
  onClose,
}: ClinicalEvolutionDetailModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    dialogRef.current?.showModal();
  }, []);

  return (
    <dialog ref={dialogRef} className="modal" onClose={onClose}>
      <div className="modal-box max-w-2xl p-0 rounded-xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header zone */}
        <div className="bg-[#F8FAFC]/80 border-b border-[#f1f5f9] px-8 pt-7 pb-6 flex-shrink-0">
          <div className="flex items-start justify-between gap-4 mb-4">
            <h3 className="text-xl font-bold text-[#0f172a]">
              Detalle de la evolución clínica
            </h3>
            <button
              type="button"
              className="btn btn-sm btn-ghost btn-circle text-[#64748b]"
              onClick={onClose}
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
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-semibold text-[#334155]">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="1.8"
                stroke="currentColor"
                className="size-4 text-[#64748b] shrink-0"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5"
                />
              </svg>
              {formatLong(evolucion.fecha)}
            </div>
            <div className="flex items-center gap-2 text-sm text-[#64748b]">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="1.8"
                stroke="currentColor"
                className="size-4 shrink-0"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                />
              </svg>
              {TIPO_EPISODIO_LABELS[episodio.tipo]} — Iniciado:{" "}
              {formatShort(episodio.fechaAdmision)}
            </div>
          </div>
        </div>

        {/* Note body */}
        <div className="px-8 py-6 flex-1 overflow-y-auto">
          <p className="text-base text-[#334155] leading-relaxed whitespace-pre-wrap">
            {evolucion.descripcion}
          </p>
        </div>

        {/* Nurse signature */}
        <div className="px-8 py-5 border-t border-[#f1f5f9] flex-shrink-0 flex items-center justify-left gap-3">
          <div className="text-left">
            <p className="text-sm font-bold text-[#0f172a]">
              {evolucion.doctorNombre}
            </p>
            <p className="text-[10px] font-medium text-[#64748b] mt-0.5">
              Médico(a) responsable
            </p>
          </div>
        </div>
      </div>
      <form method="dialog" className="modal-backdrop" onSubmit={onClose}>
        <button type="submit">close</button>
      </form>
    </dialog>
  );
}
