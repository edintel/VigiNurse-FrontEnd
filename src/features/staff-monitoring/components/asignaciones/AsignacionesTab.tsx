"use client";
import React, { useCallback, useEffect, useState } from "react";
import { toast } from "@/lib/toast";
import { getAsignaciones, deleteAsignacion } from "../../services/turnosService";
import { getAllGruposActivos } from "../../services/gruposService";
import { getAllCiclosActivos } from "../../services/ciclosService";
import { getAllPlantillasActivas } from "../../services/plantillasService";
import { getAreas } from "../../services/areasService";
import { AsignacionCicloModal } from "./AsignacionCicloModal";
import { AsignacionManualModal } from "./AsignacionManualModal";
import { PaginationFooter } from "@/shared/ui/PaginationFooter";
import type { AsignacionCiclo, GrupoPersonal, CicloRotacion, PlantillaTurno, Area } from "../../types";
import { EstadoAsignacion } from "../../types";

const PAGE_SIZE = 20;
const thCls = "text-xs font-semibold uppercase tracking-wide text-[#1A2B5E] bg-[#f8fafc] border-b border-[#e2e8f0] whitespace-nowrap text-left px-3.5 py-2.5";
const tdCls = "px-3.5 py-2.5 text-sm text-[#0f172a] border-b border-[#f1f5f9] align-middle";

const ESTADO_LABELS: Record<EstadoAsignacion, string> = {
  [EstadoAsignacion.Activo]: "Activo",
  [EstadoAsignacion.Completado]: "Completado",
  [EstadoAsignacion.Cancelado]: "Cancelado",
};

const ESTADO_CLASSES: Record<EstadoAsignacion, string> = {
  [EstadoAsignacion.Activo]: "bg-green-50 text-green-700 border-green-200",
  [EstadoAsignacion.Completado]: "bg-slate-100 text-slate-500 border-slate-200",
  [EstadoAsignacion.Cancelado]: "bg-red-50 text-red-600 border-red-200",
};

function isVencePronto(fechaFin: string): boolean {
  const diff = new Date(fechaFin).getTime() - Date.now();
  return diff > 0 && diff < 7 * 24 * 3600 * 1000;
}

function extractApiError(err: unknown, fallback: string): string {
  if (err && typeof err === "object" && "response" in err) {
    const r = (err as { response?: { data?: { mensaje?: string } } }).response;
    if (r?.data?.mensaje) return r.data.mensaje;
  }
  return fallback;
}

