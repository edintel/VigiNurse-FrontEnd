"use client";
import type { Role } from "@/features/users/types";

// Define las propiedades del componente RoleMultiSelect.
interface RoleMultiSelectProps {
  selectedRoles: Role[];
  filteredRoles: Role[];
  selectedIds: number[];
  loading?: boolean;
  rolesLoading?: boolean;
  rolesError?: string | null;
  searchValue: string;
  showDropdown: boolean;
  onSearchChange: (value: string) => void;
  onFocus: () => void;
  onBlur: () => void;
  onToggle: (role: Role) => void;
  onRemove: (id: number) => void;
  onRetry?: () => void;
  error?: string;
  disabled?: boolean;
}
// Componente de selección múltiple para roles, con búsqueda y manejo de estados de carga y error.
export function RoleMultiSelect({
  selectedRoles,
  filteredRoles,
  selectedIds,
  loading,
  rolesLoading,
  rolesError,
  searchValue,
  showDropdown,
  onSearchChange,
  onFocus,
  onBlur,
  onToggle,
  onRemove,
  onRetry,
  error,
  disabled,
}: RoleMultiSelectProps) {
  return (
    <div className="form-control w-full">
      <label className="label pb-1" htmlFor="create-rol">
        <span
          className="label-text text-sm font-medium"
          style={{ color: "#1A2B5E" }}
        >
          Roles <span className="text-error">*</span>
        </span>
      </label>

      {selectedRoles.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-2">
          {selectedRoles.map((role) => (
            <span
              key={role.id}
              className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium text-white"
              style={{ backgroundColor: "#09268E" }}
            >
              {role.nombre}
              <button
                type="button"
                className="ml-0.5 hover:opacity-75 transition-opacity"
                onClick={() => onRemove(role.id)}
                disabled={loading}
                aria-label={`Quitar ${role.nombre}`}
              >
                ✕
              </button>
            </span>
          ))}
        </div>
      )}

      <div className="relative">
        <input
          id="create-rol"
          type="text"
          value={searchValue}
          onChange={(e) => onSearchChange(e.target.value)}
          onFocus={onFocus}
          onBlur={onBlur}
          placeholder={
            rolesLoading ? "Cargando roles..." : "Buscar y seleccionar roles..."
          }
          className={`input input-bordered w-full bg-[#EEEEEE] border-[#B0B0B0] text-[#1A2B5E] placeholder:text-[#B0B0B0] focus:border-[#09268E] focus:outline-none ${error ? "input-error" : ""}`}
          disabled={disabled || rolesLoading}
          autoComplete="off"
        />

        {showDropdown && !rolesLoading && (
          <div className="absolute z-30 mt-1 max-h-52 w-full overflow-y-auto rounded-lg border border-[#B0B0B0] bg-white shadow-md">
            {filteredRoles.length > 0 ? (
              filteredRoles.map((role) => {
                const isSelected = selectedIds.includes(role.id);
                return (
                  <button
                    key={role.id}
                    type="button"
                    className={`w-full px-3 py-2 text-left hover:bg-[#F8FAFC] transition-colors flex items-start gap-2 ${isSelected ? "bg-[#EEF2FF]" : ""}`}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      onToggle(role);
                    }}
                  >
                    <span
                      className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border ${isSelected ? "border-[#09268E] bg-[#09268E] text-white" : "border-[#B0B0B0]"}`}
                    >
                      {isSelected && (
                        <svg
                          className="h-3 w-3"
                          viewBox="0 0 12 12"
                          fill="none"
                        >
                          <path
                            d="M2 6l3 3 5-5"
                            stroke="currentColor"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      )}
                    </span>
                    <span>
                      <p className="text-sm font-medium text-[#1A2B5E]">
                        {role.nombre}
                      </p>
                      <p className="text-xs text-slate-500">
                        {role.descripcion}
                      </p>
                    </span>
                  </button>
                );
              })
            ) : (
              <p className="px-3 py-2 text-sm text-slate-500">
                No se encontraron roles.
              </p>
            )}
          </div>
        )}
      </div>

      {rolesError && (
        <label className="label pt-1 flex items-center justify-between gap-2">
          <span className="label-text-alt text-error">{rolesError}</span>
          {onRetry && (
            <button
              type="button"
              className="label-text-alt text-[#09268E] underline"
              onClick={onRetry}
              disabled={rolesLoading || loading}
            >
              Reintentar
            </button>
          )}
        </label>
      )}
      {error && (
        <label className="label pt-1">
          <span className="label-text-alt text-error">{error}</span>
        </label>
      )}
    </div>
  );
}
