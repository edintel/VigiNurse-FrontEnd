"use client";
import { useCallback, useEffect, useState } from "react";
import { toast } from "@/lib/toast";
import { getAreas } from "@/features/administration/areas/services/areaService";
import { CreateAreaModal } from "@/features/administration/areas/components/CreateAreaModal";
import { EditAreaModal } from "@/features/administration/areas/components/EditAreaModal";
import { DeleteAreaModal } from "@/features/administration/areas/components/DeleteAreaModal";
import {
  getGatewayAreaAssignments,
  unassignGatewayArea,
} from "@/features/administration/areasAndZones/services/assignmentService";
import { GatewaysModal } from "@/features/administration/areasAndZones/components/GatewaysModal";
import type { Area, AsignacionGatewayAreaDto } from "@/features/administration/areasAndZones/types";
import { PaginationFooter } from "@/shared/ui/PaginationFooter";
import { FilterPanel, FilterLabel, filterInputCls } from "@/shared/ui/FilterPanel";

const PAGE_SIZE = 10;

// Iconos

function IconPlus({ className = "size-4" }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
    </svg>
  );
}

function IconEdit({ className = "size-4" }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Z" />
    </svg>
  );
}

function IconTrash({ className = "size-4" }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
    </svg>
  );
}

// Componente principal para gestión de áreas y sus gateways asociados

