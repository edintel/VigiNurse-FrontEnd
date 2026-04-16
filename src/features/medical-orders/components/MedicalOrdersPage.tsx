"use client";
import { useCallback, useEffect, useState } from "react";
import { getMedicalOrders } from "@/features/medical-orders/services/medicalOrdersService";
import { FilterPanel, FilterLabel, filterInputCls } from "@/shared/ui/FilterPanel";
import { PaginationFooter } from "@/shared/ui/PaginationFooter";
import {
  TIPO_ORDEN_LABELS,
  OrdenPrioridad,
  ORDEN_PRIORIDAD_CONFIG,
  OrdenEstado,
  ORDEN_ESTADO_CONFIG,
  type OrdenMedicaDto,
  type TipoOrden,
} from "@/features/patients/types";
import { OrderManagerModal } from "./OrderManagerModal";
import { formatDate } from "@/features/medical-orders/utils/formatters";

const PAGE_SIZE = 20;

export default function MedicalOrdersPage() {
  const [ordenes, setOrdenes] = useState<OrdenMedicaDto[]>([]);
  const [totalRegistros, setTotalRegistros] = useState(0);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [paginaActual, setPaginaActual] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [tipoFilter, setTipoFilter] = useState("");
  const [prioridadFilter, setPrioridadFilter] = useState("");
  const [activeTipo, setActiveTipo] = useState<number | undefined>();
  const [activePrioridad, setActivePrioridad] = useState<number | undefined>();

  const [selectedOrder, setSelectedOrder] = useState<OrdenMedicaDto | null>(null);

  const fetchOrders = useCallback(
    async (pagina: number, tipo?: number, prioridad?: number) => {
      setLoading(true);
      setError(null);
      try {
        const result = await getMedicalOrders(pagina, PAGE_SIZE, tipo, prioridad);
        setOrdenes(result.datos);
        setTotalRegistros(result.totalRegistros);
        setTotalPaginas(result.totalPaginas);
        setPaginaActual(result.paginaActual);
      } catch {
        setError("No se pudieron cargar las órdenes médicas. Intente nuevamente.");
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    void fetchOrders(1, activeTipo, activePrioridad);
  }, [fetchOrders, activeTipo, activePrioridad]);

  function handleApplyFilters(e: React.FormEvent) {
    e.preventDefault();
    const tipo = tipoFilter !== "" ? parseInt(tipoFilter) : undefined;
    const prioridad = prioridadFilter !== "" ? parseInt(prioridadFilter) : undefined;
    setActiveTipo(tipo);
    setActivePrioridad(prioridad);
  }

  function handleClearFilters() {
    setTipoFilter("");
    setPrioridadFilter("");
    setActiveTipo(undefined);
    setActivePrioridad(undefined);
  }

  return (
    <div className="py-6 px-8 xl:px-12 space-y-6">
      {/* Header */}
      <div className="pb-2">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-9 h-9 rounded-lg bg-[#1A2B5E] flex items-center justify-center flex-shrink-0">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
              stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
              <rect x="9" y="3" width="6" height="4" rx="1" />
              <path d="M9 12h6M9 16h4" />
            </svg>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[#1A2B5E] leading-tight">
              Órdenes Médicas
            </h1>
            <p className="text-sm text-slate-500">
              Gestión y seguimiento de órdenes de exámenes del centro médico.
            </p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <FilterPanel
        onApply={(e) => void handleApplyFilters(e)}
        onClear={handleClearFilters}
      >
        <div className="flex flex-wrap gap-4 items-end">
          <div className="flex flex-col gap-1 w-44">
            <FilterLabel>Tipo de orden</FilterLabel>
            <select
              className={filterInputCls}
              value={tipoFilter}
              onChange={(e) => setTipoFilter(e.target.value)}
            >
              <option value="">Todos</option>
              {(Object.entries(TIPO_ORDEN_LABELS) as [string, string][]).map(
                ([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ),
              )}
            </select>
          </div>
          <div className="flex flex-col gap-1 w-44">
            <FilterLabel>Prioridad</FilterLabel>
            <select
              className={filterInputCls}
              value={prioridadFilter}
              onChange={(e) => setPrioridadFilter(e.target.value)}
            >
              <option value="">Todas</option>
              {(Object.entries(ORDEN_PRIORIDAD_CONFIG) as [string, { label: string }][]).map(
                ([k, v]) => (
                  <option key={k} value={k}>{v.label}</option>
                ),
              )}
            </select>
          </div>
        </div>
      </FilterPanel>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-[#E2E8F0] overflow-hidden">
        {error && (
          <div role="alert" className="alert alert-error m-4 text-sm py-3">
            <span>{error}</span>
            <button
              className="btn btn-xs btn-ghost"
              onClick={() => void fetchOrders(paginaActual, activeTipo, activePrioridad)}
            >
              Reintentar
            </button>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="table table-zebra w-full [&_td]:py-3 [&_th]:py-2.5">
            <thead>
              <tr className="bg-[#F8FAFC] text-[#1A2B5E]">
                <th className="text-xs font-semibold uppercase tracking-wide">Paciente</th>
                <th className="text-xs font-semibold uppercase tracking-wide">Área</th>
                <th className="text-xs font-semibold uppercase tracking-wide">Tipo</th>
                <th className="text-xs font-semibold uppercase tracking-wide">Descripción</th>
                <th className="text-xs font-semibold uppercase tracking-wide">Prioridad</th>
                <th className="text-xs font-semibold uppercase tracking-wide">Estado</th>
                <th className="text-xs font-semibold uppercase tracking-wide">Emisión</th>
                <th className="text-xs font-semibold uppercase tracking-wide">Solicitante</th>
                <th className="text-xs font-semibold uppercase tracking-wide text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={9} className="text-center py-12">
                    <span className="loading loading-spinner loading-md text-[#09268E]" />
                  </td>
                </tr>
              ) : !error && ordenes.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-12 text-base-content/40 text-sm">
                    No hay órdenes médicas que coincidan con los filtros aplicados.
                  </td>
                </tr>
              ) : (
                ordenes.map((orden) => {
                  const estadoCfg =
                    ORDEN_ESTADO_CONFIG[orden.estado as OrdenEstado] ??
                    ORDEN_ESTADO_CONFIG[OrdenEstado.Pendiente];
                  const prioridadCfg =
                    ORDEN_PRIORIDAD_CONFIG[orden.prioridad as OrdenPrioridad] ??
                    ORDEN_PRIORIDAD_CONFIG[OrdenPrioridad.Normal];
                  return (
                    <tr key={orden.id} className="hover:bg-base-200">
                      <td className="max-w-[160px]">
                        <p className="text-sm text-[#1e293b] font-medium truncate">
                          {orden.pacienteNombre ?? "—"}
                        </p>
                        {orden.cedulaPaciente && (
                          <p className="text-xs text-[#94a3b8] font-mono">
                            {orden.cedulaPaciente}
                          </p>
                        )}
                      </td>
                      <td className="text-sm text-slate-500 whitespace-nowrap">
                        {orden.areaNombre ?? "—"}
                      </td>
                      <td className="text-sm text-[#475569] whitespace-nowrap">
                        {TIPO_ORDEN_LABELS[orden.tipoOrden as TipoOrden] ?? "—"}
                      </td>
                      <td className="max-w-[180px]">
                        <p className="text-sm text-[#1e293b] font-medium truncate">
                          {orden.descripcion ?? "—"}
                        </p>
                        {orden.categoria && (
                          <p className="text-xs text-[#94a3b8]">{orden.categoria}</p>
                        )}
                      </td>
                      <td>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${prioridadCfg.bgCls} ${prioridadCfg.borderCls} ${prioridadCfg.textCls}`}>
                          {prioridadCfg.label}
                        </span>
                      </td>
                      <td>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${estadoCfg.bgCls} ${estadoCfg.borderCls} ${estadoCfg.textCls}`}>
                          {estadoCfg.label}
                        </span>
                      </td>
                      <td className="text-sm text-[#475569] whitespace-nowrap">
                        {formatDate(orden.fechaEmision)}
                      </td>
                      <td className="text-sm text-[#475569]">
                        {orden.solicitanteNombre}
                      </td>
                      <td>
                        <div className="flex items-center justify-end">
                          <button
                            type="button"
                            title="Gestionar orden"
                            className="btn btn-xs text-white gap-1"
                            style={{ backgroundColor: "#09268E", borderColor: "#09268E" }}
                            onClick={() => setSelectedOrder(orden)}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
                              strokeWidth="2" stroke="currentColor" className="size-3">
                              <path strokeLinecap="round" strokeLinejoin="round"
                                d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                            </svg>
                            Gestionar
                          </button>
                        </div>
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
          showing={ordenes.length}
          onPageChange={(p) => void fetchOrders(p, activeTipo, activePrioridad)}
        />
      </div>

      {selectedOrder && (
        <OrderManagerModal
          orden={selectedOrder}
          onClose={() => setSelectedOrder(null)}
          onUpdated={() => void fetchOrders(paginaActual, activeTipo, activePrioridad)}
        />
      )}
    </div>
  );
}
