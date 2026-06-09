"use client";
import { useCallback, useEffect, useState } from "react";
import {
  FilterPanel,
  FilterLabel,
  filterInputCls,
} from "@/shared/ui/FilterPanel";
import { SearchableSelect } from "@/shared/ui/SearchableSelect";
import { CallyDatePicker } from "@/shared/ui/CallyDatePicker";
import { PaginationFooter } from "@/shared/ui/PaginationFooter";
import { CreateMantenimientoModal } from "@/features/assets-managment/maintenance/components/CreateMaintenanceModal";
import { EditMantenimientoModal } from "@/features/assets-managment/maintenance/components/EditMaintenanceModal";
import { MantenimientoDetailModal } from "@/features/assets-managment/maintenance/components/MaintenanceDetailModal";
import {
  getMaintenanceByAsset,
  getMaintenanceCalendar,
} from "@/features/assets-managment/maintenance/services/maintenanceService";
import { getUsers } from "@/features/administration/users/services/userManagementService";
import {
  MantenimientoEstado,
  MantenimientoTipo,
} from "@/features/assets-managment/maintenance/types";
import type { Mantenimiento } from "@/features/assets-managment/maintenance/types";

const PAGE_SIZE = 10;

// Funciones auxiliares para estado y fechas
function getTodayStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

// Un mantenimiento se considera vencido si está programado y su fecha programada ya pasó
function isVencido(m: Mantenimiento): boolean {
  return (
    m.estado === MantenimientoEstado.Programado &&
    m.fechaProgramada.slice(0, 10) < getTodayStr()
  );
}

// Colores para estados (vencido > en proceso > finalizado > cancelado > programado)
function getStatusColor(m: Mantenimiento): string {
  if (isVencido(m)) return "#ff627d";
  switch (m.estado) {
    case MantenimientoEstado.EnProceso:
      return "#3b82f6";
    case MantenimientoEstado.Finalizado:
      return "#00d390";
    case MantenimientoEstado.Cancelado:
      return "#94a3b8";
    default:
      return "#fcbc13";
  }
}

// Etiquetas para estados
function getStatusLabel(m: Mantenimiento): string {
  if (isVencido(m)) return "Vencido";
  switch (m.estado) {
    case MantenimientoEstado.EnProceso:
      return "En Proceso";
    case MantenimientoEstado.Finalizado:
      return "Finalizado";
    case MantenimientoEstado.Cancelado:
      return "Cancelado";
    default:
      return "Programado"; 
  }
}

// Badge de estado con colores dinámicos
function StatusBadge({ m }: { m: Mantenimiento }) {
  const color = getStatusColor(m);
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold uppercase border"
      style={{
        backgroundColor: `${color}1a`,
        borderColor: `${color}33`,
        color,
      }}
    >
      {getStatusLabel(m)}
    </span>
  );
}

// Formatea fecha ISO a DD/MM/YYYY o muestra "—" si no hay fecha
function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return `${String(d.getUTCDate()).padStart(2, "0")}/${String(d.getUTCMonth() + 1).padStart(2, "0")}/${d.getUTCFullYear()}`;
}

// Convierte fecha local a ISO con hora al inicio o fin del día
function toISODay(dateStr: string, end = false): string {
  const d = new Date(dateStr);
  if (end) {
    d.setHours(23, 59, 59, 999);
  } else {
    d.setHours(0, 0, 0, 0);
  }
  return d.toISOString();
}

interface AssetsPageProps {
  activoId: number;
  canPlan?: boolean;
  canExecute?: boolean;
}

