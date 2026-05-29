"use client";
import { useCallback, useEffect, useState } from "react";
import { PaginationFooter } from "@/shared/ui/PaginationFooter";
import { AlertsFilters } from "@/features/alerts/maintenance/components/AlertsFilters";
import type { AlertsAppliedFilters } from "@/features/alerts/maintenance/components/AlertsFilters";
import {
  getAlertas,
  marcarAlertaLeida,
} from "@/features/alerts/maintenance/services/alertsService";
import {
  AlertaTipo,
  ALERTA_TIPO_LABELS,
} from "@/features/alerts/maintenance/types";
import type { Alerta } from "@/features/alerts/maintenance/types";

// Función para formatear fechas ISO a "DD/MM/YYYY HH:mm"
function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  const day = String(d.getUTCDate()).padStart(2, "0");
  const month = String(d.getUTCMonth() + 1).padStart(2, "0");
  const year = d.getUTCFullYear();
  const hh = String(d.getUTCHours()).padStart(2, "0");
  const mm = String(d.getUTCMinutes()).padStart(2, "0");
  return `${day}/${month}/${year} ${hh}:${mm}`;
}

const TIPO_STYLES: Record<
  AlertaTipo,
  { bg: string; border: string; text: string }
> = {
  [AlertaTipo.ProximoMantenimiento]: {
    bg: "rgba(252,188,19,0.1)",
    border: "rgba(252,188,19,0.3)",
    text: "#b45309",
  },
  [AlertaTipo.ActivoEnMantenimiento]: {
    bg: "rgba(59,130,246,0.08)",
    border: "rgba(59,130,246,0.25)",
    text: "#3b82f6",
  },
  [AlertaTipo.ActivoDisponible]: {
    bg: "rgba(0,211,144,0.08)",
    border: "rgba(0,211,144,0.25)",
    text: "#00d390",
  },
};

// Componente para mostrar el tipo de alerta con estilos específicos
function TypeBadge({ tipo }: { tipo: AlertaTipo }) {
  const s = TIPO_STYLES[tipo] ?? TIPO_STYLES[AlertaTipo.ProximoMantenimiento];
  return (
    <span
      className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border whitespace-nowrap"
      style={{ backgroundColor: s.bg, borderColor: s.border, color: s.text }}
    >
      {ALERTA_TIPO_LABELS[tipo] ?? "Desconocido"}
    </span>
  );
}

// Componente para mostrar si la alerta ha sido leída o no, con estilos específicos
function LeidaBadge({ leida }: { leida: boolean }) {
  return leida ? (
    <span
      className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border"
      style={{
        backgroundColor: "rgba(0,211,144,0.08)",
        borderColor: "rgba(0,211,144,0.25)",
        color: "#00d390",
      }}
    >
      Sí
    </span>
  ) : (
    <span
      className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border"
      style={{
        backgroundColor: "rgba(255,98,125,0.08)",
        borderColor: "rgba(255,98,125,0.25)",
        color: "#ff627d",
      }}
    >
      No
    </span>
  );
}

