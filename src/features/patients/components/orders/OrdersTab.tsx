"use client";
import { useCallback, useEffect, useState } from "react";
import { getEpisodeOrders } from "@/features/patients/services/orderService";
import { FilterPanel, FilterLabel, filterInputCls } from "@/shared/ui/FilterPanel";
import { PaginationFooter } from "@/shared/ui/PaginationFooter";
import {
  OrdenEstado,
  ORDEN_ESTADO_CONFIG,
  TipoOrden,
  TIPO_ORDEN_LABELS,
  OrdenPrioridad,
  ORDEN_PRIORIDAD_CONFIG,
  type OrdenesFilters,
  type Dato,
  type EpisodioHistorial,
} from "@/features/patients/types";
import { CreateOrderModal } from "./CreateOrderModal";
import { OrderDetailModal } from "./OrderDetailModal";
import { formatDate } from "@/features/medical-orders/utils/formatters";
import { toast } from "@/lib/toast";

const PAGE_SIZE = 20;

interface OrdersTabProps {
  episodio: EpisodioHistorial;
  canCreate: boolean;
  canChangeState?: boolean;
}

export function OrdersTab({ episodio, canCreate, canChangeState = true }: OrdersTabProps) {
  const [ordenes, setOrdenes] = useState<Dato[]>([]);
  const [totalRegistros, setTotalRegistros] = useState(0);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [paginaActual, setPaginaActual] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [estadoFilter, setEstadoFilter] = useState("");
  const [tipoFilter, setTipoFilter] = useState("");
  const [prioridadFilter, setPrioridadFilter] = useState("");
  const [activeFilters, setActiveFilters] = useState<OrdenesFilters>({});

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedOrden, setSelectedOrden] = useState<Dato | null>(null);

  const fetchOrders = useCallback(
    async (page: number, filters: OrdenesFilters = {}, showSuccess = false) => {
      setLoading(true);
      setError(null);
      try {
        const result = await getEpisodeOrders(
          episodio.id,
          filters,
          page,
          PAGE_SIZE,
        );
        setOrdenes(result.datos);
        setTotalRegistros(result.totalRegistros);
        setTotalPaginas(result.totalPaginas);
        setPaginaActual(result.paginaActual);
        if (showSuccess) {
          toast.success("Órdenes médicas actualizadas correctamente.");
        }
      } catch {
        setError("No se pudo cargar las órdenes médicas. Intente nuevamente.");
        toast.error("No se pudieron cargar las órdenes médicas.");
      } finally {
        setLoading(false);
      }
    },
    [episodio.id],
  );

  useEffect(() => {
    void fetchOrders(1, activeFilters);
  }, [fetchOrders, activeFilters]);

  function handleApplyFilters(e: React.FormEvent) {
    e.preventDefault();
    const filters: OrdenesFilters = {};
    if (estadoFilter !== "") filters.estado = parseInt(estadoFilter);
    if (tipoFilter !== "") filters.tipo = parseInt(tipoFilter);
    if (prioridadFilter !== "") filters.prioridad = parseInt(prioridadFilter);
    setActiveFilters(filters);
  }

  function handleClearFilters() {
    setEstadoFilter("");
    setTipoFilter("");
    setPrioridadFilter("");
    setActiveFilters({});
  }

  return (
    <div className="space-y-4">
      {/* Encabezado */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-2.5">
          <h2 className="text-lg font-bold text-[#0f172a]">Órdenes Médicas</h2>
          {!loading && (
            <span className="text-xs font-bold bg-[#f1f5f9] text-[#64748b] rounded-full px-2 py-0.5">
              {ordenes.length}
            </span>
          )}
        </div>
        {canCreate && (
            <button
              type="button"
              className="btn text-white"
              style={{ backgroundColor: "#09268E", borderColor: "#09268E" }}
              onClick={() => setShowCreateModal(true)}
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
              Nueva Ordén Médica
            </button>
        )}
      </div>
      {/* Filtros */}
      <FilterPanel
        onApply={(e) => void handleApplyFilters(e)}
        onClear={handleClearFilters}
      >
        <div className="flex flex-wrap gap-4 items-end">
          <div className="flex flex-col gap-1 w-44">
            <FilterLabel>Estado</FilterLabel>
            <select
              className={filterInputCls}
              value={estadoFilter}
              onChange={(e) => setEstadoFilter(e.target.value)}
            >
              <option value="">Todos</option>
              {(Object.entries(ORDEN_ESTADO_CONFIG) as [string, { label: string }][]).map(
                ([k, v]) => (
                  <option key={k} value={k}>
                    {v.label}
                  </option>
                ),
              )}
            </select>
          </div>
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
                  <option key={k} value={k}>
                    {v}
                  </option>
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
                  <option key={k} value={k}>
                    {v.label}
                  </option>
                ),
              )}
            </select>
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
              onClick={() => void fetchOrders(paginaActual, activeFilters, true)}
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
                  Descripción
                </th>
                <th className="text-xs font-semibold uppercase tracking-wide">
                  Prioridad
                </th>
                <th className="text-xs font-semibold uppercase tracking-wide">
                  Estado
                </th>
                <th className="text-xs font-semibold uppercase tracking-wide">
                  Emisión
                </th>
                <th className="text-xs font-semibold uppercase tracking-wide">
                  Solicitante
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
              ) : !error && ordenes.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="text-center py-12 text-base-content/40 text-sm"
                  >
                    No hay órdenes médicas registradas para este episodio.
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
                      {/* Tipo */}
                      <td className="text-sm text-[#475569] whitespace-nowrap">
                        {TIPO_ORDEN_LABELS[orden.tipoOrden as TipoOrden] ?? "—"}
                      </td>

                      {/* Descripción + Categoría */}
                      <td className="max-w-[200px]">
                        <p className="text-sm text-[#1e293b] font-medium truncate">
                          {orden.descripcion}
                        </p>
                        <p className="text-xs text-[#94a3b8]">
                          {orden.categoria}
                        </p>
                      </td>

                      {/* Prioridad */}
                      <td>
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${prioridadCfg.bgCls} ${prioridadCfg.borderCls} ${prioridadCfg.textCls}`}
                        >
                          {prioridadCfg.label}
                        </span>
                      </td>

                      {/* Estado */}
                      <td>
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${estadoCfg.bgCls} ${estadoCfg.borderCls} ${estadoCfg.textCls}`}
                        >
                          {estadoCfg.label}
                        </span>
                      </td>

                      {/* Emisión */}
                      <td className="text-sm text-[#475569] whitespace-nowrap">
                        {formatDate(orden.fechaEmision)}
                      </td>

                      {/* Solicitante */}
                      <td className="text-sm text-[#475569]">
                        {orden.solicitanteNombre}
                      </td>

                      {/* Acciones */}
                      <td>
                        <div className="flex items-center justify-end">
                          <button
                            type="button"
                            className="btn btn-square btn-sm btn-ghost text-[#09268E]"
                            title="Ver detalle de la orden"
                            onClick={() => setSelectedOrden(orden)}
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
          onPageChange={(page) => void fetchOrders(page, activeFilters)}
        />
      </div>

      {/* Modal de creación */}
      <CreateOrderModal
        open={canCreate ? showCreateModal : false}
        episodio={episodio}
        onClose={() => setShowCreateModal(false)}
        onCreated={() => {
          setShowCreateModal(false);
          void fetchOrders(1, activeFilters);
        }}
      />

      {/* Modal de detalle */}
      {selectedOrden && (
        <OrderDetailModal
          orden={selectedOrden}
          episodioId={episodio.id}
          pacienteId={episodio.pacienteId}
          canChangeState={canChangeState}
          onClose={() => setSelectedOrden(null)}
          onCancelled={() => {
            setSelectedOrden(null);
            void fetchOrders(paginaActual, activeFilters);
          }}
        />
      )}
    </div>
  );
}
