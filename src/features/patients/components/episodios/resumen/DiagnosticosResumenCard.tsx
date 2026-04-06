"use client";
import { useCallback, useEffect, useState } from "react";
import { type Diagnostico } from "@/features/patients/types";
import { getDiagnosticosEpisodio } from "@/features/patients/services/diagnosticoService";



const MAX_DIAG_VISIBLE = 3;

function formatDiagDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleString("es-ES", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  } catch {
    return dateStr;
  }
}

// Componente para mostrar los diagnósticos resumen de un episodio

export function DiagnosticosResumenCard({
  episodioId,
  onGoToDiagnosticos,
}: {
  episodioId: number;
  onGoToDiagnosticos?: () => void;
}) {
  const [diags, setDiags] = useState<Diagnostico[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const data = await getDiagnosticosEpisodio(episodioId);
      const sorted = [...data].sort(
        (a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime(),
      );
      setDiags(sorted);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [episodioId]);

  useEffect(() => {
    void load();
  }, [load]);

  const visible = diags.slice(0, MAX_DIAG_VISIBLE);
  const extra = diags.length - MAX_DIAG_VISIBLE;

  return (
    <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-5 py-3.5 border-b border-[#f1f5f9] bg-[#F8FAFC]/50 flex items-center gap-2">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth="1.8"
          stroke="#64748b"
          className="size-4 flex-shrink-0"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25Z"
          />
        </svg>
        <span className="text-xs font-bold uppercase tracking-[0.6px] text-[#64748b]">
          Diagnósticos
        </span>
        {diags.length > 0 && !loading && (
          <span className="ml-auto text-[10px] font-semibold text-[#94a3b8]">
            {diags.length} registrado{diags.length !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      {/* Body */}
      <div className="p-5">
        {loading && (
          <div className="flex items-center justify-center py-8">
            <span className="loading loading-spinner loading-md text-[#09268E]" />
          </div>
        )}

        {!loading && error && (
          <div className="flex flex-col items-center gap-2 py-7">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="1.5"
              stroke="#f87171"
              className="size-7"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
              />
            </svg>
            <p className="text-sm text-[#94a3b8]">No se pudieron cargar los diagnósticos.</p>
            <button className="btn btn-xs btn-ghost text-[#09268E]" onClick={() => void load()}>
              Reintentar
            </button>
          </div>
        )}

        {!loading && !error && diags.length === 0 && (
          <div className="flex flex-col items-center gap-2 py-7">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="1.4"
              stroke="#cbd5e1"
              className="size-10"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25Z"
              />
            </svg>
            <p className="text-sm font-medium text-[#94a3b8]">Sin diagnósticos registrados</p>
            <p className="text-xs text-[#b0bec5]">
              Los diagnósticos del episodio aparecerán aquí.
            </p>
          </div>
        )}

        {!loading && !error && diags.length > 0 && (
          <div className="space-y-2">
            {visible.map((d) => (
              <div
                key={d.id}
                role={onGoToDiagnosticos ? "button" : undefined}
                tabIndex={onGoToDiagnosticos ? 0 : undefined}
                onClick={onGoToDiagnosticos}
                onKeyDown={
                  onGoToDiagnosticos
                    ? (e) => { if (e.key === "Enter" || e.key === " ") onGoToDiagnosticos(); }
                    : undefined
                }
                className={`flex items-center justify-between gap-3 rounded-lg border border-[#f1f5f9] bg-[#f8fafc] px-4 py-3 transition-colors ${onGoToDiagnosticos ? "cursor-pointer hover:border-[#09268E]/30 hover:bg-[#f0f4ff]" : ""}`}
              >
                {/* CIE + descripción */}
                <div className="min-w-0 flex items-center gap-3">
                  <p className="text-sm font-medium text-[#09268E]">
                    {d.cie}
                  </p>
                </div>

                {/* Profesional + fecha */}
                <div className="text-right shrink-0">
                  <p className="text-xs font-semibold text-[#475569] truncate max-w-[140px]">
                    Dr. {d.doctorNombre}
                  </p>
                  <p className="text-[10px] text-[#94a3b8] mt-0.5">
                    {formatDiagDate(d.fecha)}
                  </p>
                </div>
              </div>
            ))}

            {extra > 0 && (
              <button
                type="button"
                onClick={onGoToDiagnosticos}
                className="w-full text-center text-xs font-semibold text-[#09268E] hover:underline pt-1"
              >
                +{extra} más — ver todos
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