// Componente principal de la página de alertas, que maneja la lógica de carga, filtrado, paginación y marcado de alertas como leídas
export default function AlertsPage() {
  const [alertas, setAlertas] = useState<Alerta[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [paginaActual, setPaginaActual] = useState(1);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [totalRegistros, setTotalRegistros] = useState(0);
  const [appliedFilters, setAppliedFilters] = useState<AlertsAppliedFilters>(
    {},
  );
  const [markingId, setMarkingId] = useState<number | null>(null);

  const fetchAlertas = useCallback(
    async (page: number, filters: AlertsAppliedFilters) => {
      setLoading(true);
      setError(null);
      try {
        const data = await getAlertas(page, filters);
        setAlertas(data.datos);
        setPaginaActual(data.paginaActual);
        setTotalPaginas(data.totalPaginas);
        setTotalRegistros(data.totalRegistros);
      } catch {
        setError("No se pudieron cargar las alertas. Intenta nuevamente.");
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    void fetchAlertas(1, {});
  }, [fetchAlertas]);

  function handleApplyFilters(filters: AlertsAppliedFilters) {
    setAppliedFilters(filters);
    void fetchAlertas(1, filters);
  }

  function handleClearFilters() {
    setAppliedFilters({});
    void fetchAlertas(1, {});
  }

  function handlePageChange(page: number) {
    void fetchAlertas(page, appliedFilters);
  }

  async function handleMarcarLeida(alerta: Alerta) {
    setAlertas((prev) =>
      prev.map((a) => (a.id === alerta.id ? { ...a, leida: true } : a)),
    );
    setMarkingId(alerta.id);
    try {
      const updated = await marcarAlertaLeida(alerta.id);
      setAlertas((prev) =>
        prev.map((a) => (a.id === updated.id ? updated : a)),
      );
    } catch {
      setAlertas((prev) =>
        prev.map((a) => (a.id === alerta.id ? { ...a, leida: false } : a)),
      );
    } finally {
      setMarkingId(null);
    }
  }

  return (
    <div className="space-y-4">
      <AlertsFilters
        onApply={handleApplyFilters}
        onClear={handleClearFilters}
      />

      <div className="bg-white rounded-xl shadow-sm border border-[#E2E8F0] overflow-hidden">
        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-24">
            <span className="loading loading-spinner loading-md text-[#09268E]" />
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <div role="alert" className="alert alert-error text-sm max-w-md">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 shrink-0 stroke-current"
                fill="none"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span>{error}</span>
              <button
                className="btn btn-xs btn-ghost"
                onClick={() => void fetchAlertas(paginaActual, appliedFilters)}
              >
                Reintentar
              </button>
            </div>
          </div>
        )}

        {/* Estado vacio */}
        {!loading && !error && alertas.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="1.2"
              stroke="currentColor"
              className="size-12 text-slate-200"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0"
              />
            </svg>
            <p className="text-sm font-medium text-slate-400">
              No hay alertas que coincidan con los filtros aplicados.
            </p>
          </div>
        )}

        {/* Tabla */}
        {!loading && !error && alertas.length > 0 && (
          <div className="overflow-x-auto">
            <table className="table table-zebra w-full [&_td]:py-2.5 [&_th]:py-2.5">
              <thead>
                <tr className="bg-[#F8FAFC] text-[#1A2B5E]">
                  <th className="text-xs font-semibold uppercase tracking-wide">
                    Tipo
                  </th>
                  <th className="text-xs font-semibold uppercase tracking-wide">
                    Mensaje
                  </th>
                  <th className="text-xs font-semibold uppercase tracking-wide whitespace-nowrap">
                    Fecha de generación
                  </th>
                  <th className="text-xs font-semibold uppercase tracking-wide text-center w-24">
                    Leída
                  </th>
                  <th className="text-xs font-semibold uppercase tracking-wide text-right w-36">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody>
                {alertas.map((alerta) => (
                  <tr
                    key={alerta.id}
                    className="hover:bg-[#F8FAFC] transition-colors"
                  >
                    <td>
                      <TypeBadge tipo={alerta.tipo} />
                    </td>
                    <td className="text-sm text-slate-700 max-w-xs">
                      {alerta.mensaje}
                    </td>
                    <td className="text-sm text-slate-600 whitespace-nowrap">
                      {formatDate(alerta.fechaGeneracion)}
                    </td>
                    <td className="text-center">
                      <LeidaBadge leida={alerta.leida} />
                    </td>
                    <td className="text-right">
                      {!alerta.leida && (
                        <button
                          type="button"
                          className="btn btn-xs font-semibold text-white"
                          style={{
                            backgroundColor: "#09268E",
                            borderColor: "#09268E",
                          }}
                          onClick={() => void handleMarcarLeida(alerta)}
                          disabled={markingId === alerta.id}
                        >
                          {markingId === alerta.id ? (
                            <span className="loading loading-spinner loading-xs" />
                          ) : (
                            "Marcar leída"
                          )}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Paginación */}
        {!loading && !error && totalRegistros > 0 && (
          <PaginationFooter
            current={paginaActual}
            total={totalPaginas}
            totalRecords={totalRegistros}
            showing={alertas.length}
            onPageChange={handlePageChange}
          />
        )}
      </div>
    </div>
  );
}
