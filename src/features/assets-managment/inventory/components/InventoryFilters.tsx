"use client";
import { useEffect, useState } from "react";
import { getTiposActivos } from "@/features/administration/assetTypes/services/assetTypeService";
import { getAreas } from "@/features/administration/areas/services/areaService";
import { SearchableSelect } from "@/shared/ui/SearchableSelect";
import {
  FilterPanel,
  FilterLabel,
  filterInputCls,
} from "@/shared/ui/FilterPanel";
import { ActivoEstado } from "@/features/assets-managment/inventory/types";
import type { ActivoFilters } from "@/features/assets-managment/inventory/types";

interface SelectOption {
  id: number;
  label: string;
}

interface InventoryFiltersProps {
  onApply: (filters: ActivoFilters) => void;
  onClear: () => void;
}

// Panel de filtros del inventario de activos. Gestiona su propio estado interno.
export function InventoryFilters({ onApply, onClear }: InventoryFiltersProps) {
  // Filtros visuales
  const [filterNumeroSerie, setFilterNumeroSerie] = useState("");
  const [filterMarca, setFilterMarca] = useState("");
  const [filterModelo, setFilterModelo] = useState("");

  // Filtro condición
  const [filterEstado, setFilterEstado] = useState<string>("");

  // Tipo activo SearchableSelect
  const [tipoOptions, setTipoOptions] = useState<SelectOption[]>([]);
  const [tipoSearch, setTipoSearch] = useState("");
  const [tipoSelectedId, setTipoSelectedId] = useState<number | null>(null);
  const [tipoShowDropdown, setTipoShowDropdown] = useState(false);

  // Área SearchableSelect
  const [areaOptions, setAreaOptions] = useState<SelectOption[]>([]);
  const [areaSearch, setAreaSearch] = useState("");
  const [areaSelectedId, setAreaSelectedId] = useState<number | null>(null);
  const [areaShowDropdown, setAreaShowDropdown] = useState(false);

  // Carga las opciones de tipos y áreas al montar el componente.
  useEffect(() => {
    getTiposActivos(1, 200)
      .then((res) =>
        setTipoOptions(res.datos.map((t) => ({ id: t.id, label: t.nombre }))),
      )
      .catch(() => {});
    getAreas(1, 200)
      .then((res) =>
        setAreaOptions(res.datos.map((a) => ({ id: a.id, label: a.nombre }))),
      )
      .catch(() => {});
  }, []);

  function handleApply(e: React.FormEvent) {
    e.preventDefault();
    onApply({
      estado:
        filterEstado !== ""
          ? (parseInt(filterEstado, 10) as ActivoEstado)
          : null,
      tipoId: tipoSelectedId ?? null,
      areaId: areaSelectedId ?? null,
      numeroSerie: filterNumeroSerie || undefined,
      marca: filterMarca || undefined,
      modelo: filterModelo || undefined,
    });
  }

  function handleClear() {
    setFilterNumeroSerie("");
    setFilterMarca("");
    setFilterModelo("");
    setFilterEstado("");
    setTipoSearch("");
    setTipoSelectedId(null);
    setAreaSearch("");
    setAreaSelectedId(null);
    onClear();
  }

  const filteredTipos = tipoOptions.filter((t) =>
    t.label.toLowerCase().includes(tipoSearch.toLowerCase()),
  );
  const filteredAreas = areaOptions.filter((a) =>
    a.label.toLowerCase().includes(areaSearch.toLowerCase()),
  );

  return (
    <FilterPanel onApply={handleApply} onClear={handleClear}>
      <div className="flex flex-wrap gap-4 items-end">
        {/* Número de serie */}
        <div className="flex flex-col gap-1 w-44">
          <FilterLabel>Número de serie</FilterLabel>
          <input
            type="text"
            className={filterInputCls}
            placeholder="Ej. SN-992..."
            value={filterNumeroSerie}
            onChange={(e) => setFilterNumeroSerie(e.target.value)}
          />
        </div>
        {/* Marca */}
        <div className="flex flex-col gap-1 w-36">
          <FilterLabel>Marca</FilterLabel>
          <input
            type="text"
            className={filterInputCls}
            placeholder="Ej. Samsung"
            value={filterMarca}
            onChange={(e) => setFilterMarca(e.target.value)}
          />
        </div>
        {/* Modelo */}
        <div className="flex flex-col gap-1 w-36">
          <FilterLabel>Modelo</FilterLabel>
          <input
            type="text"
            className={filterInputCls}
            placeholder="Filtrar modelo..."
            value={filterModelo}
            onChange={(e) => setFilterModelo(e.target.value)}
          />
        </div>
        {/* Tipo de activo */}
        <div className="w-44">
          <SearchableSelect
            id="filter-activo-tipo"
            label="Tipo de activo"
            variant="filter"
            inputClassName="py-2"
            options={filteredTipos}
            selectedId={tipoSelectedId}
            searchValue={tipoSearch}
            onSearchChange={(e) => setTipoSearch(e.target.value)}
            onSelect={(opt) => {
              setTipoSelectedId(opt.id);
              setTipoSearch(opt.label);
              setTipoShowDropdown(false);
            }}
            showDropdown={tipoShowDropdown}
            onFocus={() => setTipoShowDropdown(true)}
            onBlur={() => setTipoShowDropdown(false)}
            placeholder="Todos"
            onClear={() => {
              setTipoSelectedId(null);
              setTipoSearch("");
            }}
          />
        </div>
        {/* Condición */}
        <div className="flex flex-col gap-1 w-36">
          <FilterLabel>Condición</FilterLabel>
          <select
            className={filterInputCls + " cursor-pointer pr-8"}
            value={filterEstado}
            onChange={(e) => setFilterEstado(e.target.value)}
          >
            <option value="">Todas</option>
            <option value="0">Disponible</option>
            <option value="1">Mantenimiento</option>
            <option value="2">Retirado</option>
          </select>
        </div>
        {/* Área */}
        <div className="w-44">
          <SearchableSelect
            id="filter-activo-area"
            label="Área / Ubicación"
            variant="filter"
            inputClassName="py-2"
            options={filteredAreas}
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
            placeholder="Todas"
            onClear={() => {
              setAreaSelectedId(null);
              setAreaSearch("");
            }}
          />
        </div>
      </div>
    </FilterPanel>
  );
}
