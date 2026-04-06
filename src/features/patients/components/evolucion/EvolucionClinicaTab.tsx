"use client";
import { useCallback, useEffect, useState } from "react";
import { getEvolucionClinica } from "@/features/patients/services/evolucionClinicaService";
import { EvolucionDetalleModal } from "@/features/patients/components/evolucion/EvolucionDetalleModal";
import { EvolucionFormModal } from "@/features/patients/components/evolucion/EvolucionFormModal";
import { EpisodioEstado } from "@/features/patients/types";
import type {
  EvolucionClinica,
  EpisodioHistorial,
} from "@/features/patients/types";

const PAGE_SIZE = 5;

function formatDate(dateStr: string): string {
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

interface EvolucionClinicaTabProps {
  episodioId: number;
  episodio: EpisodioHistorial;
}

// Componente principal para la pestaña de Evolución Clínica en los episodios de los pacientes 
export function EvolucionClinicaTab({
  episodioId,
  episodio,
}: EvolucionClinicaTabProps) {
  const [evolucion, setEvolucion] = useState<EvolucionClinica[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [selectedEvolucion, setSelectedEvolucion] =
    useState<EvolucionClinica | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const canCreate = episodio.estado === EpisodioEstado.EnCurso;

  const loadEvolucion = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getEvolucionClinica(episodioId);
      // Most recent first
      const sorted = [...data].sort(
        (a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime(),
      );
      setEvolucion(sorted);
    } catch {
      setError("No se pudieron cargar las notas de enfermería.");
    } finally {
      setLoading(false);
    }
  }, [episodioId]);

  useEffect(() => {
    void loadEvolucion();
  }, [loadEvolucion]);

  useEffect(() => {
    if (!canCreate) setFormOpen(false);
  }, [canCreate]);

  function handleCreated(evolucion: EvolucionClinica) {
    setEvolucion((prev) => [evolucion, ...prev]);
  }

  const visibleEvolucion = evolucion.slice(0, visibleCount);
  const hasMore = visibleCount < evolucion.length;

  return (
    <>
      <div className="space-y-5">
        {/* Header */}
        {canCreate && (
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-2.5">
              <h2 className="text-lg font-bold text-[#0f172a]">
                Evolución Clínica
              </h2>
              {!loading && (
                <span className="text-xs font-bold bg-[#f1f5f9] text-[#64748b] rounded-full px-2 py-0.5">
                  {evolucion.length}
                </span>
              )}
            </div>
            <button
              type="button"
              className="btn text-white"
              style={{ backgroundColor: "#09268E", borderColor: "#092168" }}
              onClick={() => setFormOpen(true)}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="2.5"
                stroke="currentColor"
                className="size-[1.2em]"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 4.5v15m7.5-7.5h-15"
                />
              </svg>
              Nueva evolución
            </button>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <span className="loading loading-spinner loading-lg text-[#092168]" />
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div role="alert" className="alert alert-error text-sm py-3">
            <span>{error}</span>
            <button
              className="btn btn-xs btn-ghost"
              onClick={() => void loadEvolucion()}
            >
              Reintentar
            </button>
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && evolucion.length === 0 && (
          <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm">
            <div className="flex flex-col items-center justify-center py-16 gap-4">
              <div className="w-16 h-16 rounded-full bg-[#f1f5f9] flex items-center justify-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="1.2"
                  stroke="#94a3b8"
                  className="size-8"
                >  
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10"
                  />
                </svg>
              </div>
              <div className="text-center">
                <p className="text-sm font-semibold text-[#334155]">
                  Sin evoluciones registradas
                </p>
                <p className="text-xs text-[#94a3b8] mt-1">
                  No hay evoluciones registradas para este episodio.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Timeline */}
        {!loading && !error && evolucion.length > 0 && (
          <div>
            {visibleEvolucion.map((evolucion, i) => {
              const isLastVisible = i === visibleEvolucion.length - 1;
              const showLine = !isLastVisible || hasMore;
              return (
                <div key={evolucion.id} className="relative pl-10 pb-5">
                  {/* Vertical connector line */}
                  {showLine && (
                    <div className="absolute left-4 top-3 bottom-0 w-px bg-[#e2e8f0]" />
                  )}
                  {/* Dot */}
                  <div className="absolute left-[11px] top-2 w-2.5 h-2.5 rounded-full bg-[#092168] border-2 border-white shadow-sm z-10" />
                  {/* Card */}
                  <div className="bg-white border border-[#e2e8f0] rounded-xl shadow-sm">
                    <div className="p-5">
                      {/* Card header */}
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div>
                          <p className="text-[11px] font-bold uppercase tracking-[0.6px] text-[#94a3b8]">
                            {formatDate(evolucion.fecha)}
                          </p>
                          <p className="text-sm font-bold text-[#0f172a] mt-0.5">
                            {evolucion.doctorNombre}
                          </p>
                        </div>
                        <button
                          type="button"
                          className="btn btn-xs font-bold shrink-0"
                          style={{
                            color: "#092168",
                            borderColor: "rgba(9,33,104,0.2)",
                            backgroundColor: "transparent",
                          }}
                          onClick={() => setSelectedEvolucion(evolucion)}
                        >
                          Ver evolución
                        </button>
                      </div>
                      {/* Preview */}
                      <div className="border-l-2 border-[#f1f5f9] pl-3">
                        <p className="text-sm text-[#475569] line-clamp-2 leading-relaxed">
                          {evolucion.descripcion}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Load more */}
            {hasMore && (
              <div className="relative pl-10">
                <div className="absolute left-4 top-0 h-4 w-px bg-[#e2e8f0]" />
                <button
                  type="button"
                  className="btn btn-sm btn-ghost w-full font-semibold text-[#092168] border border-[#e2e8f0] bg-white"
                  onClick={() => setVisibleCount((v) => v + PAGE_SIZE)}
                >
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
                      d="M19.5 8.25l-7.5 7.5-7.5-7.5"
                    />
                  </svg>
                  Cargar más ({evolucion.length - visibleCount} restantes)
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Note detail modal */}
      {selectedEvolucion && (
        <EvolucionDetalleModal
          evolucion={selectedEvolucion}
          episodio={episodio}
          onClose={() => setSelectedEvolucion(null)}
        />
      )}

      {/* Create note modal */}
      {canCreate && (
        <EvolucionFormModal
          open={formOpen}
          episodioId={episodioId}
          onClose={() => setFormOpen(false)}
          onCreated={handleCreated}
        />
      )}
    </>
  );
}
