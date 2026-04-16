"use client";
import { useCallback, useEffect, useState } from "react";
import { PaginationFooter } from "@/shared/ui/PaginationFooter";
import { FilterLabel, FilterPanel, filterInputCls } from "@/shared/ui/FilterPanel";
import type { MedicamentoAdmin, PaginatedMedicamentos } from "@/features/administration/medicamentos/types";
import { getMedicamentos } from "@/features/administration/medicamentos/services/medicamentosService";
import { CreateMedicamentoModal } from "@/features/administration/medicamentos/components/CreateMedicamentoModal";


const PAGE_SIZE = 10;

export default function MedicamentosPage() {
  const [medicamentos, setMedicamentos] = useState<MedicamentoAdmin[]>([]);
  const [totalRegistros, setTotalRegistros] = useState(0);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [paginaActual, setPaginaActual] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [filterNombreInput, setFilterNombreInput] = useState("");
  const [appliedNombre, setAppliedNombre] = useState("");

  const [showCreate, setShowCreate] = useState(false);


  const fetchAll = useCallback(async (page: number, nombre?: string) => {
    setLoading(true);
    setError(null);
    try {
      const result: PaginatedMedicamentos = await getMedicamentos(page, PAGE_SIZE, nombre);
      setMedicamentos(result.datos);
      setTotalRegistros(result.totalRegistros);
      setTotalPaginas(result.totalPaginas);
      setPaginaActual(result.paginaActual);
    } catch {
      setError("No se pudieron cargar los medicamentos. Intente nuevamente.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchAll(1);
  }, [fetchAll]);

  function handleApplyFilters(e: React.FormEvent) {
    e.preventDefault();
    const nombre = filterNombreInput.trim();
    setAppliedNombre(nombre);
    void fetchAll(1, nombre || undefined);
  }

  function handleClearFilters() {
    setFilterNombreInput("");
    setAppliedNombre("");
    void fetchAll(1);
  }

  function handlePageChange(page: number) {
    void fetchAll(page, appliedNombre || undefined);
  }

  function handleCreated(m: MedicamentoAdmin) {
    setMedicamentos((prev) => [m, ...prev]);
    setTotalRegistros((n) => n + 1);
  }

  function handleUpdated(updated: MedicamentoAdmin) {
    setMedicamentos((prev) => prev.map((m) => (m.id === updated.id ? updated : m)));
  }

  function handleDeleted(id: number) {
    setMedicamentos((prev) => prev.filter((m) => m.id !== id));
    setTotalRegistros((n) => Math.max(0, n - 1));
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
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
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Nuevo medicamento
        </button>
      </div>

      <FilterPanel onApply={handleApplyFilters} onClear={handleClearFilters}>
        <div className="flex flex-wrap gap-4 items-end">
          <div className="flex flex-col gap-1 w-72">
            <FilterLabel>Nombre</FilterLabel>
            <input
              type="text"
              className={filterInputCls}
              placeholder="Ej. Amoxicilina"
              value={filterNombreInput}
              onChange={(e) => setFilterNombreInput(e.target.value)}
            />
          </div>
        </div>
      </FilterPanel>

      <div className="bg-white rounded-xl shadow-sm border border-[#E2E8F0] overflow-hidden">
        {error && (
          <div role="alert" className="alert alert-error m-4 text-sm py-3">
            <span>{error}</span>
            <button
              className="btn btn-xs btn-ghost"
              onClick={() => fetchAll(paginaActual, appliedNombre || undefined)}
            >
              Reintentar
            </button>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="table table-zebra w-full [&_td]:py-2.5 [&_th]:py-2.5">
            <thead>
              <tr className="bg-[#F8FAFC] text-[#1A2B5E]">
                <th className="text-xs font-semibold uppercase tracking-wide w-24">ID</th>
                <th className="text-xs font-semibold uppercase tracking-wide">Nombre genérico</th>
                <th className="text-xs font-semibold uppercase tracking-wide">Nombre comercial</th>
                <th className="text-xs font-semibold uppercase tracking-wide">Formulación</th>
                <th className="text-xs font-semibold uppercase tracking-wide">Concentración</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center py-12">
                    <span className="loading loading-spinner loading-md text-[#09268E]" />
                  </td>
                </tr>
              ) : medicamentos.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-base-content/40 text-sm">
                    No se encontraron medicamentos.
                  </td>
                </tr>
              ) : (
                medicamentos.map((m) => (
                  <tr key={m.id} className="hover:bg-base-200">
                    <td className="text-base-content/60 font-mono text-sm">{m.id}</td>
                    <td><span className="font-semibold text-[#1A2B5E]">{m.nombreGenerico}</span></td>
                    <td className="text-sm text-slate-600">{m.nombreComercial}</td>
                    <td className="text-sm text-slate-600">{m.formulacionFarma}</td>
                    <td className="text-sm text-slate-600 whitespace-nowrap">{m.concentracion}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <PaginationFooter
          current={paginaActual}
          total={totalPaginas}
          totalRecords={totalRegistros}
          showing={medicamentos.length}
          onPageChange={handlePageChange}
        />
      </div>

      <CreateMedicamentoModal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        onCreated={handleCreated}
      />
      
    </div>
  );
}

