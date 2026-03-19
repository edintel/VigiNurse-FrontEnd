"use client";
import React, { useCallback, useEffect, useState } from "react";
import {
  getHospitals,
  getHospitalById,
} from "@/features/hospitals/services/hospitalService";
import { CreateHospitalModal } from "@/features/hospitals/components/CreateHospitalModal";
import { EditHospitalModal } from "@/features/hospitals/components/EditHospitalModal";
import { DeleteHospitalModal } from "@/features/hospitals/components/DeleteHospitalModal";
import { PaginationFooter } from "@/shared/ui/PaginationFooter";
import {
  FilterPanel,
  FilterLabel,
  filterInputCls,
} from "@/shared/ui/FilterPanel";
import type { Hospital, PaginatedHospitals } from "@/features/hospitals/types";
const PAGE_SIZE = 10;

// Componente principal para la gestión de hospitales.
export default function HospitalsPage() {
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [totalRegistros, setTotalRegistros] = useState(0);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [paginaActual, setPaginaActual] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filterIdInput, setFilterIdInput] = useState("");
  const [appliedId, setAppliedId] = useState<number | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [editHospital, setEditHospital] = useState<Hospital | null>(null);
  const [deleteHospital, setDeleteHospital] = useState<Hospital | null>(null);
  const fetchAll = useCallback(async (page: number) => {
    setLoading(true);
    setError(null);
    try {
      const result: PaginatedHospitals = await getHospitals(page, PAGE_SIZE);
      setHospitals(result.datos);
      setTotalRegistros(result.totalRegistros);
      setTotalPaginas(result.totalPaginas);
      setPaginaActual(result.paginaActual);
    } catch {
      setError("No se pudieron cargar los hospitales. Intente nuevamente.");
    } finally {
      setLoading(false);
    }
  }, []);
  const fetchById = useCallback(async (id: number) => {
    setLoading(true);
    setError(null);
    try {
      const hospital = await getHospitalById(id);
      setHospitals([hospital]);
      setTotalRegistros(1);
      setTotalPaginas(1);
      setPaginaActual(1);
    } catch {
      setHospitals([]);
      setTotalRegistros(0);
      setTotalPaginas(1);
      setPaginaActual(1);
      setError(`No se encontró ningún hospital con ID ${id}.`);
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    void fetchAll(1);
  }, [fetchAll]);
  // Maneja los filtros aplicados.
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
  // Maneja la limpieza de filtros.
  function handleClearFilters() {
    setFilterIdInput("");
    setAppliedId(null);
    void fetchAll(1);
  }
  // Maneja el cambio de pagina
  function handlePageChange(page: number) {
    if (appliedId !== null) return;
    void fetchAll(page);
  }
  // Maneja la creacion de un nuevo hospital.
  function handleHospitalCreated(hospital: Hospital) {
    setHospitals((prev) => [hospital, ...prev]);
    setTotalRegistros((n) => n + 1);
  }
  // Maneja la actualización de un hospital existente.
  function handleHospitalUpdated(updated: Hospital) {
    setHospitals((prev) =>
      prev.map((h) => (h.id === updated.id ? updated : h)),
    );
  }
  // Maneja la eliminación de un hospital.
  function handleHospitalDeleted(id: number) {
    setHospitals((prev) => prev.filter((h) => h.id !== id));
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
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 4.5v15m7.5-7.5h-15"
            />
          </svg>
          Nuevo hospital
        </button>
      </div>

      <FilterPanel onApply={handleApplyFilters} onClear={handleClearFilters}>
        <div className="flex gap-4 items-end">
          <div className="flex flex-col gap-1 w-48">
            <FilterLabel>ID del hospital</FilterLabel>
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
                appliedId !== null
                  ? fetchById(appliedId)
                  : fetchAll(paginaActual)
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
                <th className="text-xs font-semibold uppercase tracking-wide text-right">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={3} className="text-center py-12">
                    <span className="loading loading-spinner loading-md text-[#09268E]" />
                  </td>
                </tr>
              ) : hospitals.length === 0 ? (
                <tr>
                  <td
                    colSpan={3}
                    className="text-center py-12 text-base-content/40 text-sm"
                  >
                    No se encontraron hospitales.
                  </td>
                </tr>
              ) : (
                hospitals.map((hospital) => (
                  <tr key={hospital.id} className="hover:bg-base-200">
                    <td className="text-base-content/60 font-mono text-sm">
                      {hospital.id}
                    </td>
                    <td>
                      <span className="font-semibold text-[#1A2B5E]">
                        {hospital.nombre}
                      </span>
                    </td>
                    <td>
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          className="btn btn-square btn-sm btn-ghost text-[#09268E]"
                          title="Editar hospital"
                          onClick={() => setEditHospital(hospital)}
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

                        <button
                          type="button"
                          className="btn btn-square btn-sm btn-ghost text-red-400 hover:text-red-600"
                          title="Eliminar hospital"
                          onClick={() => setDeleteHospital(hospital)}
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
                              d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"
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
          showing={hospitals.length}
          onPageChange={handlePageChange}
        />
      </div>

      <CreateHospitalModal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        onCreated={handleHospitalCreated}
      />
      <EditHospitalModal
        open={editHospital !== null}
        hospital={editHospital}
        onClose={() => setEditHospital(null)}
        onUpdated={handleHospitalUpdated}
      />
      <DeleteHospitalModal
        open={deleteHospital !== null}
        hospital={deleteHospital}
        onClose={() => setDeleteHospital(null)}
        onDeleted={handleHospitalDeleted}
      />
    </div>
  );
}
