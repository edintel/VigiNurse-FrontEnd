"use client";
import { useEffect, useRef } from "react";
import { TIPO_EPISODIO_LABELS } from "@/features/patients/types";
import type { Diagnostico, EpisodioHistorial } from "@/features/patients/types";

interface DiagnosisDetailModalProps {
  open: boolean;
  diagnostico: Diagnostico | null;
  episodio: EpisodioHistorial;
  onClose: () => void;
}

// Función para formatear la fecha en un formato largo legible en español
function formatDateLong(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleString("es-ES", {
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

// Componente principal para mostrar el modal con los detalles del diagnóstico seleccionado, incluyendo su descripción, fecha de registro y profesional responsable
export function DiagnosisDetailModal({
  open,
  diagnostico,
  episodio,
  onClose,
}: DiagnosisDetailModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    if (open) dialogRef.current?.showModal();
    else dialogRef.current?.close();
  }, [open]);

  if (!diagnostico) return null;

  const tipoLabel =
    TIPO_EPISODIO_LABELS[episodio.tipo] ?? String(episodio.tipo);

  return (
    <dialog ref={dialogRef} className="modal">
      <div className="modal-box max-w-xl p-0 rounded-xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-8 pt-8 pb-5">
          {/* Episode + date chips */}
          <div className="flex items-center gap-2 flex-wrap mb-4">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#f1f5f9] text-[10px] font-bold uppercase tracking-[0.5px] text-[#64748b]">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="2"
                stroke="currentColor"
                className="size-3"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25Z"
                />
              </svg>
              Episodio: {tipoLabel}
            </span>
            <span className="inline-flex items-center gap-1.5 text-[11px] text-[#64748b]">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="2"
                stroke="currentColor"
                className="size-3.5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5"
                />
              </svg>
              Registrado el {formatDateLong(diagnostico.fecha)}
            </span>
          </div>

          {/* Title: CIE */}
          <h2 className="text-2xl font-extrabold text-[#0f172a] leading-tight">
            {diagnostico.cie}
          </h2>

          {/* Close button */}
          <button
            type="button"
            className="absolute top-4 right-4 btn btn-sm btn-ghost btn-circle text-[#64748b]"
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

        {/* Description */}
        <div className="px-8 pb-6 flex-1 overflow-y-auto">
          <p className="text-[10px] font-bold uppercase tracking-[0.6px] text-[#09268E] mb-3">
            Descripción clínica:
          </p>
          <p className="text-sm text-[#1e293b] leading-relaxed whitespace-pre-wrap">
            {diagnostico.descripcion}
          </p>
        </div>

        {/* Footer metadata */}
        <div className="px-8 py-4 bg-[#F8FAFC]/80 border-t border-[#e2e8f0]">
          <p className="text-[10px] font-bold uppercase tracking-[0.5px] text-[#94a3b8] mb-0.5">
            Profesional responsable
          </p>
          <p className="text-sm font-semibold text-[#334155]">
            {diagnostico.doctorNombre}
          </p>
        </div>
      </div>
      <form method="dialog" className="modal-backdrop" onSubmit={onClose}>
        <button type="submit">close</button>
      </form>
    </dialog>
  );
}
