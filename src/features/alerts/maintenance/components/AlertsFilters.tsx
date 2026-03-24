"use client";
import { useState } from "react";
import {
  FilterPanel,
  FilterLabel,
  filterInputCls,
} from "@/shared/ui/FilterPanel";
import { AlertaTipo } from "@/features/alerts/maintenance/types";

export interface AlertsAppliedFilters {
  leida?: boolean;
  tipo?: AlertaTipo;
}

interface AlertsFiltersProps {
  onApply: (filters: AlertsAppliedFilters) => void;
  onClear: () => void;
}

// Componente de filtros para alertas de mantenimiento
export function AlertsFilters({ onApply, onClear }: AlertsFiltersProps) {
  const [leida, setLeida] = useState<string>("");
  const [tipo, setTipo] = useState<string>("");

  function handleApply(e: React.FormEvent) {
    e.preventDefault();
    const filters: AlertsAppliedFilters = {};
    if (leida !== "") filters.leida = leida === "true";
    if (tipo !== "") filters.tipo = Number(tipo) as AlertaTipo;
    onApply(filters);
  }

  function handleClear() {
    setLeida("");
    setTipo("");
    onClear();
  }

  return (
    <FilterPanel onApply={handleApply} onClear={handleClear}>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Tipo */}
        <div className="flex flex-col gap-1">
          <FilterLabel>Tipo</FilterLabel>
          <select
            className={`${filterInputCls} pr-8`}
            value={tipo}
            onChange={(e) => setTipo(e.target.value)}
          >
            <option value="">Todos</option>
            <option value={AlertaTipo.ProximoMantenimiento}>
              Próximo Mantenimiento
            </option>
            <option value={AlertaTipo.ActivoEnMantenimiento}>
              Activo en Mantenimiento
            </option>
            <option value={AlertaTipo.ActivoDisponible}>
              Activo Disponible
            </option>
          </select>
        </div>

        {/* Leída */}
        <div className="flex flex-col gap-1">
          <FilterLabel>Estado de lectura</FilterLabel>
          <select
            className={`${filterInputCls} pr-8`}
            value={leida}
            onChange={(e) => setLeida(e.target.value)}
          >
            <option value="">Todas</option>
            <option value="false">No leídas</option>
            <option value="true">Leídas</option>
          </select>
        </div>
      </div>
    </FilterPanel>
  );
}
