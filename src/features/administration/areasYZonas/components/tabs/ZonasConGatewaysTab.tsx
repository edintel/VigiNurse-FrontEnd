"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "@/lib/toast";
import {
  getZones,
  deleteZone,
} from "@/features/baby-monitoring/services/zoneService";
import {
  TipoZona, EstadoZona,
  TIPO_ZONA_LABELS, ESTADO_ZONA_LABELS,
} from "@/features/baby-monitoring/types/zones";
import type { Zona } from "@/features/baby-monitoring/types/zones";
import { ZoneModal } from "@/features/baby-monitoring/components/zones/ZoneModal";
import {
  getAsignacionesGatewayZona,
  desasignarGatewayZona,
} from "@/features/administration/areasYZonas/services/asignacionService";
import { GatewaysModal } from "@/features/administration/areasYZonas/components/GatewaysModal";
import type { AsignacionGatewayZonaDto } from "@/features/administration/areasYZonas/types";
import { PaginationFooter } from "@/shared/ui/PaginationFooter";
import { FilterPanel, FilterLabel, filterInputCls } from "@/shared/ui/FilterPanel";

const PAGE_SIZE = 10;

// ─── Badges ───────────────────────────────────────────────────────────────────

const TIPO_ZONA_BADGE: Record<TipoZona, string> = {
  [TipoZona.Segura]:      "badge-soft badge-success",
  [TipoZona.Transito]:    "badge-soft badge-warning",
  [TipoZona.Salida]:      "badge-soft badge-error",
  [TipoZona.Restringida]: "badge-soft badge-neutral",
};

function TipoZonaBadge({ tipo }: { tipo: TipoZona }) {
  return (
    <span className={`badge badge-sm ${TIPO_ZONA_BADGE[tipo] ?? "badge-ghost"}`}>
      {TIPO_ZONA_LABELS[tipo]}
    </span>
  );
}

function EstadoZonaBadge({ estado }: { estado: EstadoZona }) {
  return (
    <span className={`badge badge-sm ${estado === EstadoZona.Activa ? "badge-soft badge-success" : "badge-soft badge-neutral"}`}>
      {ESTADO_ZONA_LABELS[estado]}
    </span>
  );
}

// ─── Iconos ───────────────────────────────────────────────────────────────────

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

// ─── Delete dialog ────────────────────────────────────────────────────────────

function DeleteZoneDialog({ zona, onConfirm, onCancel, deleting }: {
  zona: Zona; onConfirm: () => void; onCancel: () => void; deleting: boolean;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    dialogRef.current?.showModal();
    return () => { dialogRef.current?.close(); };
  }, []);
  return (
    <dialog ref={dialogRef} className="modal" onCancel={(e) => { e.preventDefault(); if (!deleting) onCancel(); }}>
      <div className="modal-box max-w-sm p-0 overflow-hidden rounded-xl">
        <div className="px-6 py-4 border-b border-[#E2E8F0]">
          <h3 className="text-base font-bold text-[#0f172a]">Eliminar zona</h3>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3">
            <p className="text-sm text-red-800">
              ¿Confirma eliminar la zona <strong>{zona.nombre}</strong>? Esta acción no se puede deshacer.
            </p>
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" className="btn btn-sm btn-ghost" onClick={onCancel} disabled={deleting}>Cancelar</button>
            <button type="button" className="btn btn-sm btn-error text-white" disabled={deleting} onClick={onConfirm}>
              {deleting && <span className="loading loading-spinner loading-xs" />}
              Eliminar
            </button>
          </div>
        </div>
      </div>
      <form method="dialog" className="modal-backdrop">
        <button type="button" onClick={() => { if (!deleting) onCancel(); }}>close</button>
      </form>
    </dialog>
  );
}

// ─── Tab principal ────────────────────────────────────────────────────────────

