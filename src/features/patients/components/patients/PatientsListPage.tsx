"use client";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getPatients } from "@/features/patients/services/patientService";
import { CreatePatientModal } from "@/features/patients/components/patients/CreatePatientModal";
import { CreateContactModal } from "@/features/patients/components/patients/CreateContactModal";
import {
  FilterPanel,
  FilterLabel,
  filterInputCls,
} from "@/shared/ui/FilterPanel";
import { PaginationFooter } from "@/shared/ui/PaginationFooter";
import { Sexo, SEXO_LABELS } from "@/features/patients/types";
import type {
  Paciente,
  PacienteFilters,
  PaginatedPacientes,
} from "@/features/patients/types";

const PAGE_SIZE = 10;

// Formatea una fecha ISO a DD/MM/AAAA.
function formatDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

// Badge de sexo del paciente.
function SexoBadge({ sexo }: { sexo: Sexo }) {
  if (sexo === Sexo.Masculino) {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold uppercase border bg-blue-50 border-blue-200 text-blue-500">
        {SEXO_LABELS[Sexo.Masculino]}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold uppercase border bg-pink-50 border-pink-200 text-pink-500">
      {SEXO_LABELS[Sexo.Femenino]}
    </span>
  );
}

// Pestaña de registro de pacientes con tabla, filtros y paginación.
export default function PatientsListPage() {
  const router = useRouter();

  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [totalRegistros, setTotalRegistros] = useState(0);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [paginaActual, setPaginaActual] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filtros aplicados (se usan al cambiar de página)
  const [appliedFilters, setAppliedFilters] = useState<PacienteFilters>({});

  // Filtros en el panel (estado visual)
  const [filterNombre, setFilterNombre] = useState("");
  const [filterCedula, setFilterCedula] = useState("");

  // Modales
  const [showCreate, setShowCreate] = useState(false);
  const [contactoPacienteId, setContactoPacienteId] = useState<number | null>(null);

  const fetchPatients = useCallback(
    async (page: number, filters: PacienteFilters) => {
      setLoading(true);
      setError(null);
      try {
        const result: PaginatedPacientes = await getPatients(
          page,
          PAGE_SIZE,
          filters,
        );
        setPacientes(result.datos);
        setTotalRegistros(result.totalRegistros);
        setTotalPaginas(result.totalPaginas);
        setPaginaActual(result.paginaActual);
      } catch {
        setError("No se pudieron cargar los pacientes. Intente nuevamente.");
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    void fetchPatients(1, {});
  }, [fetchPatients]);

  function handleApplyFilters(e: React.FormEvent) {
    e.preventDefault();
    const filters: PacienteFilters = {};
    if (filterNombre.trim()) filters.nombre = filterNombre.trim();
    if (filterCedula.trim()) filters.cedula = filterCedula.trim();
    setAppliedFilters(filters);
    void fetchPatients(1, filters);
  }

  function handleClearFilters() {
    setFilterNombre("");
    setFilterCedula("");
    setAppliedFilters({});
    void fetchPatients(1, {});
  }

  function handlePageChange(page: number) {
    void fetchPatients(page, appliedFilters);
  }

  function handlePacienteCreated(paciente: Paciente) {
    setPacientes((prev) => [paciente, ...prev]);
    setTotalRegistros((n) => n + 1);
  }

  return (
    <div className="space-y-4">
      {/* Botón de acción */}
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
          Registrar paciente
        </button>
      </div>

      {/* Panel de filtros */}
      <FilterPanel onApply={handleApplyFilters} onClear={handleClearFilters}>
        <div className="flex flex-wrap gap-4 items-end">
          <div className="flex flex-col gap-1 flex-1 min-w-[180px]">
            <FilterLabel>Nombre del paciente</FilterLabel>
            <input
              type="text"
              className={filterInputCls}
              placeholder="Buscar por nombre..."
              value={filterNombre}
              onChange={(e) => setFilterNombre(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1 flex-1 min-w-[180px]">
            <FilterLabel>Identificación (Cédula)</FilterLabel>
            <input
              type="text"
              className={filterInputCls}
              placeholder="Buscar por cédula..."
              value={filterCedula}
              onChange={(e) => setFilterCedula(e.target.value)}
            />
          </div>
        </div>
      </FilterPanel>

      {/* Tabla */}
      <div className="bg-white rounded-xl shadow-sm border border-[#E2E8F0] overflow-hidden">
        {error && (
          <div role="alert" className="alert alert-error m-4 text-sm py-3">
            <span>{error}</span>
            <button
              className="btn btn-xs btn-ghost"
              onClick={() => void fetchPatients(paginaActual, appliedFilters)}
            >
              Reintentar
            </button>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="table table-zebra w-full [&_td]:py-2.5 [&_th]:py-2.5">
            <thead>
              <tr className="bg-[#F8FAFC] text-[#1A2B5E]">
                <th className="text-xs font-semibold uppercase tracking-wide">
                  Nombre del paciente
                </th>
                <th className="text-xs font-semibold uppercase tracking-wide">
                  Identificación
                </th>
                <th className="text-xs font-semibold uppercase tracking-wide">
                  Fecha de nacimiento
                </th>
                <th className="text-xs font-semibold uppercase tracking-wide">
                  Sexo
                </th>
                <th className="text-xs font-semibold uppercase tracking-wide text-right">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="text-center py-12">
                    <span className="loading loading-spinner loading-md text-[#09268E]" />
                  </td>
                </tr>
              ) : !error && pacientes.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="text-center py-12 text-base-content/40 text-sm"
                  >
                    No se encontraron pacientes.
                  </td>
                </tr>
              ) : (
                pacientes.map((paciente) => (
                  <tr key={paciente.id} className="hover:bg-base-200">
                    <td>
                      <div className="flex flex-col">
                        <span className="font-semibold text-sm text-[#0f172a]">
                          {paciente.apellidos}, {paciente.nombre}
                        </span>
                        {!paciente.activo && (
                          <span className="text-[10px] text-red-400 font-medium">
                            Inactivo
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="text-sm text-[#475569] font-mono">
                      {paciente.cedula}
                    </td>
                    <td className="text-sm text-[#475569]">
                      {formatDate(paciente.fechaNacimiento)}
                    </td>
                    <td>
                      <SexoBadge sexo={paciente.sexo} />
                    </td>
                    <td>
                      <div className="flex items-center justify-end">
                        <button
                          type="button"
                          className="btn btn-square btn-sm btn-ghost text-[#09268E]"
                          title="Ver ficha del paciente"
                          onClick={() => router.push(`/patients/${paciente.id}`)}
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

        <PaginationFooter
          current={paginaActual}
          total={totalPaginas}
          totalRecords={totalRegistros}
          showing={pacientes.length}
          onPageChange={handlePageChange}
        />
      </div>

      <CreatePatientModal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        onCreated={handlePacienteCreated}
        onContactRequested={(id) => setContactoPacienteId(id)}
      />
      <CreateContactModal
        open={contactoPacienteId !== null}
        pacienteId={contactoPacienteId ?? 0}
        onClose={() => setContactoPacienteId(null)}
      />
    </div>
  );
}
