"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "@/lib/toast";
import {
  getZones,
  deleteZone,
  getSensors,
} from "@/features/baby-monitoring/services/zoneService";
import {
  TipoZona,
  EstadoZona,
  TipoSensor,
  EstadoSensor,
  TIPO_ZONA_LABELS,
  ESTADO_ZONA_LABELS,
  TIPO_SENSOR_LABELS,
  ESTADO_SENSOR_LABELS,
} from "@/features/baby-monitoring/types/zones";
import type { Zona, Sensor } from "@/features/baby-monitoring/types/zones";
import { ZoneModal } from "./ZoneModal";
import { SensorModal } from "./SensorModal";
import { FilterPanel, FilterLabel, filterInputCls } from "@/shared/ui/FilterPanel";
import { PaginationFooter } from "@/shared/ui/PaginationFooter";

const PAGE_SIZE = 10;

// ─── Badges ───────────────────────────────────────────────────────────────────

function TipoZonaBadge({ tipo }: { tipo: TipoZona }) {
  const cfg = ({
    [TipoZona.Segura]:      "bg-emerald-50 text-emerald-700 border-emerald-200",
    [TipoZona.Transito]:    "bg-amber-50 text-amber-700 border-amber-200",
    [TipoZona.Salida]:      "bg-red-50 text-red-700 border-red-200",
    [TipoZona.Restringida]: "bg-slate-100 text-slate-600 border-slate-300",
  } as const)[tipo] ?? "bg-slate-100 text-slate-600 border-slate-300";
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border whitespace-nowrap ${cfg}`}>
      {TIPO_ZONA_LABELS[tipo]}
    </span>
  );
}

function EstadoZonaBadge({ estado }: { estado: EstadoZona }) {
  const cfg = estado === EstadoZona.Activa
    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
    : "bg-slate-100 text-slate-500 border-slate-200";
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border whitespace-nowrap ${cfg}`}>
      {ESTADO_ZONA_LABELS[estado]}
    </span>
  );
}

