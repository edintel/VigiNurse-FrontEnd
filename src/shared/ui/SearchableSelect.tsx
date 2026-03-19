"use client";

// Define el tipo de las opciones del select y las props del componente.
interface SelectOption {
  id: number;
  label: string;
  sublabel?: string;
}

// Props para el componente SearchableSelect, que incluye manejo de búsqueda, selección, estados de carga y errores.
interface SearchableSelectProps {
  id: string;
  label: string;
  required?: boolean;
  options: SelectOption[];
  loading?: boolean;
  selectedId: number | null;
  searchValue: string;
  onSearchChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSelect: (option: SelectOption) => void;
  showDropdown: boolean;
  onFocus: () => void;
  onBlur: () => void;
  placeholder?: string;
  loadingText?: string;
  emptyText?: string;
  error?: string;
  fetchError?: string;
  onRetry?: () => void;
  onClear?: () => void;
  clearLabel?: string;
  disabled?: boolean;
}
// Componente SearchableSelect que renderiza un input de búsqueda con un dropdown de opciones filtradas, manejando estados de carga, errores y selección.
export function SearchableSelect({
  id,
  label,
  required,
  options,
  loading,
  selectedId,
  searchValue,
  onSearchChange,
  onSelect,
  showDropdown,
  onFocus,
  onBlur,
  placeholder = "Buscar...",
  loadingText = "Cargando...",
  emptyText = "No se encontraron resultados.",
  error,
  fetchError,
  onRetry,
  onClear,
  clearLabel = "Quitar",
  disabled,
}: SearchableSelectProps) {
  return (
    <div className="form-control w-full">
      <label className="label pb-1" htmlFor={id}>
        <span
          className="label-text text-sm font-medium"
          style={{ color: "#1A2B5E" }}
        >
          {label} {required && <span className="text-error">*</span>}
        </span>
        {onClear && selectedId !== null && (
          <button
            type="button"
            className="label-text-alt text-slate-400 hover:text-slate-600 underline text-xs"
            onClick={onClear}
          >
            {clearLabel}
          </button>
        )}
      </label>

      <div className="relative">
        <input
          id={id}
          type="text"
          value={searchValue}
          onChange={onSearchChange}
          onFocus={onFocus}
          onBlur={onBlur}
          placeholder={loading ? loadingText : placeholder}
          className={`input input-bordered w-full bg-[#EEEEEE] border-[#B0B0B0] text-[#1A2B5E] placeholder:text-[#B0B0B0] focus:border-[#09268E] focus:outline-none ${error ? "input-error" : ""}`}
          disabled={disabled || loading}
          autoComplete="off"
        />

        {showDropdown && !loading && (
          <div className="absolute z-30 mt-1 max-h-52 w-full overflow-y-auto rounded-lg border border-[#B0B0B0] bg-white shadow-md">
            {options.length > 0 ? (
              options.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  className={`w-full px-3 py-2 text-left hover:bg-[#F8FAFC] transition-colors ${selectedId === option.id ? "bg-[#EEF2FF]" : ""}`}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    onSelect(option);
                  }}
                >
                  <p className="text-sm font-medium text-[#1A2B5E]">
                    {option.label}
                  </p>
                  {option.sublabel && (
                    <p className="text-xs text-slate-500">{option.sublabel}</p>
                  )}
                </button>
              ))
            ) : (
              <p className="px-3 py-2 text-sm text-slate-500">{emptyText}</p>
            )}
          </div>
        )}
      </div>

      {fetchError && (
        <label className="label pt-1 flex items-center justify-between gap-2">
          <span className="label-text-alt text-error">{fetchError}</span>
          {onRetry && (
            <button
              type="button"
              className="label-text-alt text-[#09268E] underline"
              onClick={onRetry}
              disabled={loading || disabled}
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
