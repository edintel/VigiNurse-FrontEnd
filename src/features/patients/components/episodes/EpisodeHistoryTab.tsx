"use client";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getPatientEpisodes } from "@/features/patients/services/episodeService";
import { FilterPanel } from "@/shared/ui/FilterPanel";
import { CallyDatePicker } from "@/shared/ui/CallyDatePicker";
import { PaginationFooter } from "@/shared/ui/PaginationFooter";
import { toast } from "@/lib/toast";
import {
  EpisodioEstado,
  ESTADO_EPISODIO_CONFIG,
  TRIAGE_CONFIG,
  TIPO_EPISODIO_LABELS,
} from "@/features/patients/types";
import type {
  EpisodioHistorial,
  PaginatedEpisodiosHistorial,
} from "@/features/patients/types";

const PAGE_SIZE = 20;

// Formatea una fecha ISO a DD/MM/AAAA HH:MM.
function formatDate(dateStr: string | null): string {
  if (!dateStr) return "—";
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

// Badge del estado del episodio con color según el valor del enum.
function StatusBadge({ estado }: { estado: EpisodioEstado }) {
  const cfg =
    ESTADO_EPISODIO_CONFIG[estado] ??
    ESTADO_EPISODIO_CONFIG[EpisodioEstado.Pendiente];
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${cfg.bgCls} ${cfg.borderCls} ${cfg.textCls}`}
    >
      {cfg.label}
    </span>
  );
}

interface EpisodeHistoryTabProps {
  pacienteId: number;
  bebeId?: number;
}

// Tab de historial de episodios dentro de la ficha del paciente.
export function EpisodeHistoryTab({
  pacienteId,
  bebeId,
}: EpisodeHistoryTabProps) {
  const router = useRouter();

  const [episodios, setEpisodios] = useState<EpisodioHistorial[]>([]);
  const [totalRegistros, setTotalRegistros] = useState(0);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [paginaActual, setPaginaActual] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filtros de rango de fechas
  const [fechaDesde, setFechaDesde] = useState("");
  const [fechaHasta, setFechaHasta] = useState("");
  // Filtros activos
  const [activeFilters, setActiveFilters] = useState<{
    fechaDesde?: string;
    fechaHasta?: string;
  }>({});

  const fetchEpisodes = useCallback(
    async (
      page: number,
      filters: { fechaDesde?: string; fechaHasta?: string } = {},
      showFeedback = false,
    ) => {
      setLoading(true);
      setError(null);
      try {
        const result: PaginatedEpisodiosHistorial = await getPatientEpisodes(
          pacienteId,
          page,
          PAGE_SIZE,
          filters,
        );
        setEpisodios(result.datos);
        setTotalRegistros(result.totalRegistros);
        setTotalPaginas(result.totalPaginas);
        setPaginaActual(result.paginaActual);
        if (showFeedback) {
          toast.success("Historial de episodios actualizado.");
        }
      } catch {
        const msg =
          "No se pudo cargar el historial de episodios. Intente nuevamente.";
        setError(msg);
        if (showFeedback) {
          toast.error(msg);
        }
      } finally {
        setLoading(false);
      }
    },
    [pacienteId],
  );

  useEffect(() => {
    void fetchEpisodes(1, activeFilters);
  }, [fetchEpisodes, activeFilters]);

  function handleApplyFilters(e: React.FormEvent) {
    e.preventDefault();
    const filters: { fechaDesde?: string; fechaHasta?: string } = {};
    if (fechaDesde) filters.fechaDesde = new Date(fechaDesde).toISOString();
    if (fechaHasta) filters.fechaHasta = new Date(fechaHasta).toISOString();
    setActiveFilters(filters);
    toast.info("Filtros aplicados al historial.");
  }

  function handleClearFilters() {
    setFechaDesde("");
    setFechaHasta("");
    setActiveFilters({});
    toast.info("Filtros del historial limpiados.");
  }

  return (
    <div className="space-y-4">
      <FilterPanel
        onApply={(e) => void handleApplyFilters(e)}
        onClear={handleClearFilters}
      >
        <div className="flex flex-wrap gap-4 items-end">
          <div className="flex flex-col gap-1 w-44">
            <CallyDatePicker
              id="historial-fecha-desde"
              label="Desde"
              value={fechaDesde}
              onChange={setFechaDesde}
              variant="filter"
              placeholder="DD/MM/AAAA"
              max={fechaHasta || undefined}
            />
          </div>
          <div className="flex flex-col gap-1 w-44">
            <CallyDatePicker
              id="historial-fecha-hasta"
              label="Hasta"
              value={fechaHasta}
              onChange={setFechaHasta}
              variant="filter"
              placeholder="DD/MM/AAAA"
              min={fechaDesde || undefined}
            />
          </div>
        </div>
      </FilterPanel>

      {/* Tabla */}
      <div className="bg-white rounded-xl shadow-sm border border-[#E2E8F0] overflow-hidden">
        {error && (
          <div role="alert" className="alert alert-error m-4 text-sm py-3">
            <span>{error}</span>
            <button
              className="btn btn-xs btn-ghost"
              onClick={() => void fetchEpisodes(paginaActual, activeFilters, true)}
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
                  Tipo
                </th>
                <th className="text-xs font-semibold uppercase tracking-wide">
                  Estado
                </th>
                <th className="text-xs font-semibold uppercase tracking-wide">
                  Triage
                </th>
                <th className="text-xs font-semibold uppercase tracking-wide">
                  Área
                </th>
                <th className="text-xs font-semibold uppercase tracking-wide">
                  Médicos
                </th>
                <th className="text-xs font-semibold uppercase tracking-wide">
                  Admisión
                </th>
                <th className="text-xs font-semibold uppercase tracking-wide">
                  Salida
                </th>
                <th className="text-xs font-semibold uppercase tracking-wide">
                  Razón de visita
                </th>
                <th className="text-xs font-semibold uppercase tracking-wide text-right">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={9} className="text-center py-12">
                    <span className="loading loading-spinner loading-md text-[#09268E]" />
                  </td>
                </tr>
              ) : !error && episodios.length === 0 ? (
                <tr>
                  <td
                    colSpan={9}
                    className="text-center py-12 text-base-content/40 text-sm"
                  >
                    Este paciente no tiene episodios registrados.
                  </td>
                </tr>
              ) : (
                episodios.map((ep) => {
                  const triageCfg = TRIAGE_CONFIG[ep.nivelTriage];
                  return (
                    <tr key={ep.id} className="hover:bg-base-200">
                      {/* Tipo */}
                      <td className="text-sm text-[#475569]">
                        {TIPO_EPISODIO_LABELS[ep.tipo] ?? "—"}
                      </td>

                      {/* Estado */}
                      <td>
                        <StatusBadge estado={ep.estado} />
                      </td>

                      {/* Triage */}
                      <td>
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${triageCfg.bgCls} ${triageCfg.borderCls} ${triageCfg.textCls}`}
                        >
                          {triageCfg.label}
                        </span>
                      </td>

                      {/* Área */}
                      <td className="text-sm text-[#475569]">
                        {ep.areaNombre}
                      </td>

                      {/* Médicos */}
                      <td>
                        <div className="flex flex-col gap-0.5 text-xs">
                          <span className="text-[#475569]">
                            <span className="font-semibold text-[#94a3b8]">Prin:</span>{" "}
                            {ep.medicoPrincipalNombre ?? <span className="italic text-[#94a3b8]">Sin asignar</span>}
                          </span>
                          <span className="text-[#475569]">
                            <span className="font-semibold text-[#94a3b8]">Act:</span>{" "}
                            {ep.medicoActualNombre ?? <span className="italic text-[#94a3b8]">Sin asignar</span>}
                          </span>
                        </div>
                      </td>

                      {/* Admisión */}
                      <td className="text-sm text-[#475569] whitespace-nowrap">
                        {formatDate(ep.fechaAdmision)}
                      </td>

                      {/* Salida */}
                      <td className="text-sm text-[#475569] whitespace-nowrap">
                        {formatDate(ep.fechaSalida)}
                      </td>

                      {/* Razón de visita */}
                      <td className="text-sm text-[#475569] max-w-[180px] truncate">
                        {ep.razonVisita || "—"}
                      </td>

                {/* Acciones */}
                <td>
                  {ep.estado === EpisodioEstado.Finalizado ? (
                    <div className="flex items-center justify-end">
                      <button
                        type="button"
                        className="btn btn-square btn-sm btn-ghost text-[#09268E]"
                        title="Ver detalle del episodio"
                        onClick={() =>
                          router.push(
                            `/patients/${pacienteId}/episodios/${ep.id}${bebeId ? `?bebeId=${bebeId}` : ""}`,
                          )
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
                  ) : (
                    <div className="flex items-center justify-end">
                      <span className="text-[12px] text-[#94a3b8]">
                        No disponible
                      </span>
                    </div>
                  )}
                </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <PaginationFooter
          current={paginaActual}
          total={totalPaginas}
          totalRecords={totalRegistros}
          showing={episodios.length}
          onPageChange={(page) => void fetchEpisodes(page, activeFilters, true)}
        />
      </div>
    </div>
  );
}