// Página de mantenimientos para un activo específico
export default function AssetsPage({ activoId, canPlan = false, canExecute = false }: AssetsPageProps) {
  const [tableData, setTableData] = useState<Mantenimiento[]>([]);
  const [loadingTable, setLoadingTable] = useState(false);
  const [tableError, setTableError] = useState<string | null>(null);
  const [paginaActual, setPaginaActual] = useState(1);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [totalRegistros, setTotalRegistros] = useState(0);

  const [dateDesde, setDateDesde] = useState("");
  const [dateHasta, setDateHasta] = useState("");
  const [filterEstado, setFilterEstado] = useState("");
  const [filterTipo, setFilterTipo] = useState("");
  const [usingDateFilter, setUsingDateFilter] = useState(false);

  // Filtro responsable SearchableSelect
  const [respOptions, setRespOptions] = useState<
    { id: number; label: string; sublabel?: string }[]
  >([]);
  const [respSearch, setRespSearch] = useState("");
  const [respSelectedId, setRespSelectedId] = useState<number | null>(null);
  const [respShowDropdown, setRespShowDropdown] = useState(false);
  const [respLoading, setRespLoading] = useState(false);

  // Filtros aplicados (para paginación)
  const [appliedFilters, setAppliedFilters] = useState<{
    estado?: number;
    tipo?: number;
    responsableId?: number;
  }>({});

  const [showCreate, setShowCreate] = useState(false);
  const [editMantenimiento, setEditMantenimiento] =
    useState<Mantenimiento | null>(null);
  const [detailMantenimiento, setDetailMantenimiento] =
    useState<Mantenimiento | null>(null);

  // Carga técnicos al montar
  useEffect(() => {
    setRespLoading(true);
    getUsers(1, 200, { rol: "TECNICO" })
      .then((res) =>
        setRespOptions(
          res.datos.map((u) => ({
            id: u.id,
            label: `${u.nombre} ${u.apellidos}`,
            sublabel: u.cedula ?? undefined,
          })),
        ),
      )
      .catch(() => {})
      .finally(() => setRespLoading(false));
  }, []);

  const fetchTable = useCallback(
    async (
      page: number,
      filters: { estado?: number; tipo?: number; responsableId?: number } = {},
    ) => {
      setLoadingTable(true);
      setTableError(null);
      try {
        const res = await getMaintenanceByAsset(
          activoId,
          page,
          PAGE_SIZE,
          filters,
        );
        setTableData(res.datos);
        setPaginaActual(res.paginaActual);
        setTotalPaginas(res.totalPaginas);
        setTotalRegistros(res.totalRegistros);
      } catch {
        setTableError("No se pudieron cargar los mantenimientos.");
      } finally {
        setLoadingTable(false);
      }
    },
    [activoId],
  );

  const fetchTableByDates = useCallback(
    async (desde: string, hasta: string) => {
      setLoadingTable(true);
      setTableError(null);
      try {
        const data = await getMaintenanceCalendar(desde, hasta);
        setTableData(data);
        setPaginaActual(1);
        setTotalPaginas(1);
        setTotalRegistros(data.length);
      } catch {
        setTableError("No se pudieron cargar los mantenimientos.");
      } finally {
        setLoadingTable(false);
      }
    },
    [],
  );

  useEffect(() => {
    void fetchTable(1);
  }, [fetchTable]);

  function handleApplyFilters(e: React.FormEvent) {
    e.preventDefault();
    if (dateDesde && dateHasta) {
      setUsingDateFilter(true);
      setAppliedFilters({});
      void fetchTableByDates(toISODay(dateDesde), toISODay(dateHasta, true));
    } else {
      const filters: {
        estado?: number;
        tipo?: number;
        responsableId?: number;
      } = {};
      if (filterEstado !== "") filters.estado = parseInt(filterEstado, 10);
      if (filterTipo !== "") filters.tipo = parseInt(filterTipo, 10);
      if (respSelectedId !== null) filters.responsableId = respSelectedId;
      setUsingDateFilter(false);
      setAppliedFilters(filters);
      void fetchTable(1, filters);
    }
  }

  function handleClearFilters() {
    setDateDesde("");
    setDateHasta("");
    setFilterEstado("");
    setFilterTipo("");
    setRespSearch("");
    setRespSelectedId(null);
    setAppliedFilters({});
    setUsingDateFilter(false);
    void fetchTable(1, {});
  }

  const filteredResp = respOptions.filter(
    (r) =>
      r.label.toLowerCase().includes(respSearch.toLowerCase()) ||
      (r.sublabel?.toLowerCase().includes(respSearch.toLowerCase()) ?? false),
  );

  function handleMantenimientoCreated(m: Mantenimiento) {
    setTableData((prev) => [m, ...prev]);
    setTotalRegistros((n) => n + 1);
  }

  function handleMantenimientoUpdated(updated: Mantenimiento) {
    setTableData((prev) =>
      prev.map((m) => (m.id === updated.id ? updated : m)),
    );
  }

  function handleDetailUpdated(updated: Mantenimiento) {
    setTableData((prev) =>
      prev.map((m) => (m.id === updated.id ? updated : m)),
    );
    setDetailMantenimiento(updated);
  }

  return (
    <div className="space-y-6">
      {/* Botón programar */}
      <div className="flex justify-end">
        {canPlan && (
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
          Programar mantenimiento
        </button>
        )}
      </div>

      {/* Filtros */}
      <FilterPanel onApply={handleApplyFilters} onClear={handleClearFilters}>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {/* Estado */}
          <div className="flex flex-col gap-1">
            <FilterLabel>Estado</FilterLabel>
            <select
              className={filterInputCls + " pr-8"}
              value={filterEstado}
              onChange={(e) => setFilterEstado(e.target.value)}
            >
              <option value="">Todos</option>
              <option value="0">Programado</option>
              <option value="1">En Proceso</option>
              <option value="2">Finalizado</option>
              <option value="3">Cancelado</option>
            </select>
          </div>
          {/* Tipo */}
          <div className="flex flex-col gap-1">
            <FilterLabel>Tipo</FilterLabel>
            <select
              className={filterInputCls + " pr-8"}
              value={filterTipo}
              onChange={(e) => setFilterTipo(e.target.value)}
            >
              <option value="">Todos</option>
              <option value="0">Preventivo</option>
              <option value="1">Correctivo</option>
            </select>
          </div>
          {/* Responsable */}
          <SearchableSelect
            id="mant-tab-resp"
            label="Responsable"
            variant="filter"
            inputClassName="py-2"
            options={filteredResp}
            loading={respLoading}
            selectedId={respSelectedId}
            searchValue={respSearch}
            onSearchChange={(e) => setRespSearch(e.target.value)}
            onSelect={(opt) => {
              setRespSelectedId(opt.id);
              setRespSearch(opt.label);
              setRespShowDropdown(false);
            }}
            showDropdown={respShowDropdown}
            onFocus={() => setRespShowDropdown(true)}
            onBlur={() => setRespShowDropdown(false)}
            placeholder="Buscar técnico..."
            onClear={() => {
              setRespSelectedId(null);
              setRespSearch("");
            }}
          />
          {/* Desde */}
          <CallyDatePicker
            id="mant-tab-desde"
            label="Desde"
            value={dateDesde}
            onChange={setDateDesde}
            variant="filter"
          />
          {/* Hasta */}
          <CallyDatePicker
            id="mant-tab-hasta"
            label="Hasta"
            value={dateHasta}
            onChange={setDateHasta}
            variant="filter"
          />
        </div>
      </FilterPanel>

      {/* Tabla */}
      <div className="bg-white rounded-xl shadow-sm border border-[#E2E8F0] overflow-hidden">
        {tableError && (
          <div role="alert" className="alert alert-error m-4 text-sm py-3">
            <span>{tableError}</span>
            <button
              className="btn btn-xs btn-ghost"
              onClick={() => void fetchTable(paginaActual)}
            >
              Reintentar
            </button>
          </div>
        )}
        <div className="overflow-x-auto">
          <table className="table table-zebra w-full [&_td]:py-2.5 [&_th]:py-2.5">
            <thead>
              <tr className="bg-[#F8FAFC] text-[#1A2B5E]">
                <th className="text-xs font-semibold uppercase tracking-wide">
                  Tipo
                </th>
                <th className="text-xs font-semibold uppercase tracking-wide">
                  Razón
                </th>
                <th className="text-xs font-semibold uppercase tracking-wide">
                  Fecha programada
                </th>
                <th className="text-xs font-semibold uppercase tracking-wide">
                  Responsable
                </th>
                <th className="text-xs font-semibold uppercase tracking-wide">
                  Estado
                </th>
                <th className="text-xs font-semibold uppercase tracking-wide text-right w-20">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody>
              {loadingTable ? (
                <tr>
                  <td colSpan={6} className="text-center py-12">
                    <span className="loading loading-spinner loading-md text-[#09268E]" />
                  </td>
                </tr>
              ) : tableData.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="text-center py-12 text-base-content/40 text-sm"
                  >
                    No se encontraron mantenimientos.
                  </td>
                </tr>
              ) : (
                tableData.map((m) => (
                  <tr key={m.id} className="hover:bg-base-200">
                    <td>
                      <span
                        className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold uppercase border"
                        style={
                          m.tipo === MantenimientoTipo.Preventivo
                            ? {
                                backgroundColor: "rgba(59,130,246,0.07)",
                                borderColor: "rgba(59,130,246,0.2)",
                                color: "#3b82f6",
                              }
                            : {
                                backgroundColor: "rgba(252,188,19,0.08)",
                                borderColor: "rgba(252,188,19,0.2)",
                                color: "#b45309",
                              }
                        }
                      >
                        {m.tipo === MantenimientoTipo.Preventivo
                          ? "Preventivo"
                          : "Correctivo"}
                      </span>
                    </td>
                    <td
                      className="text-sm text-[#0f172a] max-w-[200px] truncate"
                      title={m.razon}
                    >
                      {m.razon}
                    </td>
                    <td className="text-sm text-slate-500">
                      {formatDate(m.fechaProgramada)}
                    </td>
                    <td className="text-sm text-[#0f172a]">
                      {m.nombreResponsable}
                    </td>
                    <td>
                      <StatusBadge m={m} />
                    </td>
                    <td>
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          className="btn btn-square btn-sm btn-ghost text-[#09268E]"
                          title="Ver detalle"
                          onClick={() => setDetailMantenimiento(m)}
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
                        {canPlan && (
                        <button
                          type="button"
                          className="btn btn-square btn-sm btn-ghost text-[#09268E] disabled:text-slate-300"
                          title={
                            m.estado === MantenimientoEstado.Programado
                              ? "Editar mantenimiento"
                              : "Solo se pueden editar mantenimientos programados"
                          }
                          onClick={() => setEditMantenimiento(m)}
                          disabled={m.estado !== MantenimientoEstado.Programado}
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
                              d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Z"
                            />
                          </svg>
                        </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {!usingDateFilter && (
          <PaginationFooter
            current={paginaActual}
            total={totalPaginas}
            totalRecords={totalRegistros}
            showing={tableData.length}
            onPageChange={(p) => void fetchTable(p, appliedFilters)}
          />
        )}
      </div>

      <CreateMantenimientoModal
        open={showCreate}
        activoId={activoId}
        onClose={() => setShowCreate(false)}
        onCreated={handleMantenimientoCreated}
      />
      <EditMantenimientoModal
        open={editMantenimiento !== null}
        activoId={activoId}
        mantenimiento={editMantenimiento}
        onClose={() => setEditMantenimiento(null)}
        onUpdated={handleMantenimientoUpdated}
      />
      <MantenimientoDetailModal
        open={detailMantenimiento !== null}
        mantenimiento={detailMantenimiento}
        canExecute={canExecute}
        onClose={() => setDetailMantenimiento(null)}
        onUpdated={handleDetailUpdated}
      />
    </div>
  );
}
