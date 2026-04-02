"use client";
import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { getEpisodiosActivos } from "@/features/patients/services/episodioService";
import { ActivePatientsFilters } from "@/features/patients/components/pacientes/ActivePatientsFilters";
import { CreateEpisodioModal } from "@/features/patients/components/episodios/CreateEpisodioModal";
import { PaginationFooter } from "@/shared/ui/PaginationFooter";
import { TriageNivel, TRIAGE_CONFIG } from "@/features/patients/types";
import type {
  EpisodioActivo,
  EpisodioFilters,
  PaginatedEpisodiosActivos,
} from "@/features/patients/types";

const PAGE_SIZE = 10;

// Formatea una fecha ISO a DD/MM/AAAA HH:MM.
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
    return `${date} ${time}`;
  } catch {
    return dateStr;
  }
}

// Badge de nivel de triage con color según el nivel.
function TriageBadge({ nivel }: { nivel: TriageNivel }) {
  const cfg = TRIAGE_CONFIG[nivel] ?? TRIAGE_CONFIG[TriageNivel.NoAplica];
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${cfg.bgCls} ${cfg.borderCls} ${cfg.textCls}`}
    >
      {nivel !== TriageNivel.NoAplica && (
        <span className="font-black">{nivel}</span>
      )}
      {cfg.label}
    </span>
  );
}

// Indicadores clínicos — sin funcionalidad aún, solo visuales de referencia.
function ClinicalIndicators() {
  const items = [
    { label: "Signos vitales" },
    { label: "Órdenes méd." },
    { label: "Medicación" },
  ];
  return (
    <div className="flex flex-col gap-1.5">
      {items.map(({ label }) => (
        <span
          key={label}
          className="inline-flex items-center gap-1.5 text-[10px] font-semibold text-slate-400 uppercase tracking-wide"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-slate-300 flex-shrink-0" />
          {label}
        </span>
      ))}
    </div>
  );
}

// Estado vacío que se muestra cuando no se han aplicado filtros.
function EmptyFiltersState() {
  return (
    <div className="flex flex-col items-center justify-center py-24 gap-5 border-2 border-dashed border-[#e2e8f0] rounded-xl bg-white">
      <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center">
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
            d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.008v.008h-.008v-.008Zm0 3h.008v.008h-.008v-.008Zm0 3h.008v.008h-.008v-.008Z"
          />
        </svg>
      </div>
      <div className="text-center max-w-xs">
        <h3 className="text-lg font-bold text-[#1e293b] mb-1">
          Sin filtros seleccionados
        </h3>
        <p className="text-sm text-[#64748b]">
          Seleccione al menos un filtro para visualizar los pacientes en
          atención.
        </p>
      </div>
    </div>
  );
}

// Pestaña de pacientes en atención: requiere filtros para cargar datos.
export default function ActivePatientsPage() {
  const router = useRouter();
  const [episodios, setEpisodios] = useState<EpisodioActivo[]>([]);
  const [totalRegistros, setTotalRegistros] = useState(0);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [paginaActual, setPaginaActual] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // null = estado vacío (sin filtros aplicados aún)
  const [appliedFilters, setAppliedFilters] = useState<EpisodioFilters | null>(
    null,
  );
  const [showCreate, setShowCreate] = useState(false);

  const fetchEpisodios = useCallback(
    async (page: number, filters: EpisodioFilters) => {
      setLoading(true);
      setError(null);
      try {
        const result: PaginatedEpisodiosActivos = await getEpisodiosActivos(
          page,
          PAGE_SIZE,
          filters,
        );
        setEpisodios(result.datos);
        setTotalRegistros(result.totalRegistros);
        setTotalPaginas(result.totalPaginas);
        setPaginaActual(result.paginaActual);
      } catch {
        setError(
          "No se pudieron cargar los pacientes en atención. Intente nuevamente.",
        );
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  function handleApplyFilters(filters: EpisodioFilters) {
    setAppliedFilters(filters);
    void fetchEpisodios(1, filters);
  }

  function handleClearFilters() {
    setAppliedFilters(null);
    setEpisodios([]);
    setTotalRegistros(0);
    setTotalPaginas(1);
    setPaginaActual(1);
    setError(null);
  }

  function handlePageChange(page: number) {
    if (appliedFilters !== null) {
      void fetchEpisodios(page, appliedFilters);
    }
  }

  function handleEpisodioCreated(episodio: EpisodioActivo) {
    // Si hay filtros aplicados, refrescar la tabla; si no, no hay nada que mostrar
    if (appliedFilters !== null) {
      void fetchEpisodios(1, appliedFilters);
    }
    void episodio; 
  }

  const hasAppliedFilters = appliedFilters !== null;

  return (
    <div className="space-y-4">
      {/* Botón de acción */}
      <div className="flex justify-end">
        <button
          type="button"
          className="btn text-white"
          style={{ backgroundColor: "#09268E", borderColor: "#09268E" }}
          onClick={() => setShowCreate(true)}
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
          Nuevo episodio
        </button>
      </div>

      {/* Panel de filtros */}
      <ActivePatientsFilters
        onApply={handleApplyFilters}
        onClear={handleClearFilters}
      />

      {/* Contenido principal */}
      {!hasAppliedFilters ? (
        <EmptyFiltersState />
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-[#E2E8F0] overflow-hidden">
          {error && (
            <div role="alert" className="alert alert-error m-4 text-sm py-3">
              <span>{error}</span>
              <button
                className="btn btn-xs btn-ghost"
                onClick={() =>
                  void fetchEpisodios(paginaActual, appliedFilters!)
                }
              >
                Reintentar
              </button>
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="table table-zebra w-full [&_td]:py-3 [&_th]:py-2.5">
              <thead>
                <tr className="bg-[#F8FAFC] text-[#1A2B5E]">
                  <th className="text-xs font-semibold uppercase tracking-wide">
                    Área
                  </th>
                  <th className="text-xs font-semibold uppercase tracking-wide">
                    Paciente
                  </th>
                  <th className="text-xs font-semibold uppercase tracking-wide">
                    Fecha de admisión
                  </th>
                  <th className="text-xs font-semibold uppercase tracking-wide">
                    Razón de visita
                  </th>
                  <th className="text-xs font-semibold uppercase tracking-wide">
                    Nivel triage
                  </th>
                  <th className="text-xs font-semibold uppercase tracking-wide">
                    Indicadores clínicos
                  </th>
                  <th className="text-xs font-semibold uppercase tracking-wide text-right">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={7} className="text-center py-12">
                      <span className="loading loading-spinner loading-md text-[#09268E]" />
                    </td>
                  </tr>
                ) : !error && episodios.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="text-center py-12 text-base-content/40 text-sm"
                    >
                      No se encontraron pacientes con los filtros seleccionados.
                    </td>
                  </tr>
                ) : (
                  episodios.map((ep) => (
                    <tr key={ep.episodioId} className="hover:bg-base-200">
                      {/* Área */}
                      <td>
                        <span className="text-sm text-[#475569] font-medium">
                          {ep.areaNombre}
                        </span>
                      </td>

                      {/* Paciente */}
                      <td>
                        <div className="flex flex-col">
                          <span className="font-semibold text-sm text-[#0f172a]">
                            {ep.apellidos}, {ep.nombre}
                          </span>
                          <span className="text-[11px] text-[#64748b] font-mono">
                            {ep.cedula}
                          </span>
                        </div>
                      </td>

                      {/* Fecha admisión */}
                      <td className="text-sm text-[#475569]">
                        {formatDate(ep.fechaAdmision)}
                      </td>

                      {/* Razón de visita */}
                      <td className="text-sm text-[#475569] max-w-[180px] truncate">
                        {ep.razonVisita || "—"}
                      </td>

                      {/* Nivel triage */}
                      <td>
                        <TriageBadge nivel={ep.nivelTriage} />
                      </td>

                      {/* Indicadores clínicos (sin funcionalidad) */}
                      <td>
                        <ClinicalIndicators />
                      </td>

                      {/* Acciones */}
                      <td>
                        <div className="flex items-center justify-end">
                          <button
                            type="button"
                            className="btn btn-square btn-sm btn-ghost text-[#09268E]"
                            title="Ver ficha del paciente"
                            onClick={() =>
                              router.push(`/patients/${ep.pacienteId}`)
                            }
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

          {hasAppliedFilters && (
            <PaginationFooter
              current={paginaActual}
              total={totalPaginas}
              totalRecords={totalRegistros}
              showing={episodios.length}
              onPageChange={handlePageChange}
            />
          )}
        </div>
      )}

      <CreateEpisodioModal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        onCreated={handleEpisodioCreated}
      />
    </div>
  );
}
