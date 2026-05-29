"use client";
import React, { useCallback, useEffect, useState } from "react";
import { toast } from "@/lib/toast";
import { getTasks } from "../../services/taskService";
import { getTaskAssignments } from "../../services/assignmentService";
import { getTaskTypes } from "../../services/taskTypesService";
import { getAreas } from "../../services/areasService";
import { FilterPanel, FilterLabel, filterInputCls } from "@/shared/ui/FilterPanel";
import { PaginationFooter } from "@/shared/ui/PaginationFooter";
import { TaskFormModal } from "./TaskFormModal";
import { TaskDetailModal } from "./TaskDetailModal";
import { CancelTaskModal } from "./CancelTaskModal";
import { AssignTaskModal } from "./AssignTaskModal";
import {
  TaskStatusBadge,
  PrioridadBadge,
  fmtDateTime,
} from "./taskHelpers";
import type {
  Tarea,
  AsignacionTarea,
  TipoTarea,
  Area,
  TareaFilters,
} from "../../types";
import { EstadoTarea, PrioridadTarea } from "../../types";

const PAGE_SIZE = 20;

const thCls =
  "text-xs font-semibold uppercase tracking-wide text-[#1A2B5E] bg-[#f8fafc] border-b border-[#e2e8f0] whitespace-nowrap text-left px-3.5 py-2.5";
const tdCls = "px-3.5 py-2.5 text-sm text-[#0f172a] border-b border-[#f1f5f9] align-middle";

const EMPTY_FILTERS: TareaFilters = {};

interface AssignTarget {
  tarea: Tarea;
  asignacion: AsignacionTarea | null;
  mode: "assign" | "reassign";
}

interface DetailTarget {
  tarea: Tarea;
  asignacion: AsignacionTarea | null;
}

function ActionBtn({
  title,
  color,
  hoverBg,
  onClick,
  loading,
  children,
}: {
  title: string;
  color: string;
  hoverBg: string;
  onClick: () => void;
  loading?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      disabled={loading}
      className={`inline-flex items-center justify-center w-7 h-7 rounded-md ${color} ${hoverBg} transition-colors disabled:opacity-50 cursor-pointer`}
    >
      {loading ? <span className="loading loading-spinner loading-xs" /> : children}
    </button>
  );
}