export default function AreasWithGatewaysTab() {
  const [areas, setAreas] = useState<Area[]>([]);
  const [totalRegistros, setTotalRegistros] = useState(0);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [paginaActual, setPaginaActual] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [filterNombre, setFilterNombre] = useState("");
  const [appliedNombre, setAppliedNombre] = useState<string | undefined>(undefined);

  const [assignments, setAsignaciones] = useState<AsignacionGatewayAreaDto[]>([]);
  const [asignacionesLoading, setAsignacionesLoading] = useState(false);
  const [desasignando, setDesasignando] = useState<number | null>(null);

  const [showCreate, setShowCreate] = useState(false);
  const [editArea, setEditArea] = useState<Area | null>(null);
  const [deleteArea, setDeleteArea] = useState<Area | null>(null);
  const [gatewaysTarget, setGatewaysTarget] = useState<Area | null>(null);

  const loadAreas = useCallback(async (page: number, nombre?: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await getAreas(page, PAGE_SIZE, nombre);
      setAreas(res.datos);
      setTotalRegistros(res.totalRegistros);
      setTotalPaginas(res.totalPaginas);
      setPaginaActual(res.paginaActual);
    } catch {
      setError("No se pudieron cargar las áreas.");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadAsignaciones = useCallback(async () => {
    setAsignacionesLoading(true);
    try {
      setAsignaciones(await getGatewayAreaAssignments(true));
    } catch {
      setAsignaciones([]);
    } finally {
      setAsignacionesLoading(false);
    }
  }, []);

  useEffect(() => { void loadAreas(1); void loadAsignaciones(); }, [loadAreas, loadAsignaciones]);

  function handleApplyFilters(e: React.FormEvent) {
    e.preventDefault();
    const nombre = filterNombre.trim() || undefined;
    setAppliedNombre(nombre);
    void loadAreas(1, nombre);
  }

  function handleClearFilters() {
    setFilterNombre("");
    setAppliedNombre(undefined);
    void loadAreas(1);
  }

  async function handleUnassign(id: number) {
    const asig = assignments.find((a) => a.id === id);
    setDesasignando(id);
    try {
      await unassignGatewayArea(id);
      toast.success(asig ? `Gateway "${asig.gatewayNombre}" desasignado.` : "Gateway desasignado.");
      void loadAsignaciones();
    } catch (err: unknown) {
      const data = (err as { response?: { data?: { mensaje?: string } } })?.response?.data;
      toast.error(data?.mensaje ?? "No se pudo desasignar el gateway.");
    } finally {
      setDesasignando(null);
    }
  }

  function getAssignmentsForArea(areaId: number): AsignacionGatewayAreaDto[] {
    return assignments.filter((a) => a.areaId === areaId);
  }

  const gatewaysTargetAsigs = gatewaysTarget
    ? getAssignmentsForArea(gatewaysTarget.id)
    : [];

  return (
    <div className="space-y-5">
      {/* Encabezado */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-lg font-bold text-[#0f172a]">Áreas del hospital</h2>
          <p className="text-xs text-slate-400 mt-0.5">Administra las áreas y sus gateways BLE asociados</p>
        </div>
        <button
          type="button"
          className="btn btn-sm text-white"
          style={{ backgroundColor: "#09268E", borderColor: "#09268E" }}
          onClick={() => setShowCreate(true)}
        >
          <IconPlus className="size-3.5" />
          Nueva área
        </button>
      </div>

      {/* Filtros */}
      <FilterPanel onApply={handleApplyFilters} onClear={handleClearFilters}>
        <div className="flex flex-wrap gap-4 items-end">
          <div className="flex flex-col gap-1 w-52">
            <FilterLabel>Nombre</FilterLabel>
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

      {error && (
        <div role="alert" className="alert alert-error text-sm py-3">
          <span>{error}</span>
          <button className="btn btn-xs btn-ghost" onClick={() => void loadAreas(paginaActual, appliedNombre)}>Reintentar</button>
        </div>
      )}

      {/* Tabla */}
      <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Áreas</span>
          {!loading && <span className="badge badge-ghost badge-sm font-bold">{totalRegistros}</span>}
        </div>

        <div className="overflow-x-auto">
          <table className="table table-sm w-full">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/60">
                <th className="text-[10px] font-bold uppercase tracking-widest text-slate-400 py-3 pl-5">Nombre</th>
                <th className="text-[10px] font-bold uppercase tracking-widest text-slate-400 py-3">Hospital</th>
                <th className="text-[10px] font-bold uppercase tracking-widest text-slate-400 py-3 text-center">Gateways</th>
                <th className="text-[10px] font-bold uppercase tracking-widest text-slate-400 py-3 pr-5 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={4} className="text-center py-16">
                  <span className="loading loading-spinner loading-md text-[#09268E]" />
                </td></tr>
              ) : areas.length === 0 ? (
                <tr><td colSpan={4} className="text-center py-16">
                  <div className="flex flex-col items-center gap-2 text-slate-400">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-8 opacity-40">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" />
                    </svg>
                    <span className="text-sm">No se encontraron áreas</span>
                  </div>
                </td></tr>
              ) : (
                areas.map((area) => {
                  const asigs = getAssignmentsForArea(area.id);
                  return (
                    <tr key={area.id} className="border-b border-slate-100/70 hover:bg-slate-50/80 transition-colors duration-150">
                      <td className="py-3 pl-5">
                        <span className="font-semibold text-[#1A2B5E] text-sm">{area.nombre}</span>
                      </td>
                      <td className="py-3">
                        <span className="text-sm text-slate-500">{area.hospitalNombre}</span>
                      </td>
                      <td className="py-3 text-center">
                        {asignacionesLoading ? (
                          <span className="loading loading-dots loading-xs text-slate-300" />
                        ) : (
                          <span className={`badge badge-sm font-bold ${asigs.length > 0 ? "badge-soft badge-info" : "badge-ghost text-slate-400"}`}>
                            {asigs.length}
                          </span>
                        )}
                      </td>
                      <td className="py-3 pr-5">
                        <div className="flex items-center justify-end gap-0.5">
                          <button
                            type="button"
                            className="btn btn-square btn-xs btn-ghost text-[#09268E]"
                            title="Editar área"
                            onClick={() => setEditArea(area)}
                          >
                            <IconEdit />
                          </button>
                          <button
                            type="button"
                            className="btn btn-square btn-xs btn-ghost text-red-500"
                            title="Eliminar área"
                            onClick={() => setDeleteArea(area)}
                          >
                            <IconTrash />
                          </button>
                          <button
                            type="button"
                            className="btn btn-square btn-xs btn-ghost text-[#09268E]"
                            title="Gestionar gateways"
                            onClick={() => setGatewaysTarget(area)}
                          >
                            <IconPlus />
                          </button>
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
          showing={areas.length}
          onPageChange={(p) => void loadAreas(p, appliedNombre)}
        />
      </div>

      <CreateAreaModal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        onCreated={(area) => { setAreas((p) => [area, ...p]); setTotalRegistros((n) => n + 1); }}
      />
      <EditAreaModal
        open={editArea !== null}
        area={editArea}
        onClose={() => setEditArea(null)}
        onUpdated={(updated) => setAreas((p) => p.map((a) => (a.id === updated.id ? updated : a)))}
      />
      <DeleteAreaModal
        open={deleteArea !== null}
        area={deleteArea}
        onClose={() => setDeleteArea(null)}
        onDeleted={(id) => {
          setAreas((p) => p.filter((a) => a.id !== id));
          setTotalRegistros((n) => Math.max(0, n - 1));
        }}
      />
      <GatewaysModal
        open={gatewaysTarget !== null}
        targetId={gatewaysTarget?.id ?? 0}
        targetNombre={gatewaysTarget?.nombre ?? ""}
        targetTipo="area"
        gateways={gatewaysTargetAsigs}
        desasignando={desasignando}
        onClose={() => setGatewaysTarget(null)}
        onDesasignar={(id) => void handleUnassign(id)}
        onAsignado={() => void loadAsignaciones()}
      />
    </div>
  );
}