export default function ZonasConGatewaysTab() {
  const [zones, setZones] = useState<Zona[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [loadingZones, setLoadingZones] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [filterTipo, setFilterTipo] = useState<TipoZona | "">("");
  const [filterEstado, setFilterEstado] = useState<EstadoZona | "">("");
  const [appliedTipo, setAppliedTipo] = useState<TipoZona | undefined>(undefined);
  const [appliedEstado, setAppliedEstado] = useState<EstadoZona | undefined>(undefined);

  const [asignaciones, setAsignaciones] = useState<AsignacionGatewayZonaDto[]>([]);
  const [asignacionesLoading, setAsignacionesLoading] = useState(false);
  const [desasignando, setDesasignando] = useState<number | null>(null);

  const [zoneModalOpen, setZoneModalOpen] = useState(false);
  const [editZone, setEditZone] = useState<Zona | null>(null);
  const [confirmDeleteZone, setConfirmDeleteZone] = useState<Zona | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [gatewaysTarget, setGatewaysTarget] = useState<Zona | null>(null);

  const loadZones = useCallback(async (page: number, tipo?: TipoZona, estado?: EstadoZona) => {
    setLoadingZones(true);
    setError(null);
    try {
      const res = await getZones({ pagina: page, tamanio: PAGE_SIZE, tipo, estado });
      setZones(res.datos);
      setTotalPages(res.totalPaginas);
      setTotalRecords(res.totalRegistros);
      setCurrentPage(res.paginaActual);
    } catch {
      setError("No se pudieron cargar las zonas.");
    } finally {
      setLoadingZones(false);
    }
  }, []);

  const loadAsignaciones = useCallback(async () => {
    setAsignacionesLoading(true);
    try {
      setAsignaciones(await getAsignacionesGatewayZona());
    } catch {
      setAsignaciones([]);
    } finally {
      setAsignacionesLoading(false);
    }
  }, []);

  useEffect(() => { void loadZones(1); void loadAsignaciones(); }, [loadZones, loadAsignaciones]);

  function handleApplyFilters(e: React.FormEvent) {
    e.preventDefault();
    const tipo = filterTipo !== "" ? filterTipo : undefined;
    const estado = filterEstado !== "" ? filterEstado : undefined;
    setAppliedTipo(tipo); setAppliedEstado(estado);
    void loadZones(1, tipo, estado);
  }

  function handleClearFilters() {
    setFilterTipo(""); setFilterEstado("");
    setAppliedTipo(undefined); setAppliedEstado(undefined);
    void loadZones(1);
  }

  async function handleDeleteZone() {
    if (!confirmDeleteZone) return;
    setDeleting(true);
    try {
      await deleteZone(confirmDeleteZone.id);
      toast.success(`Zona "${confirmDeleteZone.nombre}" eliminada.`);
      setConfirmDeleteZone(null);
      void loadZones(currentPage, appliedTipo, appliedEstado);
    } catch (err: unknown) {
      const data = (err as { response?: { data?: { mensaje?: string; message?: string } } })?.response?.data;
      toast.error(data?.mensaje ?? data?.message ?? "No se pudo eliminar la zona.");
    } finally {
      setDeleting(false);
    }
  }

  async function handleDesasignar(id: number) {
    const asig = asignaciones.find((a) => a.id === id);
    setDesasignando(id);
    try {
      await desasignarGatewayZona(id);
      toast.success(asig ? `Gateway "${asig.gatewayNombre}" desasignado.` : "Gateway desasignado.");
      void loadAsignaciones();
    } catch (err: unknown) {
      const data = (err as { response?: { data?: { mensaje?: string } } })?.response?.data;
      toast.error(data?.mensaje ?? "No se pudo desasignar el gateway.");
    } finally {
      setDesasignando(null);
    }
  }

  function getAsignacionesForZona(zonaId: number): AsignacionGatewayZonaDto[] {
    return asignaciones.filter((a) => a.zonaId === zonaId);
  }

  const gatewaysTargetAsigs = gatewaysTarget
    ? getAsignacionesForZona(gatewaysTarget.id)
    : [];

  const tipoValues = Object.values(TipoZona).filter((v) => typeof v === "number") as TipoZona[];
  const estadoValues = Object.values(EstadoZona).filter((v) => typeof v === "number") as EstadoZona[];

  return (
    <div className="space-y-5">
      {/* Encabezado */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-lg font-bold text-[#0f172a]">Zonas del hospital</h2>
          <p className="text-xs text-slate-400 mt-0.5">Administra las zonas BLE y sus gateways asociados</p>
        </div>
        <button
          type="button"
          className="btn btn-sm text-white"
          style={{ backgroundColor: "#09268E", borderColor: "#09268E" }}
          onClick={() => { setEditZone(null); setZoneModalOpen(true); }}
        >
          <IconPlus className="size-3.5" />
          Nueva zona
        </button>
      </div>

      {/* Filtros */}
      <FilterPanel onApply={handleApplyFilters} onClear={handleClearFilters}>
        <div className="flex flex-wrap gap-4 items-end">
          <div className="flex flex-col gap-1 w-44">
            <FilterLabel>Tipo</FilterLabel>
            <select className={filterInputCls} value={filterTipo} onChange={(e) => setFilterTipo(e.target.value === "" ? "" : Number(e.target.value) as TipoZona)}>
              <option value="">Todos</option>
              {tipoValues.map((t) => <option key={t} value={t}>{TIPO_ZONA_LABELS[t]}</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-1 w-44">
            <FilterLabel>Estado</FilterLabel>
            <select className={filterInputCls} value={filterEstado} onChange={(e) => setFilterEstado(e.target.value === "" ? "" : Number(e.target.value) as EstadoZona)}>
              <option value="">Todos</option>
              {estadoValues.map((s) => <option key={s} value={s}>{ESTADO_ZONA_LABELS[s]}</option>)}
            </select>
          </div>
        </div>
      </FilterPanel>

      {error && (
        <div role="alert" className="alert alert-error text-sm py-3">
          <span>{error}</span>
          <button className="btn btn-xs btn-ghost" onClick={() => void loadZones(currentPage, appliedTipo, appliedEstado)}>Reintentar</button>
        </div>
      )}

      {/* Tabla */}
      <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Zonas</span>
          {!loadingZones && <span className="badge badge-ghost badge-sm font-bold">{totalRecords}</span>}
        </div>

        <div className="overflow-x-auto">
          <table className="table table-sm w-full">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/60">
                <th className="text-[10px] font-bold uppercase tracking-widest text-slate-400 py-3 pl-5">Nombre</th>
                <th className="text-[10px] font-bold uppercase tracking-widest text-slate-400 py-3">Tipo</th>
                <th className="text-[10px] font-bold uppercase tracking-widest text-slate-400 py-3">Estado</th>
                <th className="text-[10px] font-bold uppercase tracking-widest text-slate-400 py-3">Descripción</th>
                <th className="text-[10px] font-bold uppercase tracking-widest text-slate-400 py-3 text-center">Gateways</th>
                <th className="text-[10px] font-bold uppercase tracking-widest text-slate-400 py-3 pr-5 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loadingZones ? (
                <tr><td colSpan={6} className="text-center py-16">
                  <span className="loading loading-spinner loading-md text-[#09268E]" />
                </td></tr>
              ) : zones.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-16">
                  <div className="flex flex-col items-center gap-2 text-slate-400">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-8 opacity-40">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498 4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 0 0-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0Z" />
                    </svg>
                    <span className="text-sm">No se encontraron zonas</span>
                  </div>
                </td></tr>
              ) : (
                zones.map((zona) => {
                  const asigs = getAsignacionesForZona(zona.id);
                  return (
                    <tr key={zona.id} className="border-b border-slate-100/70 hover:bg-slate-50/80 transition-colors duration-150">
                      <td className="py-3 pl-5">
                        <span className="font-semibold text-[#1A2B5E] text-sm">{zona.nombre}</span>
                      </td>
                      <td className="py-3"><TipoZonaBadge tipo={zona.tipo} /></td>
                      <td className="py-3"><EstadoZonaBadge estado={zona.estado} /></td>
                      <td className="py-3 max-w-[180px]">
                        <span className="text-sm text-slate-400 truncate block">{zona.descripcion ?? "—"}</span>
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
                            title="Editar zona"
                            onClick={() => { setEditZone(zona); setZoneModalOpen(true); }}
                          >
                            <IconEdit />
                          </button>
                          <button
                            type="button"
                            className="btn btn-square btn-xs btn-ghost text-red-500"
                            title="Eliminar zona"
                            onClick={() => setConfirmDeleteZone(zona)}
                          >
                            <IconTrash />
                          </button>
                          <button
                            type="button"
                            className="btn btn-square btn-xs btn-ghost text-[#09268E]"
                            title="Gestionar gateways"
                            onClick={() => setGatewaysTarget(zona)}
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
          current={currentPage}
          total={totalPages}
          totalRecords={totalRecords}
          showing={zones.length}
          onPageChange={(p) => void loadZones(p, appliedTipo, appliedEstado)}
        />
      </div>

      <ZoneModal
        open={zoneModalOpen}
        zona={editZone}
        onClose={() => { setZoneModalOpen(false); setEditZone(null); }}
        onSaved={() => void loadZones(currentPage, appliedTipo, appliedEstado)}
      />
      {confirmDeleteZone && (
        <DeleteZoneDialog
          zona={confirmDeleteZone}
          deleting={deleting}
          onConfirm={() => void handleDeleteZone()}
          onCancel={() => setConfirmDeleteZone(null)}
        />
      )}
      <GatewaysModal
        open={gatewaysTarget !== null}
        targetId={gatewaysTarget?.id ?? 0}
        targetNombre={gatewaysTarget?.nombre ?? ""}
        targetTipo="zona"
        gateways={gatewaysTargetAsigs}
        desasignando={desasignando}
        onClose={() => setGatewaysTarget(null)}
        onDesasignar={(id) => void handleDesasignar(id)}
        onAsignado={() => void loadAsignaciones()}
      />
    </div>
  );
}