function EstadoSensorBadge({ estado }: { estado: EstadoSensor }) {
  const cfg = ({
    [EstadoSensor.Activo]:       "bg-emerald-50 text-emerald-700 border-emerald-200",
    [EstadoSensor.Inactivo]:     "bg-slate-100 text-slate-500 border-slate-200",
    [EstadoSensor.Falla]:        "bg-red-50 text-red-700 border-red-200",
    [EstadoSensor.Mantenimiento]:"bg-amber-50 text-amber-700 border-amber-200",
  } as const)[estado] ?? "bg-slate-100 text-slate-500 border-slate-200";
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border whitespace-nowrap ${cfg}`}>
      {ESTADO_SENSOR_LABELS[estado]}
    </span>
  );
}

function formatDateTime(dateStr: string | null) {
  if (!dateStr) return "—";
  try {
    return new Date(dateStr).toLocaleString("es-ES", {
      day: "2-digit", month: "2-digit", year: "numeric",
      hour: "2-digit", minute: "2-digit", hour12: false,
    });
  } catch { return dateStr; }
}

// ─── Delete confirmation dialog ───────────────────────────────────────────────

interface DeleteZoneDialogProps {
  zona: Zona;
  onConfirm: () => void;
  onCancel: () => void;
  deleting: boolean;
}

function DeleteZoneDialog({ zona, onConfirm, onCancel, deleting }: DeleteZoneDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    dialogRef.current?.showModal();
    return () => { dialogRef.current?.close(); };
  }, []);

  return (
    <dialog
      ref={dialogRef}
      className="modal"
      onCancel={(e) => { e.preventDefault(); if (!deleting) onCancel(); }}
    >
      <div className="modal-box max-w-sm p-0 overflow-hidden rounded-xl">
        <div className="px-6 py-4 border-b border-[#E2E8F0]">
          <h3 className="text-base font-bold text-[#0f172a]">Eliminar zona</h3>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3">
            <p className="text-sm text-red-800">
              ¿Confirma que desea eliminar la zona <strong>{zona.nombre}</strong>? Esta acción no se puede deshacer.
            </p>
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" className="btn btn-sm btn-ghost" onClick={onCancel} disabled={deleting}>
              Cancelar
            </button>
            <button
              type="button"
              className="btn btn-sm text-white"
              style={deleting
                ? { backgroundColor: "#cbd5e1", borderColor: "#cbd5e1", color: "#94a3b8", cursor: "not-allowed" }
                : { backgroundColor: "#dc2626", borderColor: "#dc2626" }}
              disabled={deleting}
              onClick={onConfirm}
            >
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

export default function ZonesAndSensorsTab() {
  // Zones
  const [zones, setZones] = useState<Zona[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [loadingZones, setLoadingZones] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters (pending vs applied)
  const [filterTipo, setFilterTipo] = useState<TipoZona | "">("");
  const [filterEstado, setFilterEstado] = useState<EstadoZona | "">("");
  const [appliedTipo, setAppliedTipo] = useState<TipoZona | undefined>(undefined);
  const [appliedEstado, setAppliedEstado] = useState<EstadoZona | undefined>(undefined);

  // Selected zone → sensors panel
  const [selectedZone, setSelectedZone] = useState<Zona | null>(null);
  const [sensors, setSensors] = useState<Sensor[]>([]);
  const [loadingSensors, setLoadingSensors] = useState(false);

  // Zone modal
  const [zoneModalOpen, setZoneModalOpen] = useState(false);
  const [editZone, setEditZone] = useState<Zona | null>(null);

  // Delete dialog
  const [confirmDeleteZone, setConfirmDeleteZone] = useState<Zona | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Sensor modal
  const [sensorModalOpen, setSensorModalOpen] = useState(false);
  const [editSensor, setEditSensor] = useState<Sensor | null>(null);

  // ── Load zones ──────────────────────────────────────────────────────────────

  const loadZones = useCallback(
    async (page: number, tipo?: TipoZona, estado?: EstadoZona) => {
      setLoadingZones(true);
      setError(null);
      try {
        const res = await getZones({
          pagina: page,
          tamanio: PAGE_SIZE,
          tipo,
          estado,
          includeSensores: true,
        });
        setZones(res.datos);
        setTotalPages(res.totalPaginas);
        setTotalRecords(res.totalRegistros);
        setCurrentPage(res.paginaActual);
      } catch {
        setError("No se pudieron cargar las zonas.");
      } finally {
        setLoadingZones(false);
      }
    },
    [],
  );

  useEffect(() => { void loadZones(1); }, [loadZones]);

  // ── Load sensors for selected zone ──────────────────────────────────────────

  useEffect(() => {
    if (!selectedZone) { setSensors([]); return; }
    setLoadingSensors(true);
    getSensors({ zonaId: selectedZone.id })
      .then(setSensors)
      .catch(() => setSensors([]))
      .finally(() => setLoadingSensors(false));
  }, [selectedZone?.id]);

  // ── Filters ─────────────────────────────────────────────────────────────────

  function handleApplyFilters(e: React.FormEvent) {
    e.preventDefault();
    const tipo = filterTipo !== "" ? filterTipo : undefined;
    const estado = filterEstado !== "" ? filterEstado : undefined;
    setAppliedTipo(tipo);
    setAppliedEstado(estado);
    void loadZones(1, tipo, estado);
  }

  function handleClearFilters() {
    setFilterTipo("");
    setFilterEstado("");
    setAppliedTipo(undefined);
    setAppliedEstado(undefined);
    void loadZones(1);
  }

  // ── Zone CRUD ────────────────────────────────────────────────────────────────

  function handleOpenCreateZone() {
    setEditZone(null);
    setZoneModalOpen(true);
  }

  function handleOpenEditZone(zona: Zona) {
    setEditZone(zona);
    setZoneModalOpen(true);
  }

  function handleZoneSaved(saved: Zona) {
    if (selectedZone?.id === saved.id) setSelectedZone(saved);
    void loadZones(currentPage, appliedTipo, appliedEstado);
  }

  async function handleDeleteZone() {
    if (!confirmDeleteZone) return;
    setDeleting(true);
    try {
      await deleteZone(confirmDeleteZone.id);
      toast.success(`Zona "${confirmDeleteZone.nombre}" eliminada.`);
      if (selectedZone?.id === confirmDeleteZone.id) setSelectedZone(null);
      setConfirmDeleteZone(null);
      void loadZones(currentPage, appliedTipo, appliedEstado);
    } catch (err: unknown) {
      const data = (err as { response?: { data?: { mensaje?: string; message?: string } } })?.response?.data;
      toast.error(data?.mensaje ?? data?.message ?? "No se pudo eliminar la zona.");
    } finally {
      setDeleting(false);
    }
  }

  // ── Sensor CRUD ──────────────────────────────────────────────────────────────

  function handleOpenCreateSensor() {
    setEditSensor(null);
    setSensorModalOpen(true);
  }

  function handleOpenEditSensor(sensor: Sensor) {
    setEditSensor(sensor);
    setSensorModalOpen(true);
  }

  function handleSensorSaved() {
    if (selectedZone) {
      setLoadingSensors(true);
      getSensors({ zonaId: selectedZone.id })
        .then(setSensors)
        .catch(() => setSensors([]))
        .finally(() => setLoadingSensors(false));
    }
    void loadZones(currentPage, appliedTipo, appliedEstado);
  }

  const tipoValues = Object.values(TipoZona).filter((v) => typeof v === "number") as TipoZona[];
  const estadoValues = Object.values(EstadoZona).filter((v) => typeof v === "number") as EstadoZona[];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <h2 className="text-lg font-bold text-[#0f172a]">Zonas y Sensores</h2>
        <button
          type="button"
          className="btn text-white"
          style={{ backgroundColor: "#09268E", borderColor: "#09268E" }}
          onClick={handleOpenCreateZone}
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" className="size-[1.2em]">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Nueva zona
        </button>
      </div>

      {/* Filters */}
      <FilterPanel onApply={handleApplyFilters} onClear={handleClearFilters}>
        <div className="flex flex-wrap gap-4 items-end">
          <div className="flex flex-col gap-1 w-44">
            <FilterLabel>Tipo</FilterLabel>
            <select
              className={filterInputCls}
              value={filterTipo}
              onChange={(e) => setFilterTipo(e.target.value === "" ? "" : Number(e.target.value) as TipoZona)}
            >
              <option value="">Todos</option>
              {tipoValues.map((t) => (
                <option key={t} value={t}>{TIPO_ZONA_LABELS[t]}</option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1 w-44">
            <FilterLabel>Estado</FilterLabel>
            <select
              className={filterInputCls}
              value={filterEstado}
              onChange={(e) => setFilterEstado(e.target.value === "" ? "" : Number(e.target.value) as EstadoZona)}
            >
              <option value="">Todos</option>
              {estadoValues.map((s) => (
                <option key={s} value={s}>{ESTADO_ZONA_LABELS[s]}</option>
              ))}
            </select>
          </div>
        </div>
      </FilterPanel>

      {/* Error */}
      {error && (
        <div role="alert" className="alert alert-error text-sm py-3">
          <span>{error}</span>
          <button
            className="btn btn-xs btn-ghost"
            onClick={() => void loadZones(currentPage, appliedTipo, appliedEstado)}
          >
            Reintentar
          </button>
        </div>
      )}

      {/* Zones table */}
      <div className="bg-white rounded-xl shadow-sm border border-[#E2E8F0] overflow-hidden">
        <div className="px-5 py-3.5 border-b border-[#f1f5f9] bg-[#F8FAFC] flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-[0.5px] text-[#64748b]">Zonas del hospital</span>
          {!loadingZones && (
            <span className="text-xs font-bold bg-[#f1f5f9] text-[#64748b] rounded-full px-2 py-0.5">
              {totalRecords}
            </span>
          )}
        </div>
        <div className="overflow-x-auto">
          <table className="table table-zebra w-full [&_td]:py-2.5 [&_th]:py-2.5">
            <thead>
              <tr className="bg-[#F8FAFC] text-[#1A2B5E]">
                <th className="text-xs font-semibold uppercase tracking-wide">Nombre</th>
                <th className="text-xs font-semibold uppercase tracking-wide">Tipo</th>
                <th className="text-xs font-semibold uppercase tracking-wide">Estado</th>
                <th className="text-xs font-semibold uppercase tracking-wide">Descripción</th>
                <th className="text-xs font-semibold uppercase tracking-wide text-center">Sensores</th>
                <th className="text-xs font-semibold uppercase tracking-wide text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loadingZones ? (
                <tr>
                  <td colSpan={6} className="text-center py-12">
                    <span className="loading loading-spinner loading-md text-[#09268E]" />
                  </td>
                </tr>
              ) : zones.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-base-content/40 text-sm">
                    No se encontraron zonas.
                  </td>
                </tr>
              ) : (
                zones.map((zona) => (
                  <tr
                    key={zona.id}
                    className={`hover:bg-base-200 cursor-pointer transition-colors ${
                      selectedZone?.id === zona.id ? "bg-blue-50 hover:bg-blue-50" : ""
                    }`}
                    onClick={() => setSelectedZone(selectedZone?.id === zona.id ? null : zona)}
                  >
                    <td>
                      <span className="font-semibold text-[#1A2B5E] text-sm">{zona.nombre}</span>
                    </td>
                    <td><TipoZonaBadge tipo={zona.tipo} /></td>
                    <td><EstadoZonaBadge estado={zona.estado} /></td>
                    <td className="text-sm text-slate-500 max-w-[200px] truncate">
                      {zona.descripcion ?? "—"}
                    </td>
                    <td className="text-center">
                      <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-[#f1f5f9] text-xs font-bold text-[#475569]">
                        {zona.sensores?.length ?? 0}
                      </span>
                    </td>
                    <td onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          className="btn btn-square btn-sm btn-ghost text-[#09268E]"
                          title="Editar zona"
                          onClick={() => handleOpenEditZone(zona)}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" className="size-4">
                            <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Z" />
                          </svg>
                        </button>
                        <button
                          type="button"
                          className="btn btn-square btn-sm btn-ghost text-red-400 hover:text-red-600"
                          title="Eliminar zona"
                          onClick={() => setConfirmDeleteZone(zona)}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" className="size-4">
                            <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                          </svg>
                        </button>
                        <button
                          type="button"
                          className={`btn btn-square btn-sm btn-ghost transition-transform ${
                            selectedZone?.id === zona.id ? "text-[#09268E] rotate-90" : "text-slate-400"
                          }`}
                          title="Ver sensores"
                          onClick={() => setSelectedZone(selectedZone?.id === zona.id ? null : zona)}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" className="size-4">
                            <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
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
          current={currentPage}
          total={totalPages}
          totalRecords={totalRecords}
          showing={zones.length}
          onPageChange={(p) => void loadZones(p, appliedTipo, appliedEstado)}
        />
      </div>

      {/* Sensors panel */}
      {selectedZone && (
        <div className="bg-white rounded-xl shadow-sm border border-[#E2E8F0] overflow-hidden">
          <div className="px-5 py-3.5 border-b border-[#f1f5f9] bg-[#F8FAFC] flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-xs font-bold uppercase tracking-[0.5px] text-[#64748b] shrink-0">
                Sensores —
              </span>
              <span className="text-sm font-semibold text-[#1A2B5E] truncate">{selectedZone.nombre}</span>
              <TipoZonaBadge tipo={selectedZone.tipo} />
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                className="btn btn-xs text-white"
                style={{ backgroundColor: "#09268E", borderColor: "#09268E" }}
                onClick={handleOpenCreateSensor}
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" className="size-3">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
                Nuevo sensor
              </button>
              <button
                type="button"
                className="btn btn-xs btn-ghost text-slate-500"
                onClick={() => setSelectedZone(null)}
                title="Cerrar panel"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" className="size-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="table table-zebra w-full [&_td]:py-2.5 [&_th]:py-2.5">
              <thead>
                <tr className="bg-[#F8FAFC] text-[#1A2B5E]">
                  <th className="text-xs font-semibold uppercase tracking-wide">Código</th>
                  <th className="text-xs font-semibold uppercase tracking-wide">Nombre</th>
                  <th className="text-xs font-semibold uppercase tracking-wide">Tipo</th>
                  <th className="text-xs font-semibold uppercase tracking-wide">MAC</th>
                  <th className="text-xs font-semibold uppercase tracking-wide">Estado</th>
                  <th className="text-xs font-semibold uppercase tracking-wide whitespace-nowrap">Última señal</th>
                  <th className="text-xs font-semibold uppercase tracking-wide whitespace-nowrap">Instalación</th>
                  <th className="text-xs font-semibold uppercase tracking-wide text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {loadingSensors ? (
                  <tr>
                    <td colSpan={8} className="text-center py-10">
                      <span className="loading loading-spinner loading-md text-[#09268E]" />
                    </td>
                  </tr>
                ) : sensors.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-10 text-base-content/40 text-sm">
                      No hay sensores vinculados a esta zona.
                    </td>
                  </tr>
                ) : (
                  sensors.map((s) => (
                    <tr key={s.id} className="hover:bg-base-200">
                      <td className="font-mono text-sm text-slate-500 whitespace-nowrap">{s.codigo}</td>
                      <td className="text-sm font-semibold text-[#1A2B5E]">{s.nombre}</td>
                      <td>
                        <span className="text-xs text-slate-600 whitespace-nowrap">
                          {TIPO_SENSOR_LABELS[s.tipo]}
                        </span>
                      </td>
                      <td className="font-mono text-xs text-slate-500 whitespace-nowrap">{s.direccionMac}</td>
                      <td><EstadoSensorBadge estado={s.estado} /></td>
                      <td className="text-sm text-slate-500 whitespace-nowrap">
                        {formatDateTime(s.ultimaSenal)}
                      </td>
                      <td className="text-sm text-slate-500 whitespace-nowrap">
                        {s.fechaInstalacion ? (
                          <span>
                            {new Date(s.fechaInstalacion).toLocaleDateString("es-ES", {
                              day: "2-digit", month: "2-digit", year: "numeric",
                            })}
                            {", "}
                            {new Date(s.fechaInstalacion).toLocaleTimeString("es-ES", {
                              hour: "2-digit", minute: "2-digit",
                            })}
                          </span>
                        ) : "—"}
                      </td>
                      <td>
                        <div className="flex items-center justify-end">
                          <button
                            type="button"
                            className="btn btn-square btn-sm btn-ghost text-[#09268E]"
                            title="Editar sensor"
                            onClick={() => handleOpenEditSensor(s)}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" className="size-4">
                              <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Z" />
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
      )}

      {/* Modals */}
      <ZoneModal
        open={zoneModalOpen}
        zona={editZone}
        onClose={() => { setZoneModalOpen(false); setEditZone(null); }}
        onSaved={handleZoneSaved}
      />

      <SensorModal
        open={sensorModalOpen}
        sensor={editSensor}
        defaultZonaId={selectedZone?.id}
        onClose={() => { setSensorModalOpen(false); setEditSensor(null); }}
        onSaved={() => handleSensorSaved()}
      />

      {confirmDeleteZone && (
        <DeleteZoneDialog
          zona={confirmDeleteZone}
          deleting={deleting}
          onConfirm={() => void handleDeleteZone()}
          onCancel={() => setConfirmDeleteZone(null)}
        />
      )}
    </div>
  );
}
