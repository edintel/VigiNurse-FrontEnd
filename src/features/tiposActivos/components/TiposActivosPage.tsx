"use client";
import React, { useCallback, useEffect, useState } from "react";
import {
  getTiposActivos,
  getTipoActivoById,
} from "@/features/tiposActivos/services/tipoActivoService";
import { CreateTipoActivoModal } from "@/features/tiposActivos/components/CreateTipoActivoModal";
import { EditTipoActivoModal } from "@/features/tiposActivos/components/EditTipoActivoModal";
import { PaginationFooter } from "@/shared/ui/PaginationFooter";
import {
  FilterPanel,
  FilterLabel,
  filterInputCls,
} from "@/shared/ui/FilterPanel";
import type {
  TipoActivo,
  PaginatedTiposActivos,
} from "@/features/tiposActivos/types";

const PAGE_SIZE = 10;

// Componente principal para la gestión de tipos de activos.
export default function TiposActivosPage() {
  const [tiposActivos, setTiposActivos] = useState<TipoActivo[]>([]);
  const [totalRegistros, setTotalRegistros] = useState(0);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [paginaActual, setPaginaActual] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filtros del panel
  const [filterIdInput, setFilterIdInput] = useState("");

  // Filtros aplicados
  const [appliedId, setAppliedId] = useState<number | null>(null);

  // Estado de modales
  const [showCreate, setShowCreate] = useState(false);
  const [editTipoActivo, setEditTipoActivo] = useState<TipoActivo | null>(null);

  const fetchAll = useCallback(async (page: number) => {
    setLoading(true);
    setError(null);
    try {
      const result: PaginatedTiposActivos = await getTiposActivos(
        page,
        PAGE_SIZE,
      );
      setTiposActivos(result.datos);
      setTotalRegistros(result.totalRegistros);
      setTotalPaginas(result.totalPaginas);
      setPaginaActual(result.paginaActual);
    } catch {
      setError(
        "No se pudieron cargar los tipos de activos. Intente nuevamente.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchById = useCallback(async (id: number) => {
    setLoading(true);
    setError(null);
    try {
      const tipoActivo = await getTipoActivoById(id);
      setTiposActivos([tipoActivo]);
      setTotalRegistros(1);
      setTotalPaginas(1);
      setPaginaActual(1);
    } catch {
      setTiposActivos([]);
      setTotalRegistros(0);
      setTotalPaginas(1);
      setPaginaActual(1);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchAll(1);
  }, [fetchAll]);

  function handleApplyFilters(e: React.FormEvent) {
    e.preventDefault();
    const id = parseInt(filterIdInput.trim(), 10);
    if (!isNaN(id) && id > 0) {
      setAppliedId(id);
      void fetchById(id);
    } else {
      setAppliedId(null);
      void fetchAll(1);
    }
  }

  function handleClearFilters() {
    setFilterIdInput("");
    setAppliedId(null);
    void fetchAll(1);
  }

  function handlePageChange(page: number) {
    if (appliedId !== null) return;
    void fetchAll(page);
  }

  function handleTipoActivoCreated(tipoActivo: TipoActivo) {
    setTiposActivos((prev) => [tipoActivo, ...prev]);
    setTotalRegistros((n) => n + 1);
  }

  function handleTipoActivoUpdated(updated: TipoActivo) {
    setTiposActivos((prev) =>
      prev.map((t) => (t.id === updated.id ? updated : t)),
    );
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
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 4.5v15m7.5-7.5h-15"
            />
          </svg>
          Nuevo tipo de activo
        </button>
      </div>

      <FilterPanel onApply={handleApplyFilters} onClear={handleClearFilters}>
        <div className="flex flex-wrap gap-4 items-end">
          <div className="flex flex-col gap-1 w-48">
            <FilterLabel>ID del tipo de activo</FilterLabel>
            <input
              type="number"
              min="1"
              className={filterInputCls}
              placeholder="Ej. 1"
              value={filterIdInput}
              onChange={(e) => setFilterIdInput(e.target.value)}
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
              onClick={() =>
                appliedId !== null ? fetchById(appliedId) : fetchAll(paginaActual)
              }
            >
              Reintentar
            </button>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="table table-zebra w-full [&_td]:py-2.5 [&_th]:py-2.5">
            <thead>
              <tr className="bg-[#F8FAFC] text-[#1A2B5E]">
                <th className="text-xs font-semibold uppercase tracking-wide w-24">
                  ID
                </th>
                <th className="text-xs font-semibold uppercase tracking-wide">
                  Nombre
                </th>
                <th className="text-xs font-semibold uppercase tracking-wide">
                  Descripción
                </th>
                <th className="text-xs font-semibold uppercase tracking-wide text-right">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={4} className="text-center py-12">
                    <span className="loading loading-spinner loading-md text-[#09268E]" />
                  </td>
                </tr>
              ) : tiposActivos.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    className="text-center py-12 text-base-content/40 text-sm"
                  >
                    No se encontraron tipos de activos.
                  </td>
                </tr>
              ) : (
                tiposActivos.map((tipoActivo) => (
                  <tr key={tipoActivo.id} className="hover:bg-base-200">
                    <td className="text-base-content/60 font-mono text-sm">
                      {tipoActivo.id}
                    </td>
                    <td>
                      <span className="font-semibold text-[#1A2B5E]">
                        {tipoActivo.nombre}
                      </span>
                    </td>
                    <td className="text-slate-500 text-sm max-w-xs truncate">
                      {tipoActivo.descripcion}
                    </td>
                    <td>
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          className="btn btn-square btn-sm btn-ghost text-[#09268E]"
                          title="Editar tipo de activo"
                          onClick={() => setEditTipoActivo(tipoActivo)}
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
                      </div>
                    </td>
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
          showing={tiposActivos.length}
          onPageChange={handlePageChange}
        />
      </div>

      <CreateTipoActivoModal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        onCreated={handleTipoActivoCreated}
      />
      <EditTipoActivoModal
        open={editTipoActivo !== null}
        tipoActivo={editTipoActivo}
        onClose={() => setEditTipoActivo(null)}
        onUpdated={handleTipoActivoUpdated}
      />
    </div>
  );
}