// Componente principal de la pestaña de tasks
export function TasksTab() {
  const [tasks, setTareas] = useState<Tarea[]>([]);
  const [asignacionMap, setAsignacionMap] = useState<Map<number, AsignacionTarea>>(new Map());
  const [tiposTarea, setTiposTarea] = useState<TipoTarea[]>([]);
  const [areas, setAreas] = useState<Area[]>([]);

  const [totalRegistros, setTotalRegistros] = useState(0);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [paginaActual, setPaginaActual] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [filters, setFilters] = useState<TareaFilters>(EMPTY_FILTERS);
  const [appliedFilters, setAppliedFilters] = useState<TareaFilters>(EMPTY_FILTERS);
  const [descSearch, setDescSearch] = useState("");

  const [formOpen, setFormOpen] = useState(false);
  const [detailTarget, setDetailTarget] = useState<DetailTarget | null>(null);
  const [cancelTarget, setCancelTarget] = useState<Tarea | null>(null);
  const [assignTarget, setAssignTarget] = useState<AssignTarget | null>(null);
  const [loadingReassignId, setLoadingReassignId] = useState<number | null>(null);

  const fetchAll = useCallback(async (page: number, f: TareaFilters) => {
    setLoading(true);
    setError(null);
    try {
      const tareasResult = await getTasks(page, PAGE_SIZE, f);
      setTareas(tareasResult.datos);
      setTotalRegistros(tareasResult.totalRegistros);
      setTotalPaginas(tareasResult.totalPaginas);
      setPaginaActual(tareasResult.paginaActual);

     
      const aMap = new Map<number, AsignacionTarea>();
      await Promise.allSettled(
        tareasResult.datos.map(async (tarea) => {
          try {
            const r = await getTaskAssignments(1, 1, tarea.id);
            if (r.datos[0]) aMap.set(tarea.id, r.datos[0]);
          } catch {  }
        }),
      );
      setAsignacionMap(aMap);
    } catch {
      setError("No se pudieron cargar las tasks. Intente nuevamente.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchAll(1, EMPTY_FILTERS);
    getTaskTypes(1, 200).then((r) => setTiposTarea(r.datos)).catch(() => setTiposTarea([]));
    getAreas().then(setAreas).catch(() => setAreas([]));
  }, [fetchAll]);

  function handleApplyFilters(e: React.FormEvent) {
    e.preventDefault();
    setAppliedFilters(filters);
    void fetchAll(1, filters);
  }

  function handleClearFilters() {
    setFilters(EMPTY_FILTERS);
    setAppliedFilters(EMPTY_FILTERS);
    setDescSearch("");
    void fetchAll(1, EMPTY_FILTERS);
  }

  function handlePageChange(page: number) {
    void fetchAll(page, appliedFilters);
  }

  function handleSuccess() {
    void fetchAll(paginaActual, appliedFilters);
  }

  async function openReassign(tarea: Tarea) {
    let asignacion = asignacionMap.get(tarea.id) ?? null;
    if (!asignacion) {
      setLoadingReassignId(tarea.id);
      try {
        const result = await getTaskAssignments(1, 1, tarea.id);
        asignacion = result.datos[0] ?? null;
      } catch {
        toast.error("No se pudo cargar la asignación.");
        setLoadingReassignId(null);
        return;
      }
      setLoadingReassignId(null);
    }
    setAssignTarget({ tarea, asignacion, mode: "reassign" });
  }

  const visibleTareas = descSearch.trim()
    ? tasks.filter((t) => t.descripcion.toLowerCase().includes(descSearch.toLowerCase()))
    : tasks;

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-[#1A2B5E]">Gestión de tasks</h2>
          <p className="text-xs text-slate-500">
            {totalRegistros} tarea{totalRegistros !== 1 ? "s" : ""} registrada{totalRegistros !== 1 ? "s" : ""}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setFormOpen(true)}
          className="btn btn-sm text-white border-none gap-1.5"
          style={{ background: "#09268E" }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Nueva tarea
        </button>
      </div>

      {/* Filters */}
      <FilterPanel onApply={handleApplyFilters} onClear={handleClearFilters}>
        <div className="flex flex-wrap gap-3.5 items-end">
          <div className="flex flex-col gap-1 flex-1 min-w-[160px]">
            <FilterLabel>Descripción</FilterLabel>
            <input
              type="text"
              className={filterInputCls}
              placeholder="Buscar por descripción..."
              value={descSearch}
              onChange={(e) => setDescSearch(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-1 flex-1 min-w-[150px]">
            <FilterLabel>Tipo de tarea</FilterLabel>
            <select
              className={filterInputCls + " cursor-pointer"}
              value={filters.tipoTareaId ?? ""}
              onChange={(e) =>
                setFilters((f) => ({
                  ...f,
                  tipoTareaId: e.target.value ? Number(e.target.value) : undefined,
                }))
              }
            >
              <option value="">Todos los tipos</option>
              {tiposTarea.map((t) => (
                <option key={t.id} value={t.id}>{t.nombre}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1 flex-1 min-w-[130px]">
            <FilterLabel>Estado</FilterLabel>
            <select
              className={filterInputCls + " cursor-pointer"}
              value={filters.estado ?? ""}
              onChange={(e) =>
                setFilters((f) => ({
                  ...f,
                  estado: e.target.value !== "" ? (Number(e.target.value) as EstadoTarea) : undefined,
                }))
              }
            >
              <option value="">Todos</option>
              <option value={EstadoTarea.Pendiente}>Pendiente</option>
              <option value={EstadoTarea.Asignada}>Asignada</option>
              <option value={EstadoTarea.Completada}>Completada</option>
              <option value={EstadoTarea.Cancelada}>Cancelada</option>
            </select>
          </div>

          <div className="flex flex-col gap-1 flex-1 min-w-[120px]">
            <FilterLabel>Prioridad</FilterLabel>
            <select
              className={filterInputCls + " cursor-pointer"}
              value={filters.prioridad ?? ""}
              onChange={(e) =>
                setFilters((f) => ({
                  ...f,
                  prioridad: e.target.value !== "" ? (Number(e.target.value) as PrioridadTarea) : undefined,
                }))
              }
            >
              <option value="">Todas</option>
              <option value={PrioridadTarea.Alta}>Alta</option>
              <option value={PrioridadTarea.Media}>Media</option>
              <option value={PrioridadTarea.Baja}>Baja</option>
            </select>
          </div>

          <div className="flex flex-col gap-1 flex-1 min-w-[140px]">
            <FilterLabel>Área</FilterLabel>
            <select
              className={filterInputCls + " cursor-pointer"}
              value={filters.areaId ?? ""}
              onChange={(e) =>
                setFilters((f) => ({
                  ...f,
                  areaId: e.target.value ? Number(e.target.value) : undefined,
                }))
              }
            >
              <option value="">Todas las áreas</option>
              {areas.map((a) => (
                <option key={a.id} value={a.id}>{a.nombre}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1 flex-1 min-w-[110px]">
            <FilterLabel>ID Episodio</FilterLabel>
            <input
              type="number"
              className={filterInputCls}
              placeholder="Ej. 1042"
              value={filters.episodioId ?? ""}
              onChange={(e) =>
                setFilters((f) => ({
                  ...f,
                  episodioId: e.target.value ? Number(e.target.value) : undefined,
                }))
              }
            />
          </div>

        </div>
      </FilterPanel>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-[#E2E8F0] overflow-hidden">
        {error && (
          <div role="alert" className="alert alert-error m-4 text-sm py-3">
            <span>{error}</span>
            <button
              className="btn btn-xs btn-ghost"
              onClick={() => void fetchAll(paginaActual, appliedFilters)}
            >
              Reintentar
            </button>
          </div>
        )}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className={thCls}>Tipo</th>
                <th className={thCls + " max-w-[220px]"}>Descripción</th>
                <th className={thCls}>Área</th>
                <th className={thCls}>Prioridad</th>
                <th className={thCls}>Estado</th>
                <th className={thCls}>Responsable</th>
                <th className={thCls}>Creado</th>
                <th className={thCls + " text-right"}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} className="text-center py-12">
                    <span className="loading loading-spinner loading-md text-[#09268E]" />
                  </td>
                </tr>
              ) : visibleTareas.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-slate-400 text-sm">
                    No se encontraron tasks.
                  </td>
                </tr>
              ) : (
                visibleTareas.map((tarea) => {
                  const asignacion = asignacionMap.get(tarea.id) ?? null;
                  const isPendienteNoAsignada =
                    tarea.estado === EstadoTarea.Pendiente && !asignacion;
                  const isAsignada = tarea.estado === EstadoTarea.Asignada;
                  const canCancel =
                    tarea.estado !== EstadoTarea.Cancelada &&
                    tarea.estado !== EstadoTarea.Completada;

                  return (
                    <tr key={tarea.id} className="bg-white hover:bg-[#f8fafc] transition-colors">
                      <td className={tdCls}>
                        <span className="font-medium text-[#1A2B5E]">{tarea.nombreTipoTarea}</span>
                      </td>
                      <td className={tdCls + " max-w-[220px]"}>
                        <span className="text-slate-600 line-clamp-2 text-xs leading-relaxed">
                          {tarea.descripcion}
                        </span>
                      </td>
                      <td className={tdCls}>
                        <span className="">{tarea.nombreArea}</span>
                      </td>
                      <td className={tdCls}>
                        <PrioridadBadge prioridad={tarea.prioridad} />
                      </td>
                      <td className={tdCls}>
                        <TaskStatusBadge estado={tarea.estado} showDot={false} />
                      </td>
                      <td className={tdCls}>
                        {asignacion ? (
                          <span className="">{asignacion.nombreUsuario}</span>
                        ) : (
                          <span className="text-slate-300 text-xs">Sin asignar</span>
                        )}
                      </td>
                      <td className={tdCls}>
                        <span className=" text-sm">{fmtDateTime(tarea.fechaCreacion)}</span>
                      </td>
                      <td className={tdCls + " text-right"}>
                        <div className="flex items-center justify-end gap-0.5">
                          {/* Ver detalle */}
                          <ActionBtn
                            title="Ver detalle"
                            color="text-[#09268E]"
                            hoverBg="hover:bg-[#eff6ff]"
                            onClick={() => setDetailTarget({ tarea, asignacion })}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="size-4">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                            </svg>
                          </ActionBtn>

                          {/* Asignar (Pendiente sin responsable) */}
                          {isPendienteNoAsignada && (
                            <ActionBtn
                              title="Asignar responsable"
                              color="text-[#09268E]"
                              hoverBg="hover:bg-blue-50"
                              onClick={() => setAssignTarget({ tarea, asignacion: null, mode: "assign" })}
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="size-4">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M18 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0ZM3 19.235v-.11a6.375 6.375 0 0 1 12.75 0v.109A12.318 12.318 0 0 1 9.374 21c-2.331 0-4.512-.645-6.374-1.766Z" />
                              </svg>
                            </ActionBtn>
                          )}

                          {/* Reasignar (Asignada) */}
                          {isAsignada && (
                            <ActionBtn
                              title="Reasignar responsable"
                              color="text-amber-600"
                              hoverBg="hover:bg-amber-50"
                              loading={loadingReassignId === tarea.id}
                              onClick={() => void openReassign(tarea)}
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="size-4">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21 3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
                              </svg>
                            </ActionBtn>
                          )}

                          {/* Cancelar */}
                          {canCancel && (
                            <ActionBtn
                              title="Cancelar tarea"
                              color="text-red-500"
                              hoverBg="hover:bg-red-50"
                              onClick={() => setCancelTarget(tarea)}
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="size-4">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 0 0 5.636 5.636m12.728 12.728A9 9 0 0 1 5.636 5.636m12.728 12.728L5.636 5.636" />
                              </svg>
                            </ActionBtn>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        <PaginationFooter
          current={paginaActual}
          total={totalPaginas}
          totalRecords={totalRegistros}
          showing={visibleTareas.length}
          onPageChange={handlePageChange}
        />
      </div>

      {/* Modals */}
      <TaskFormModal
        open={formOpen}
        tiposTarea={tiposTarea}
        areas={areas}
        onClose={() => setFormOpen(false)}
        onSuccess={handleSuccess}
      />

      <TaskDetailModal
        open={!!detailTarget}
        tarea={detailTarget?.tarea ?? null}
        asignacion={detailTarget?.asignacion ?? null}
        onClose={() => setDetailTarget(null)}
      />

      <CancelTaskModal
        open={cancelTarget !== null}
        tarea={cancelTarget}
        onClose={() => setCancelTarget(null)}
        onSuccess={handleSuccess}
      />

      <AssignTaskModal
        open={!!assignTarget}
        tarea={assignTarget?.tarea ?? null}
        asignacion={assignTarget?.asignacion ?? null}
        mode={assignTarget?.mode ?? "assign"}
        onClose={() => setAssignTarget(null)}
        onSuccess={handleSuccess}
      />
    </div>
  );
}
