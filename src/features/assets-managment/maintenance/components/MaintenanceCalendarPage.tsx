"use client";
import { useCallback, useEffect, useState } from "react";
import {
  FilterPanel,
  FilterLabel,
  filterInputCls,
} from "@/shared/ui/FilterPanel";
import { SearchableSelect } from "@/shared/ui/SearchableSelect";
import { getMantenimientosCalendario } from "@/features/assets-managment/maintenance/services/maintenanceService";
import { getActivoById } from "@/features/assets-managment/inventory/services/assetService";
import { getAreas } from "@/features/administration/areas/services/areaService";
import { getUsers } from "@/features/administration/users/services/userManagementService";
import type { Mantenimiento } from "@/features/assets-managment/maintenance/types";
import { CalendarWidget } from "@/features/assets-managment/maintenance/components/CalendarWidget";
import { getMonthRange } from "@/features/assets-managment/maintenance/utils/calendarHelpers";
import { StatsCards } from "@/features/assets-managment/maintenance/utils/statsCards";

const now = new Date();

interface SelectOption {
  id: number;
  label: string;
  sublabel?: string;
}

interface AppliedCalendarFilters {
  areaId?: number;
  estado?: number;
  tipo?: number;
  responsableId?: number;
  serial?: string;
}

// Este componente es la página principal del calendario de mantenimientos. Contiene:
// - Un encabezado con título y descripción
// - Un componente de estadísticas (StatsCards) que muestra datos resumidos del mes
// - Un panel de filtros (FilterPanel) con campos para número de serie, estado, tipo, área y responsable
// - El widget del calendario (CalendarWidget) que muestra los mantenimientos programados del mes seleccionado
export default function MaintenanceCalendarPage() {
  const [calYear, setCalYear] = useState(now.getFullYear());
  const [calMonth, setCalMonth] = useState(now.getMonth());
  const [calendarioData, setCalendarioData] = useState<Mantenimiento[]>([]);
  const [loadingCalendario, setLoadingCalendario] = useState(false);
  const [tipoActivoMap, setTipoActivoMap] = useState<Record<number, string>>(
    {},
  );

  // Filtros UI
  const [serialFilter, setSerialFilter] = useState("");
  const [filterEstado, setFilterEstado] = useState("");
  const [filterTipo, setFilterTipo] = useState("");

  // Área SearchableSelect
  const [areaOptions, setAreaOptions] = useState<SelectOption[]>([]);
  const [areaSearch, setAreaSearch] = useState("");
  const [areaSelectedId, setAreaSelectedId] = useState<number | null>(null);
  const [areaShowDropdown, setAreaShowDropdown] = useState(false);
  const [areaLoading, setAreaLoading] = useState(false);

  // Responsable SearchableSelect
  const [respOptions, setRespOptions] = useState<SelectOption[]>([]);
  const [respSearch, setRespSearch] = useState("");
  const [respSelectedId, setRespSelectedId] = useState<number | null>(null);
  const [respShowDropdown, setRespShowDropdown] = useState(false);
  const [respLoading, setRespLoading] = useState(false);

  // Filtros aplicados (persisten al cambiar de mes)
  const [appliedFilters, setAppliedFilters] = useState<AppliedCalendarFilters>(
    {},
  );

  // Carga áreas y técnicos al montar
  useEffect(() => {
    setAreaLoading(true);
    getAreas(1, 200)
      .then((res) =>
        setAreaOptions(res.datos.map((a) => ({ id: a.id, label: a.nombre }))),
      )
      .catch(() => {})
      .finally(() => setAreaLoading(false));

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

  // Función para cargar mantenimientos del mes seleccionado con los filtros aplicados
  const fetchCalendario = useCallback(
    async (
      year: number,
      month: number,
      filters: AppliedCalendarFilters = {},
    ) => {
      setLoadingCalendario(true);
      const { desde, hasta } = getMonthRange(year, month);
      try {
        let data = await getMantenimientosCalendario(desde, hasta, {
          areaId: filters.areaId,
          estado: filters.estado,
          tipo: filters.tipo,
          responsableId: filters.responsableId,
        });
        // Filtro frontend por número de serie
        if (filters.serial) {
          const serial = filters.serial.toLowerCase();
          data = data.filter((m) =>
            m.activoNumeroSerie?.toLowerCase().includes(serial),
          );
        }
        setCalendarioData(data);
        const uniqueIds = [...new Set(data.map((m) => m.activoId))];
        const entries = await Promise.all(
          uniqueIds.map(async (id) => {
            try {
              const activo = await getActivoById(id);
              return [id, activo.tipoActivoNombre] as [number, string];
            } catch {
              return [id, ""] as [number, string];
            }
          }),
        );
        setTipoActivoMap(Object.fromEntries(entries));
      } catch {
        setCalendarioData([]);
      } finally {
        setLoadingCalendario(false);
      }
    },
    [],
  );

  useEffect(() => {
    void fetchCalendario(calYear, calMonth, appliedFilters);
  }, [fetchCalendario, calYear, calMonth, appliedFilters]);

  function handleMonthChange(year: number, month: number) {
    setCalYear(year);
    setCalMonth(month);
  }

  function handleApplyFilters(e: React.FormEvent) {
    e.preventDefault();
    const filters: AppliedCalendarFilters = {};
    if (areaSelectedId !== null) filters.areaId = areaSelectedId;
    if (filterEstado !== "") filters.estado = parseInt(filterEstado, 10);
    if (filterTipo !== "") filters.tipo = parseInt(filterTipo, 10);
    if (respSelectedId !== null) filters.responsableId = respSelectedId;
    if (serialFilter.trim()) filters.serial = serialFilter.trim();
    setAppliedFilters(filters);
  }

  function handleClearFilters() {
    setSerialFilter("");
    setFilterEstado("");
    setFilterTipo("");
    setAreaSearch("");
    setAreaSelectedId(null);
    setRespSearch("");
    setRespSelectedId(null);
    setAppliedFilters({});
  }

  const filteredAreas = areaOptions.filter((a) =>
    a.label.toLowerCase().includes(areaSearch.toLowerCase()),
  );
  const filteredResp = respOptions.filter(
    (r) =>
      r.label.toLowerCase().includes(respSearch.toLowerCase()) ||
      (r.sublabel?.toLowerCase().includes(respSearch.toLowerCase()) ?? false),
  );

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div>
        <h2 className="text-base font-bold text-[#1A2B5E] leading-tight">
          Calendario de Mantenimientos
        </h2>
        <p className="text-sm text-slate-500 mt-0.5">
          Visualiza todos los mantenimientos programados del mes, su estado y a
          qué activo corresponden. Usa los filtros para buscar por área, técnico
          o número de serie.
        </p>
      </div>

      {/* Stats */}
      <StatsCards data={calendarioData} />

      {/* Filtros */}
      <FilterPanel onApply={handleApplyFilters} onClear={handleClearFilters}>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {/* Número de serie — filtro frontend */}
          <div className="flex flex-col gap-1">
            <FilterLabel>Número de serie</FilterLabel>
            <input
              type="text"
              className={filterInputCls}
              placeholder="Ej. 2C43FC2145"
              value={serialFilter}
              onChange={(e) => setSerialFilter(e.target.value)}
            />
          </div>
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
          {/* Área */}
          <SearchableSelect
            id="cal-area-filter"
            label="Área"
            variant="filter"
            inputClassName="py-2"
            options={filteredAreas}
            loading={areaLoading}
            selectedId={areaSelectedId}
            searchValue={areaSearch}
            onSearchChange={(e) => setAreaSearch(e.target.value)}
            onSelect={(opt) => {
              setAreaSelectedId(opt.id);
              setAreaSearch(opt.label);
              setAreaShowDropdown(false);
            }}
            showDropdown={areaShowDropdown}
            onFocus={() => setAreaShowDropdown(true)}
            onBlur={() => setAreaShowDropdown(false)}
            placeholder="Buscar área..."
            onClear={() => {
              setAreaSelectedId(null);
              setAreaSearch("");
            }}
          />
          {/* Responsable */}
          <SearchableSelect
            id="cal-resp-filter"
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
        </div>
      </FilterPanel>

      {/* Calendario */}
      <CalendarWidget
        data={calendarioData}
        loading={loadingCalendario}
        year={calYear}
        month={calMonth}
        onMonthChange={handleMonthChange}
        tipoActivoMap={tipoActivoMap}
      />
    </div>
  );
}
