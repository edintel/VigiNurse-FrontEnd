"use client";
import { useState } from "react";
// Muestra el componente de filtro label.
export function FilterLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-xs font-semibold text-slate-500 uppercase tracking-[0.5px] leading-none">
      {children}
    </span>
  );
}
export const filterInputCls =
  "bg-white border border-[#e2e8f0] rounded py-2 px-3 text-sm text-slate-900 placeholder:text-gray-400 focus:outline-none focus:border-[#09268E] transition-colors w-full";
interface FilterPanelProps {
  children: React.ReactNode;
  onApply: (e: React.FormEvent) => void;
  onClear: () => void;
  defaultOpen?: boolean;
}
// Componente de panel de filtros que se puede expandir y contraer. Contiene un botón para aplicar los filtros y otro para limpiarlos.
export function FilterPanel({
  children,
  onApply,
  onClear,
  defaultOpen = true,
}: FilterPanelProps) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="bg-white rounded-xl shadow-sm border border-[#E2E8F0] overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-5 py-3 bg-[#f8fafc]/80 border-b border-[#f1f5f9] hover:bg-[#f1f5f9]/60 transition-colors"
      >
        <div className="flex items-center gap-2">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth="2.5"
            stroke="currentColor"
            className="size-[14px] text-slate-500"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 3c2.755 0 5.455.232 8.083.678.533.09.917.556.917 1.096v1.044a2.25 2.25 0 0 1-.659 1.591l-5.432 5.432a2.25 2.25 0 0 0-.659 1.591v2.927a2.25 2.25 0 0 1-1.244 2.013L9.75 21v-6.568a2.25 2.25 0 0 0-.659-1.591L3.659 7.409A2.25 2.25 0 0 1 3 5.818V4.774c0-.54.384-1.006.917-1.096A48.32 48.32 0 0 1 12 3Z"
            />
          </svg>
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-[0.6px]">
            Filtros
          </span>
        </div>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth="2.5"
          stroke="currentColor"
          className={`size-[14px] text-slate-400 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="m19.5 8.25-7.5 7.5-7.5-7.5"
          />
        </svg>
      </button>

      {open && (
        <form onSubmit={onApply} className="px-5 pt-5 pb-4 flex flex-col gap-5">
          {children}

          <div className="border-t border-[#f8fafc] pt-4 flex items-center justify-end gap-3">
            <button
              type="button"
              className="btn btn-ghost btn-sm font-bold text-slate-500"
              onClick={onClear}
            >
              Limpiar filtros
            </button>
            <button
              type="submit"
              className="btn btn-sm font-bold text-white rounded-lg px-6"
              style={{ backgroundColor: "#09268E", borderColor: "#09268E" }}
            >
              Aplicar filtros
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
