"use client";
import { useCallback, useEffect, useState } from "react";
import { getMedications } from "@/features/patients/services/medicationService";
import {
  MedicacionEstado,
  MEDICACION_ESTADO_CONFIG,
  type Medicacion,
} from "@/features/patients/types";
import {
  FilterPanel,
  FilterLabel,
  filterInputCls,
} from "@/shared/ui/FilterPanel";
import { MedicationDetailModal } from "./MedicationDetailModal";
import { NewMedicationModal } from "./NewMedicationModal";
import { toast } from "@/lib/toast";

function formatDate(s: string) {
  try {
    return new Date(s).toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  } catch {
    return s;
  }
}

function StatusBadge({ estado }: { estado: MedicacionEstado }) {
  const cfg = MEDICACION_ESTADO_CONFIG[estado];
  return (
    <span
      className={`inline-flex items-center text-[10px] font-bold uppercase tracking-[-0.25px] px-2 py-0.5 rounded-full ${cfg.bgCls} ${cfg.textCls}`}
    >
      {cfg.label}
    </span>
  );
}

interface MedicationTabProps {
  episodioId: number;
  canCreate?: boolean;
  canAdminister?: boolean;
  canChangeState?: boolean;
}

// Funcion principal del componente de medicación, que muestra la lista de medicaciones, filtros y modales para detalle y creación.
export function MedicationTab({
  episodioId,
  canCreate = true,
  canAdminister = true,
  canChangeState = true,
}: MedicationTabProps) {
  const [medicaciones, setMedicaciones] = useState<Medicacion[]>([]);
  const [loading, setLoading] = useState(true);
  const [tableLoading, setTableLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [filterEstado, setFilterEstado] = useState<string>("");
  const [filterNombre, setFilterNombre] = useState("");

  // Modals
  const [selected, setSelected] = useState<Medicacion | null>(null);
  const [detalleOpen, setDetalleOpen] = useState(false);
  const [nuevaOpen, setNuevaOpen] = useState(false);

  useEffect(() => {
    if (!canCreate) setNuevaOpen(false);
  }, [canCreate]);

  const loadAll = useCallback(async (showSuccess = false) => {
    setLoading(true);
    setError(null);
    try {
      const data = await getMedications(episodioId);
      setMedicaciones(data);
      if (showSuccess) {
        toast.success("Medicaciones actualizadas correctamente.");
      }
    } catch {
      setError("No se pudieron cargar las medicaciones. Intente nuevamente.");
      toast.error("No se pudieron cargar las medicaciones.");
    } finally {
      setLoading(false);
    }
  }, [episodioId]);

  useEffect(() => {
    void loadAll();
  }, [loadAll]);

  async function handleApplyFilters(e: React.FormEvent) {
    e.preventDefault();
    setTableLoading(true);
    try {
      const filters: { estado?: MedicacionEstado; medicamento?: string } = {};
      if (filterEstado !== "")
        filters.estado = parseInt(filterEstado) as MedicacionEstado;
      if (filterNombre.trim()) filters.medicamento = filterNombre.trim();
      console.log("Applying filters", filters);
      const data = await getMedications(episodioId, filters);
      setMedicaciones(data);
    } catch {
      toast.error("No se pudieron aplicar los filtros de medicación.");
    } finally {
      setTableLoading(false);
    }
  }

  function handleClearFilters() {
    setFilterEstado("");
    setFilterNombre("");
    void loadAll();
  }

  function handleView(m: Medicacion) {
    setSelected(m);
    setDetalleOpen(true);
  }

  function handleCreated(m: Medicacion) {
    setMedicaciones((prev) => [m, ...prev]);
  }

  function handleUpdated(m: Medicacion) {
    setMedicaciones((prev) => prev.map((x) => (x.id === m.id ? m : x)));
  }

  const selectCls = filterInputCls + " cursor-pointer pr-8 appearance-none";

  return (
    <>
      <div className="space-y-4">
        {/* Section header */}
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-2.5">
            <h2 className="text-lg font-bold text-[#0f172a]">Medicación</h2>
            {!loading && (
              <span className="text-xs font-bold bg-[#f1f5f9] text-[#64748b] rounded-full px-2 py-0.5">
                {medicaciones.length}
              </span>
            )}
          </div>
          {canCreate && (
            <button
              type="button"
              className="btn text-white"
              style={{ backgroundColor: "#09268E", borderColor: "#09268E" }}
              onClick={() => setNuevaOpen(true)}
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
              Nueva medicación
            </button>
          )}
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <span className="loading loading-spinner loading-lg text-[#092168]" />
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div role="alert" className="alert alert-error text-sm py-3">
            <span>{error}</span>
            <button
              className="btn btn-xs btn-ghost"
              onClick={() => void loadAll(true)}
            >
              Reintentar
            </button>
          </div>
        )}

        {!loading && !error && (
          <>
            {/* Filters */}
            <FilterPanel
              onApply={(e) => void handleApplyFilters(e)}
              onClear={handleClearFilters}
            >
              <div className="flex flex-wrap gap-4 items-end">
                <div className="flex flex-col gap-1 w-48">
                  <FilterLabel>Estado</FilterLabel>
                  <select
                    className={selectCls}
                    value={filterEstado}
                    onChange={(e) => setFilterEstado(e.target.value)}
                  >
                    <option value="">Todos los estados</option>
                    {Object.values(MedicacionEstado)
                      .filter((v) => typeof v === "number")
                      .map((v) => (
                        <option key={v} value={v}>
                          {
                            MEDICACION_ESTADO_CONFIG[v as MedicacionEstado]
                              .label
                          }
                        </option>
                      ))}
                  </select>
                </div>
                <div className="flex flex-col gap-1 w-56">
                  <FilterLabel>Nombre del medicamento</FilterLabel>
                  <input
                    type="text"
                    className={filterInputCls}
                    placeholder="Buscar por nombre..."
                    value={filterNombre}
                    onChange={(e) => setFilterNombre(e.target.value)}
                  />
                </div>
              </div>
            </FilterPanel>

            {/* Table */}
            <div className="bg-white rounded-xl shadow-sm border border-[#E2E8F0] overflow-hidden">
              <div className="overflow-x-auto">
                <table className="table table-zebra w-full [&_td]:py-3.5 [&_th]:py-3">
                  <thead>
                    <tr className="bg-[#F8FAFC] text-[#1A2B5E] border-b border-[#E2E8F0]">
                      <th className="text-[10px] font-bold uppercase tracking-[0.5px] pl-6">
                        Medicamento
                      </th>
                      <th className="text-[10px] font-bold uppercase tracking-[0.5px]">
                        Dosis
                      </th>
                      <th className="text-[10px] font-bold uppercase tracking-[0.5px]">
                        Estado
                      </th>
                      <th className="text-[10px] font-bold uppercase tracking-[0.5px]">
                        Frecuencia
                      </th>
                      <th className="text-[10px] font-bold uppercase tracking-[0.5px]">
                        Inicio
                      </th>
                      <th className="text-[10px] font-bold uppercase tracking-[0.5px] text-right pr-6">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {tableLoading ? (
                      <tr>
                        <td colSpan={6} className="text-center py-16">
                          <span className="loading loading-spinner loading-md text-[#092168]" />
                        </td>
                      </tr>
                    ) : medicaciones.length === 0 ? (
                      <tr>
                        <td
                          colSpan={5}
                          className="text-center py-12 text-base-content/40 text-sm"
                        >
                          No hay registros de medicaciones.
                        </td>
                      </tr>
                    ) : (
                      medicaciones.map((m) => (
                        <tr
                          key={m.id}
                          className={`hover:bg-base-200/50 ${m.estado === MedicacionEstado.Suspendida ? "opacity-60 bg-[#F8FAFC]" : ""}`}
                        >
                          <td className="pl-6">
                            <p className="text-sm font-semibold text-[#1e293b]">
                              {m.medicamentoNombre}
                            </p>
                            <p className="text-xs text-[#64748b] mt-0.5">
                              {m.doctorNombre}
                            </p>
                          </td>
                          <td className="text-sm text-[#475569] whitespace-nowrap">
                            {m.dosis} {m.unidadMedida}
                          </td>
                          <td>
                            <StatusBadge estado={m.estado} />
                          </td>
                          <td className="text-sm text-[#475569] whitespace-nowrap">
                            Cada {m.frecuenciaHoras}h
                          </td>
                          <td className="text-sm text-[#475569] whitespace-nowrap">
                            {formatDate(m.fechaInicio)}
                          </td>
                          <td className="pr-6">
                            <div className="flex justify-end">
                              <button
                                type="button"
                                className="btn btn-square btn-sm btn-ghost text-[#092168]"
                                title="Ver detalle"
                                onClick={() => handleView(m)}
                              >
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  strokeWidth="2"
                                  stroke="currentColor"
                                  className="size-4"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z"
                                  />
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
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
            </div>
          </>
        )}
      </div>

      <MedicationDetailModal
        open={detalleOpen}
        medicacion={selected}
        episodioId={episodioId}
        canAdminister={canAdminister}
        canChangeState={canChangeState}
        onClose={() => setDetalleOpen(false)}
        onUpdated={handleUpdated}
      />

      <NewMedicationModal
        open={canCreate ? nuevaOpen : false}
        episodioId={episodioId}
        onClose={() => setNuevaOpen(false)}
        onCreated={handleCreated}
      />
    </>
  );
}
