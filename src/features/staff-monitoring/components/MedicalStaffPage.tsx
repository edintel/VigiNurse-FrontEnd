"use client";
import React, { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { getMedicalStaff } from "@/features/staff-monitoring/services/medicalStaffService";
import { getSpecialties } from "@/features/administration/users/services/userManagementService";
import { SearchableSelect } from "@/shared/ui/SearchableSelect";
import { FilterPanel, FilterLabel, filterInputCls } from "@/shared/ui/FilterPanel";
import { PaginationFooter } from "@/shared/ui/PaginationFooter";
import { ROLES } from "@/constants/roles";
import type { PersonalMedico, PersonalFilters, CargaTrabajo } from "@/features/staff-monitoring/types";
import { EstadoDisponibilidadPersonal, NivelCarga } from "@/features/staff-monitoring/types";
import { getUserWorkload } from "@/features/staff-monitoring/services/workloadService";
import { DisponibilidadBadge, WorkloadLevelBadge } from "./tasks/taskHelpers";
import ShiftManagementPage from "./ShiftManagementPage";
import TaskManagementPage from "./TaskManagementPage";
import EditStaffAreaModal from "./EditStaffAreaModal";

interface Specialty { id: number; nombre: string; }

type SortKey = "nombre" | "cedula" | "email" | "rol" | "nombreEspecialidad" | "nombreArea";
type SortDir = "asc" | "desc";
type MainTab = "personal" | "turnos" | "tasks";

const PAGE_SIZE = 20;
const EMPTY_FILTERS: PersonalFilters = {
  nombre: "", apellidos: "", cedula: "", email: "", especialidadId: undefined, rol: "",
};

function SortIcon({ active, dir }: { active: boolean; dir: SortDir }) {
  return (
    <span className="ml-1 text-[10px]" style={{ opacity: active ? 1 : 0.3 }}>
      {active && dir === "desc" ? "↓" : "↑"}
    </span>
  );
}

// Pestaña de Personal Médico: lista, filtros, ordenamiento, acciones básicas (ver detalle, editar área), 
// carga de trabajo y disponibilidad
function PersonalTab() {
  const router = useRouter();
  const [personal, setPersonal] = useState<PersonalMedico[]>([]);
  const [totalRegistros, setTotalRegistros] = useState(0);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [paginaActual, setPaginaActual] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editTarget, setEditTarget] = useState<PersonalMedico | null>(null);
  const [cargaMap, setCargaMap] = useState<Map<number, CargaTrabajo>>(new Map());

  const [filters, setFilters] = useState<PersonalFilters>(EMPTY_FILTERS);
  const [appliedFilters, setAppliedFilters] = useState<PersonalFilters>(EMPTY_FILTERS);
  const [sortKey, setSortKey] = useState<SortKey>("nombre");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  const [specialties, setEspecialidades] = useState<Specialty[]>([]);
  const [especialidadSearch, setEspecialidadSearch] = useState("");
  const [especialidadSelectedId, setEspecialidadSelectedId] = useState<number | null>(null);
  const [especialidadShowDropdown, setEspecialidadShowDropdown] = useState(false);

  const fetchPersonal = useCallback(async (page: number, f: PersonalFilters) => {
    setLoading(true);
    setError(null);
    try {
      const result = await getMedicalStaff(page, PAGE_SIZE, f);
      setPersonal(result.datos);
      setTotalRegistros(result.totalRegistros);
      setTotalPaginas(result.totalPaginas);
      setPaginaActual(result.paginaActual);

     
      const cMap = new Map<number, CargaTrabajo>();
      await Promise.allSettled(
        result.datos.map(async (p) => {
          try {
            const c = await getUserWorkload(p.id);
            cMap.set(p.id, c);
          } catch (err) {
            const status = (err as { response?: { status?: number } }).response?.status;
            if (status === 404) {
              cMap.set(p.id, {
                id: 0, usuarioId: p.id, nombreUsuario: "",
                hospitalId: 0, nombreHospital: "",
                totalTareasActivas: 0,
                nivelCarga: NivelCarga.Libre,
                nivelCargaDescripcion: "Libre",
                ultimaActualizacion: "",
              });
            }
          }
        }),
      );
      setCargaMap(cMap);
    } catch {
      setError("No se pudo cargar el personal médico. Intente nuevamente.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchPersonal(1, EMPTY_FILTERS);
    getSpecialties().then((data) => setEspecialidades(data)).catch(() => setEspecialidades([]));
  }, [fetchPersonal]);

  function handleApplyFilters(e: React.FormEvent) {
    e.preventDefault();
    setAppliedFilters(filters);
    void fetchPersonal(1, filters);
  }

  function handleClearFilters() {
    setFilters(EMPTY_FILTERS);
    setAppliedFilters(EMPTY_FILTERS);
    setEspecialidadSearch("");
    setEspecialidadSelectedId(null);
    void fetchPersonal(1, EMPTY_FILTERS);
  }

  function handlePageChange(page: number) { void fetchPersonal(page, appliedFilters); }

  function handleSort(key: SortKey) {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(key); setSortDir("asc"); }
  }

  const filteredEspecialidades = specialties
    .filter((e) => e.nombre.toLowerCase().includes(especialidadSearch.toLowerCase()))
    .map((e) => ({ id: e.id, label: e.nombre }));

  const sortedPersonal = [...personal].sort((a, b) => {
    let va = ""; let vb = "";
    switch (sortKey) {
      case "nombre": va = `${a.nombre} ${a.apellidos}`; vb = `${b.nombre} ${b.apellidos}`; break;
      case "rol": va = a.roles[0] ?? ""; vb = b.roles[0] ?? ""; break;
      case "nombreEspecialidad": va = a.nombreEspecialidad ?? ""; vb = b.nombreEspecialidad ?? ""; break;
      case "nombreArea": va = a.nombreArea ?? ""; vb = b.nombreArea ?? ""; break;
      default: va = String(a[sortKey as keyof PersonalMedico] ?? ""); vb = String(b[sortKey as keyof PersonalMedico] ?? "");
    }
    const cmp = va.toLowerCase().localeCompare(vb.toLowerCase());
    return sortDir === "asc" ? cmp : -cmp;
  });

  const thCls = "text-xs font-semibold uppercase tracking-wide text-[#1A2B5E] bg-[#f8fafc] border-b border-[#e2e8f0] whitespace-nowrap cursor-pointer select-none text-left px-3.5 py-2.5";
  const tdCls = "px-3.5 py-2.5 text-sm text-[#0f172a] border-b border-[#f1f5f9] align-middle";

  return (
    <div className="flex flex-col gap-4">
      {/* Filters */}
      <FilterPanel onApply={handleApplyFilters} onClear={handleClearFilters}>
        <div className="flex flex-wrap gap-3.5 items-end">
          <div className="flex flex-col gap-1 flex-1 min-w-[140px]">
            <FilterLabel>Nombre</FilterLabel>
            <input type="text" className={filterInputCls} placeholder="Buscar por nombre..." value={filters.nombre ?? ""} onChange={(e) => setFilters((f) => ({ ...f, nombre: e.target.value }))} />
          </div>
          <div className="flex flex-col gap-1 flex-1 min-w-[140px]">
            <FilterLabel>Apellidos</FilterLabel>
            <input type="text" className={filterInputCls} placeholder="Buscar por apellidos..." value={filters.apellidos ?? ""} onChange={(e) => setFilters((f) => ({ ...f, apellidos: e.target.value }))} />
          </div>
          <div className="flex flex-col gap-1 flex-1 min-w-[140px]">
            <FilterLabel>Cédula</FilterLabel>
            <input type="text" className={filterInputCls} placeholder="Buscar por cédula..." value={filters.cedula ?? ""} onChange={(e) => setFilters((f) => ({ ...f, cedula: e.target.value }))} />
          </div>
          <div className="flex flex-col gap-1 flex-1 min-w-[140px]">
            <FilterLabel>Correo electrónico</FilterLabel>
            <input type="text" className={filterInputCls} placeholder="Buscar por email..." value={filters.email ?? ""} onChange={(e) => setFilters((f) => ({ ...f, email: e.target.value }))} />
          </div>
          <div className="flex flex-col gap-1 flex-1 min-w-[160px]">
            <FilterLabel>Cargo</FilterLabel>
            <select className={filterInputCls + " cursor-pointer"} value={filters.rol ?? ""} onChange={(e) => setFilters((f) => ({ ...f, rol: e.target.value || "" }))}>
              <option value="">Todos los cargos</option>
              {(Object.entries(ROLES) as [string, string][]).map(([key, label]) => (
                <option key={key} value={label}>{label}</option>
              ))}
            </select>
          </div>
          <div className="flex-1 min-w-[160px]">
            <SearchableSelect
              id="filter-especialidad"
              label="Especialidad"
              variant="filter"
              options={filteredEspecialidades}
              selectedId={especialidadSelectedId}
              searchValue={especialidadSearch}
              onSearchChange={(e) => { setEspecialidadSearch(e.target.value); setEspecialidadSelectedId(null); setFilters((f) => ({ ...f, especialidadId: undefined })); }}
              onSelect={(opt) => { setEspecialidadSelectedId(opt.id); setEspecialidadSearch(opt.label); setFilters((f) => ({ ...f, especialidadId: opt.id })); setEspecialidadShowDropdown(false); }}
              showDropdown={especialidadShowDropdown}
              onFocus={() => setEspecialidadShowDropdown(true)}
              onBlur={() => setEspecialidadShowDropdown(false)}
              placeholder="Todas las especialidades"
              onClear={() => { setEspecialidadSelectedId(null); setEspecialidadSearch(""); setFilters((f) => ({ ...f, especialidadId: undefined })); }}
            />
          </div>
        </div>
      </FilterPanel>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-[#E2E8F0] overflow-hidden">
        {error && (
          <div role="alert" className="alert alert-error m-4 text-sm py-3">
            <span>{error}</span>
            <button className="btn btn-xs btn-ghost" onClick={() => void fetchPersonal(paginaActual, appliedFilters)}>Reintentar</button>
          </div>
        )}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                {([
                  ["nombre",           "Nombre"],
                  ["rol",              "Cargo"],
                  ["nombreEspecialidad","Especialidad"],
                  ["nombreArea",       "Área"],
                  [null,               "Disponibilidad"],
                  [null,               "Carga"],
                  [null,               "Tareas activas"],
                ] as [SortKey | null, string][]).map(([key, label]) => (
                  <th key={label} className={thCls} onClick={key ? () => handleSort(key) : undefined} style={{ cursor: key ? "pointer" : "default" }}>
                    {label}{key && <SortIcon active={sortKey === key} dir={sortDir} />}
                  </th>
                ))}
                <th className={thCls + " text-right"}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} className="text-center py-12"><span className="loading loading-spinner loading-md text-[#09268E]" /></td></tr>
              ) : sortedPersonal.length === 0 ? (
                <tr><td colSpan={8} className="text-center py-12 text-slate-400 text-sm">No se encontró personal médico.</td></tr>
              ) : (
                sortedPersonal.map((p) => (
                  <tr key={p.id} className="bg-white hover:bg-[#f8fafc] transition-colors">
                    <td className={tdCls}>
                      <div className="flex flex-col gap-0.5">
                        <span className="font-semibold">{p.nombre} {p.apellidos}</span>
                        <span className="font-mono text-xs text-slate-400">{p.cedula || "—"}</span>
                      </div>
                    </td>
                    <td className={tdCls}>{p.roles.length > 0 ? p.roles[0] : <span className="text-slate-300">—</span>}</td>
                    <td className={tdCls}>{p.nombreEspecialidad ?? <span className="text-slate-300">—</span>}</td>
                    <td className={tdCls}>{p.nombreArea ?? <span className="text-slate-300">—</span>}</td>
                    <td className={tdCls}>
                      {p.estado == null ? (
                        <span className="text-slate-300">—</span>
                      ) : (
                        <DisponibilidadBadge
                          estado={p.estado}
                          descripcion={
                            p.estado === EstadoDisponibilidadPersonal.Disponible ? "Disponible"
                            : p.estado === EstadoDisponibilidadPersonal.Ocupado ? "Ocupado"
                            : p.estado === EstadoDisponibilidadPersonal.FueraDeServicio ? "Fuera de servicio"
                            : "En break"
                          }
                        />
                      )}
                    </td>
                    <td className={tdCls + " min-w-[110px]"}>
                      {cargaMap.has(p.id) ? (
                        <WorkloadLevelBadge
                          nivel={cargaMap.get(p.id)!.nivelCarga}
                          descripcion={cargaMap.get(p.id)!.nivelCargaDescripcion}
                        />
                      ) : (
                        <span className="text-slate-300 text-sm">—</span>
                      )}
                    </td>
                    <td className={tdCls}>
                      {cargaMap.has(p.id) ? (
                        <span className="text-sm font-semibold text-[#1A2B5E]">
                          {cargaMap.get(p.id)!.totalTareasActivas}
                        </span>
                      ) : (
                        <span className="text-slate-300 text-sm">—</span>
                      )}
                    </td>
                    <td className={tdCls + " text-right"}>
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          title="Ver detalle"
                          className="inline-flex items-center justify-center w-7 h-7 rounded-md text-[#09268E] hover:bg-[#eff6ff] transition-colors cursor-pointer"
                          onClick={() => router.push(`/staff-monitoring/${p.id}`)}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="size-4">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                          </svg>
                        </button>
                        <button
                          type="button"
                          title="Editar área"
                          className="inline-flex items-center justify-center w-7 h-7 rounded-md text-slate-500 hover:bg-slate-100 transition-colors"
                          onClick={() => setEditTarget(p)}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="size-4">
                            <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125" />
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
        <PaginationFooter current={paginaActual} total={totalPaginas} totalRecords={totalRegistros} showing={sortedPersonal.length} onPageChange={handlePageChange} />
      </div>

      <EditStaffAreaModal
        open={editTarget !== null}
        personal={editTarget}
        onClose={() => setEditTarget(null)}
        onSuccess={() => { setEditTarget(null); void fetchPersonal(paginaActual, appliedFilters); }}
      />
    </div>
  );
}

// Página principal de Monitores de Personal: tabs para Personal Médico, Gestión de Turnos y Gestión de Tareas
export default function MedicalStaffPage() {
  const [mainTab, setMainTab] = useState<MainTab>("personal");

  const MAIN_TABS: { key: MainTab; label: string }[] = [
    { key: "personal", label: "Personal médico" },
    { key: "turnos", label: "Gestión de turnos" },
    { key: "tasks", label: "Gestión de tasks" },
  ];

  return (
    <div className="py-6 px-8 xl:px-12 flex flex-col gap-5">
      {/* Header */}
      <div className="pb-1">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-[#1A2B5E] flex items-center justify-center flex-shrink-0">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
              <polyline points="16 11 18 13 22 9" />
            </svg>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[#1A2B5E] leading-tight">Gestión de Personal médico</h1>
            
          </div>
        </div>
      </div>

      {/* Main tabs */}
      <div className="flex border-b border-[#e2e8f0] gap-0">
        {MAIN_TABS.map(({ key, label }) => (
          <button
            key={key}
            type="button"
            onClick={() => setMainTab(key)}
            className={`px-5 py-2.5 text-sm font-semibold border-b-2 transition -mb-px ${
              mainTab === key
                ? "border-[#09268E] text-[#09268E]"
                : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Content */}
      {mainTab === "personal" && <PersonalTab />}
      {mainTab === "turnos" && <ShiftManagementPage />}
      {mainTab === "tasks" && <TaskManagementPage />}
    </div>
  );
}