// Componente principal para la gestión de asignaciones
export function AsignacionesTab() {
  const [subTab, setSubTab] = useState<"ciclo" | "manual">("ciclo");

  // Ciclo sub-tab
  const [asignaciones, setAsignaciones] = useState<AsignacionCiclo[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [pagina, setPagina] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mostrarCanceladas, setMostrarCanceladas] = useState(false);

  const [grupos, setGrupos] = useState<GrupoPersonal[]>([]);
  const [ciclos, setCiclos] = useState<CicloRotacion[]>([]);
  const [plantillas, setPlantillas] = useState<PlantillaTurno[]>([]);
  const [areas, setAreas] = useState<Area[]>([]);

  const [cicloModalOpen, setCicloModalOpen] = useState(false);
  const [cicloModalMode, setCicloModalMode] = useState<"crear" | "renovar">("crear");
  const [renovarTarget, setRenovarTarget] = useState<AsignacionCiclo | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AsignacionCiclo | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [manualModalOpen, setManualModalOpen] = useState(false);

  const fetchAsignaciones = useCallback(async (page: number) => {
    setLoading(true);
    setError(null);
    try {
      const result = await getAsignaciones(page, PAGE_SIZE);
      setAsignaciones(result.datos);
      setTotal(result.totalRegistros);
      setTotalPaginas(result.totalPaginas);
      setPagina(result.paginaActual);
    } catch {
      setError("No se pudieron cargar las asignaciones.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchAsignaciones(1);
    getAllGruposActivos().then(setGrupos).catch(() => setGrupos([]));
    getAllCiclosActivos().then(setCiclos).catch(() => setCiclos([]));
    getAllPlantillasActivas().then(setPlantillas).catch(() => setPlantillas([]));
    getAreas().then(setAreas).catch(() => setAreas([]));
  }, [fetchAsignaciones]);

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteAsignacion(deleteTarget.id);
      toast.success("Asignación cancelada.");
      setAsignaciones((prev) =>
        prev.map((x) => x.id === deleteTarget.id ? { ...x, estado: EstadoAsignacion.Cancelado } : x)
      );
      setDeleteTarget(null);
    } catch (err) {
      toast.error(extractApiError(err, "No se pudo cancelar la asignación."));
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="space-y-4">
      {/* Sub-tabs */}
      <div className="flex items-center gap-1 bg-[#f8fafc] border border-[#e2e8f0] rounded-xl p-1 w-fit">
        {(["ciclo", "manual"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setSubTab(t)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition ${subTab === t ? "bg-white shadow text-[#09268E]" : "text-slate-500 hover:text-slate-700"}`}
          >
            {t === "ciclo" ? "Por ciclo" : "Manual (individual)"}
          </button>
        ))}
      </div>

      {subTab === "ciclo" && (
        <>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-[#1A2B5E]">Asignaciones por ciclo</h2>
             
            </div>
            <div className="flex items-center gap-2">
              <label className="flex items-center gap-1.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  className="checkbox checkbox-xs"
                  checked={mostrarCanceladas}
                  onChange={(e) => setMostrarCanceladas(e.target.checked)}
                />
                <span className="text-xs text-slate-500">Mostrar canceladas</span>
              </label>
              <button
                type="button"
                onClick={() => { setCicloModalMode("crear"); setRenovarTarget(null); setCicloModalOpen(true); }}
                className="btn btn-sm text-white border-none gap-1.5"
                style={{ background: "#09268E" }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
                Nueva asignación
              </button>
            </div>
          </div>

          {deleteTarget && (
            <div className="rounded-xl bg-amber-50 border border-amber-200 px-5 py-4 flex items-center gap-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="size-5 text-amber-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126Z" />
              </svg>
              <p className="flex-1 text-sm text-amber-700">
                ¿Cancelar la asignación de <strong>{deleteTarget.nombreGrupo}</strong>? Los turnos generados se mantendrán.
              </p>
              <button className="btn btn-xs btn-ghost" disabled={deleting} onClick={() => setDeleteTarget(null)}>Volver</button>
              <button className="btn btn-xs text-white border-none" disabled={deleting} onClick={() => void handleDelete()} style={{ background: "#b45309" }}>
                {deleting && <span className="loading loading-spinner loading-xs" />}
                Cancelar asignación
              </button>
            </div>
          )}

          <div className="bg-white rounded-xl shadow-sm border border-[#E2E8F0] overflow-hidden">
            {error && (
              <div role="alert" className="alert alert-error m-4 text-sm py-3">
                <span>{error}</span>
                <button className="btn btn-xs btn-ghost" onClick={() => void fetchAsignaciones(pagina)}>Reintentar</button>
              </div>
            )}
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    <th className={thCls}>Grupo</th>
                    <th className={thCls}>Ciclo</th>
                    <th className={thCls}>Inicio</th>
                    <th className={thCls}>Fin</th>
                    <th className={thCls}>Estado</th>
                    <th className={thCls + " text-right"}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={6} className="text-center py-12">
                      <span className="loading loading-spinner loading-md text-[#09268E]" />
                    </td></tr>
                  ) : asignaciones.filter((a) => mostrarCanceladas || a.estado !== EstadoAsignacion.Cancelado).length === 0 ? (
                    <tr><td colSpan={6} className="text-center py-12 text-slate-400 text-sm">
                      No hay asignaciones activas.
                    </td></tr>
                  ) : (
                    asignaciones.filter((a) => mostrarCanceladas || a.estado !== EstadoAsignacion.Cancelado).map((a) => (
                      <tr key={a.id} className="bg-white hover:bg-[#f8fafc] transition-colors group">
                        <td className={tdCls}>
                          {a.nombreGrupo}
                        </td>
                        <td className={tdCls + " text-slate-600"}>{a.nombreCiclo}</td>
                        <td className={tdCls}>
                          <span>{new Date(a.fechaInicio).toLocaleDateString("es-ES", { day: "2-digit", month: "short", year: "numeric" })}</span>
                        </td>
                        <td className={tdCls}>
                          <div className="flex items-center gap-1.5">
                            <span>{new Date(a.fechaFin).toLocaleDateString("es-ES", { day: "2-digit", month: "short", year: "numeric" })}</span>
                            {isVencePronto(a.fechaFin) && (
                              <span className="rounded-full px-1.5 py-0.5 text-[10px] font-bold bg-amber-100 text-amber-700 border border-amber-200">Vence pronto</span>
                            )}
                          </div>
                        </td>
                        <td className={tdCls}>
                          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold border ${ESTADO_CLASSES[a.estado]}`}>
                            {ESTADO_LABELS[a.estado]}
                          </span>
                        </td>
                        <td className={tdCls + " text-right"}>
                          <div className="flex items-center justify-end gap-1">
                            {a.estado === EstadoAsignacion.Activo && (
                              <button
                                type="button"
                                title="Renovar"
                                onClick={() => { setCicloModalMode("renovar"); setRenovarTarget(a); setCicloModalOpen(true); }}
                                className="inline-flex items-center justify-center w-7 h-7 rounded-md text-green-600 hover:bg-green-50 transition-colors"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
                                </svg>
                              </button>
                            )}
                            {a.estado !== EstadoAsignacion.Cancelado && (
                              <button
                                type="button"
                                title="Cancelar asignación"
                                onClick={() => setDeleteTarget(a)}
                                className="inline-flex items-center justify-center w-7 h-7 rounded-md text-red-400 hover:bg-red-50 transition-colors"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                                </svg>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <PaginationFooter current={pagina} total={totalPaginas} totalRecords={total} showing={asignaciones.length} onPageChange={(p) => void fetchAsignaciones(p)} />
          </div>

          <AsignacionCicloModal
            open={cicloModalOpen}
            mode={cicloModalMode}
            asignacion={renovarTarget}
            grupos={grupos}
            ciclos={ciclos}
            plantillas={plantillas}
            onClose={() => setCicloModalOpen(false)}
            onSaved={(saved) => {
              if (cicloModalMode === "crear") {
                setAsignaciones((prev) => [saved, ...prev]);
                setTotal((t) => t + 1);
              } else {
                setAsignaciones((prev) => prev.map((x) => x.id === saved.id ? saved : x));
              }
            }}
          />
        </>
      )}

      {subTab === "manual" && (
        <>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-[#1A2B5E]">Asignación manual</h2>
              <p className="text-xs text-slate-500">Asigna turnos puntuales o por rango a un profesional.</p>
            </div>
            
          </div>

          <div className="bg-white rounded-xl border border-[#e2e8f0] flex flex-col items-center justify-center py-16 text-center">
            <div className="w-12 h-12 rounded-xl bg-[#09268E]/10 flex items-center justify-center mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="size-6 text-[#09268E]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
              </svg>
            </div>
            <p className="text-sm font-semibold text-[#1A2B5E] mb-1">Asignación manual de turnos</p>
            <p className="text-xs text-slate-400 mb-4 max-w-xs">Asigna un turno puntual o genera múltiples turnos por rango a un profesional específico.</p>
            <button
              type="button"
              onClick={() => setManualModalOpen(true)}
              className="btn btn-sm text-white border-none"
              style={{ background: "#09268E" }}
            >
              Crear asignación manual
            </button>
          </div>

          <AsignacionManualModal
            open={manualModalOpen}
            areas={areas}
            plantillas={plantillas}
            onClose={() => setManualModalOpen(false)}
            onCreated={() => {}}
          />
        </>
      )}
    </div>
  );
}
