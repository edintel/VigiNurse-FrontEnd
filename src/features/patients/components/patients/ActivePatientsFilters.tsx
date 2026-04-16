"use client";
import { useEffect, useState } from "react";
import { getAreas } from "@/features/administration/areas/services/areaService";
import { SearchableSelect } from "@/shared/ui/SearchableSelect";
import {
  FilterPanel,
  FilterLabel,
  filterInputCls,
} from "@/shared/ui/FilterPanel";
import { TriageNivel } from "@/features/patients/types";
import type { EpisodioFilters } from "@/features/patients/types";

interface SelectOption {
  id: number;
  label: string;
}

export interface FilterUIState {
  nombre: string;
  cedula: string;
  nivelTriage: string;
  areaId: number | null;
  areaSearch: string;
}

interface ActivePatientsFiltersProps {
  onApply: (filters: EpisodioFilters, ui: FilterUIState) => void;
  onClear: () => void;
  initial?: FilterUIState;
}

// Panel de filtros de pacientes en atención. Gestiona su propio estado interno.
export function ActivePatientsFilters({
  onApply,
  onClear,
  initial,
}: ActivePatientsFiltersProps) {
  const [filterNombre, setFilterNombre] = useState(initial?.nombre ?? "");
  const [filterCedula, setFilterCedula] = useState(initial?.cedula ?? "");
  const [filterNivelTriage, setFilterNivelTriage] = useState<string>(initial?.nivelTriage ?? "");

  // Área SearchableSelect
  const [areaOptions, setAreaOptions] = useState<SelectOption[]>([]);
  const [areaSearch, setAreaSearch] = useState(initial?.areaSearch ?? "");
  const [areaSelectedId, setAreaSelectedId] = useState<number | null>(initial?.areaId ?? null);
  const [areaShowDropdown, setAreaShowDropdown] = useState(false);

  // Carga las áreas al montar el componente.
  useEffect(() => {
    getAreas(1, 200)
      .then((res) =>
        setAreaOptions(res.datos.map((a) => ({ id: a.id, label: a.nombre }))),
      )
      .catch(() => {});
  }, []);

  function handleApply(e: React.FormEvent) {
    e.preventDefault();
    const filters: EpisodioFilters = {};
    if (filterNombre.trim()) filters.nombre = filterNombre.trim();
    if (filterCedula.trim()) filters.cedula = filterCedula.trim();
    if (areaSelectedId != null) filters.areaId = areaSelectedId;
    if (filterNivelTriage !== "")
      filters.nivelTriage = parseInt(filterNivelTriage, 10) as TriageNivel;
    onApply(filters, {
      nombre: filterNombre,
      cedula: filterCedula,
      nivelTriage: filterNivelTriage,
      areaId: areaSelectedId,
      areaSearch,
    });
  }

  function handleClear() {
    setFilterNombre("");
    setFilterCedula("");
    setFilterNivelTriage("");
    setAreaSearch("");
    setAreaSelectedId(null);
    onClear();
  }

  const filteredAreas = areaOptions.filter((a) =>
    a.label.toLowerCase().includes(areaSearch.toLowerCase()),
  );

  return (
    <FilterPanel onApply={handleApply} onClear={handleClear}>
      <div className="flex flex-wrap gap-4 items-end">
        {/* Nombre */}
        <div className="flex flex-col gap-1 flex-1 min-w-[160px]">
          <FilterLabel>Nombre del paciente</FilterLabel>
          <input
            type="text"
            className={filterInputCls}
            placeholder="Buscar por nombre..."
            value={filterNombre}
            onChange={(e) => setFilterNombre(e.target.value)}
          />
        </div>

        {/* Cédula */}
        <div className="flex flex-col gap-1 flex-1 min-w-[160px]">
          <FilterLabel>Identificación (Cédula)</FilterLabel>
          <input
            type="text"
            className={filterInputCls}
            placeholder="Buscar por cédula..."
            value={filterCedula}
            onChange={(e) => setFilterCedula(e.target.value)}
          />
        </div>

        {/* Área */}
        <div className="w-48">
          <SearchableSelect
            id="filter-episodio-area"
            label="Área / Sala"
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

        {/* Nivel de triage */}
        <div className="flex flex-col gap-1 w-40">
          <FilterLabel>Nivel de triage</FilterLabel>
          <select
            className={filterInputCls + " cursor-pointer pr-8"}
            value={filterNivelTriage}
            onChange={(e) => setFilterNivelTriage(e.target.value)}
          >
            <option value="">Todos</option>
            <option value={TriageNivel.NoAplica}>No aplica</option>
            <option value={TriageNivel.NoUrgente}>5 · No urgente</option>
            <option value={TriageNivel.Prioritario}>4 · Prioritario</option>
            <option value={TriageNivel.Urgencia}>3 · Urgencia</option>
            <option value={TriageNivel.Emergencia}>2 · Emergencia</option>
            <option value={TriageNivel.Reanimacion}>1 · Reanimación</option>
          </select>
        </div>
      </div>
    </FilterPanel>
  );
}
