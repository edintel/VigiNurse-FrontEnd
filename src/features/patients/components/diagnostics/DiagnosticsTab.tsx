"use client";
import { useCallback, useEffect, useState } from "react";
import { getEpisodeDiagnostics } from "@/features/patients/services/diagnosisService";
import { DiagnosisDetailModal } from "@/features/patients/components/diagnostics/DiagnosisDetailModal";
import { DiagnosisFormModal } from "@/features/patients/components/diagnostics/DiagnosisFormModal";
import { EpisodioEstado } from "@/features/patients/types";
import { toast } from "@/lib/toast";
import type { Diagnostico, EpisodioHistorial } from "@/features/patients/types";

interface DiagnosticsTabProps {
  episodio: EpisodioHistorial;
}

function formatDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    const date = d.toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
    const time = d.toLocaleTimeString("es-ES", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
    return `${date} · ${time}`;
  } catch {
    return dateStr;
  }
}

// Componente principal para la pestaña de Diagnósticos en el historial del paciente
export function DiagnosticsTab({ episodio }: DiagnosticsTabProps) {
  const [diagnosticos, setDiagnosticos] = useState<Diagnostico[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [detailOpen, setDetailOpen] = useState(false);
  const [selected, setSelected] = useState<Diagnostico | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const canCreate = episodio.estado === EpisodioEstado.EnCurso;

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getEpisodeDiagnostics(episodio.id);
      setDiagnosticos(data);
    } catch {
      const msg = "No se pudieron cargar los diagnósticos. Intente nuevamente.";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }, [episodio.id]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!canCreate) setFormOpen(false);
  }, [canCreate]);

  function handleView(d: Diagnostico) {
    setSelected(d);
    setDetailOpen(true);
  }

  function handleCreated(d: Diagnostico) {
    setDiagnosticos((prev) => [d, ...prev]);
  }

  return (
    <>
      {/* Section header */}
      {canCreate && (
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-2.5">
            <h2 className="text-lg font-bold text-[#0f172a]">Diagnósticos</h2>
            {!loading && !error && (
              <span className="text-xs font-bold bg-[#f1f5f9] text-[#64748b] rounded-full px-2 py-0.5">
                {diagnosticos.length}
              </span>
            )}
          </div>

          <button
            type="button"
            className="btn text-white"
            style={{ backgroundColor: "#09268E", borderColor: "#09268E" }}
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
            Agregar diagnóstico
          </button>
        </div>
      )}
      <div className="bg-white rounded-xl shadow-sm border border-[#E2E8F0] overflow-hidden">
        {/* Table */}
        <div className="overflow-x-auto">
          <table className="table table-zebra w-full [&_td]:py-3.5 [&_th]:py-3">
            <thead>
              <tr className="bg-[#F8FAFC] text-[#1A2B5E] border-b border-[#E2E8F0]">
                <th className="text-[10px] font-bold uppercase tracking-[0.5px] pl-6">
                  Diagnóstico CIE
                </th>
                <th className="text-[10px] font-bold uppercase tracking-[0.5px]">
                  Fecha de registro
                </th>
                <th className="text-[10px] font-bold uppercase tracking-[0.5px]">
                  Profesional
                </th>
                <th className="text-[10px] font-bold uppercase tracking-[0.5px] text-right pr-6">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={4} className="text-center py-16">
                    <span className="loading loading-spinner loading-md text-[#09268E]" />
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={4} className="py-4 px-6">
                    <div
                      role="alert"
                      className="alert alert-error text-sm py-3"
                    >
                      <span>{error}</span>
                      <button
                        className="btn btn-xs btn-ghost"
                        onClick={() => void load()}
                      >
                        Reintentar
                      </button>
                    </div>
                  </td>
                </tr>
              ) : diagnosticos.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="text-center py-12 text-base-content/40 text-sm"
                  >
                    No hay registros de Diagnósticos.
                  </td>
                </tr>
              ) : (
                diagnosticos.map((d) => (
                  <tr key={d.id} className="hover:bg-base-200/50">
                    {/* Diagnóstico CIE */}
                    <td className="pl-6 max-w-xs">
                      <p className="text-sm font-semibold text-[#1e293b] truncate">
                        {d.cie}
                      </p>
                      <p className="text-xs text-[#64748b] mt-0.5 line-clamp-1">
                        {d.descripcion}
                      </p>
                    </td>

                    {/* Fecha */}
                    <td className="whitespace-nowrap">
                      <p className="text-sm text-[#475569]">
                        {formatDate(d.fecha)}
                      </p>
                    </td>

                    {/* Profesional */}
                    <td>
                      <p className="text-sm text-[#475569]">{d.doctorNombre}</p>
                    </td>

                    {/* Acciones */}
                    <td className="pr-6">
                      <div className="flex items-center justify-end">
                        <button
                          type="button"
                          className="btn btn-square btn-sm btn-ghost text-[#09268E]"
                          title="Ver detalle del diagnóstico"
                          onClick={() => handleView(d)}
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth="2"
                            stroke="currentColor"
                            className="size-4"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z"
                            />
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
                            />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
      <DiagnosisDetailModal
        open={detailOpen}
        diagnostico={selected}
        episodio={episodio}
        onClose={() => setDetailOpen(false)}
      />

      {canCreate && (
        <DiagnosisFormModal
          open={formOpen}
          episodio={episodio}
          onClose={() => setFormOpen(false)}
          onCreated={handleCreated}
        />
      )}
    </>
  );
}
