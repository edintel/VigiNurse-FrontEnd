import React from "react";

// Función para obtener los números de página a mostrar en la paginación.
function getPageNumbers(
  current: number,
  total: number,
): (number | "ellipsis")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages: (number | "ellipsis")[] = [];
  if (current <= 4) {
    for (let i = 1; i <= 5; i++) pages.push(i);
    pages.push("ellipsis");
    pages.push(total);
  } else if (current >= total - 3) {
    pages.push(1);
    pages.push("ellipsis");
    for (let i = total - 4; i <= total; i++) pages.push(i);
  } else {
    pages.push(1);
    pages.push("ellipsis");
    pages.push(current - 1);
    pages.push(current);
    pages.push(current + 1);
    pages.push("ellipsis");
    pages.push(total);
  }
  return pages;
}
interface PaginationFooterProps {
  current: number;
  total: number;
  totalRecords: number;
  showing: number;
  onPageChange: (p: number) => void;
}
// Componente de pie de página de paginación que muestra el número de registros y los botones de navegación.
export function PaginationFooter({
  current,
  total,
  totalRecords,
  showing,
  onPageChange,
}: PaginationFooterProps) {
  return (
    <div className="flex items-center justify-between px-6 py-4 border-t border-[#E2E8F0] bg-[#F8FAFC]">
      <p className="text-xs font-medium text-slate-500 uppercase tracking-[0.6px]">
        Mostrando {showing} de {totalRecords} registros
      </p>
      <div className="flex items-center gap-2">
        <button
          className="px-[13px] py-[7.5px] text-xs font-bold rounded border border-[#E2E8F0] bg-white text-slate-400 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 transition-colors"
          onClick={() => onPageChange(current - 1)}
          disabled={current === 1}
        >
          Anterior
        </button>
        <div className="flex items-center gap-1">
          {getPageNumbers(current, total).map((page, i) =>
            page === "ellipsis" ? (
              <span
                key={`ellipsis-${i}`}
                className="w-8 h-8 flex items-center justify-center text-slate-400 text-sm"
              >
                ...
              </span>
            ) : (
              <button
                key={page}
                onClick={() => onPageChange(page as number)}
                className={`w-8 h-8 flex items-center justify-center text-xs font-bold rounded transition-colors ${
                  page === current
                    ? "bg-[#09268E] text-white"
                    : "text-slate-900 hover:bg-slate-100"
                }`}
              >
                {page}
              </button>
            ),
          )}
        </div>
        <button
          className="px-[13px] py-[7.5px] text-xs font-bold rounded border border-[#E2E8F0] bg-white text-slate-500 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 transition-colors"
          onClick={() => onPageChange(current + 1)}
          disabled={current === total || total === 0}
        >
          Siguiente
        </button>
      </div>
    </div>
  );
}
