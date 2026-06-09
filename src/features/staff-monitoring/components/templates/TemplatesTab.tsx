"use client";
import React, { useCallback, useEffect, useState } from "react";
import { useHasPermission } from "@/lib/hasPermission";
import { toast } from "@/lib/toast";
import { getTemplates, updateTemplate } from "../../services/templatesService";
import { getAreas } from "../../services/areasService";
import { TemplateFormModal } from "./TemplateFormModal";
import { TemplateDeleteModal } from "./TemplateDeleteModal";
import { PaginationFooter } from "@/shared/ui/PaginationFooter";
import type { PlantillaTurno, Area } from "../../types";
import { TipoTurno } from "../../types";

const PAGE_SIZE = 20;
const thCls = "text-xs font-semibold uppercase tracking-wide text-[#1A2B5E] bg-[#f8fafc] border-b border-[#e2e8f0] whitespace-nowrap text-left px-3.5 py-2.5";
const tdCls = "px-3.5 py-2.5 text-sm text-[#0f172a] border-b border-[#f1f5f9] align-middle";

function ShiftTypeBadge({ tipo }: { tipo: TipoTurno }) {
  return tipo === TipoTurno.Guardia ? (
    <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold bg-red-50 text-red-600 border border-red-200">
      Guardia
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
      Regular
    </span>
  );
}

function StatusBadge({ activo }: { activo: boolean }) {
  return activo ? (
    <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
      <span className="size-1.5 rounded-full bg-emerald-500" />
      Activo
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold bg-slate-100 text-slate-500 border border-slate-200">
      <span className="size-1.5 rounded-full bg-slate-400" />
      Inactivo
    </span>
  );
}

// Pestaña de gestión de templates de turno, con tabla, paginación, creación/edición y activación/desactivación.
export function TemplatesTab() {
  const canManage = useHasPermission("staffMonitoring.scheduleManage");
  const [templates, setPlantillas] = useState<PlantillaTurno[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [pagina, setPagina] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [areas, setAreas] = useState<Area[]>([]);

  const [formOpen, setFormOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<PlantillaTurno | null>(null);
  const [deactivateTarget, setDeactivateTarget] = useState<PlantillaTurno | null>(null);
  const [activatingId, setActivatingId] = useState<number | null>(null);

  const fetchTemplates = useCallback(async (page: number) => {
    setLoading(true);
    setError(null);
    try {
      const result = await getTemplates(page, PAGE_SIZE);
      setPlantillas(result.datos);
      setTotal(result.totalRegistros);
      setTotalPaginas(result.totalPaginas);
      setPagina(result.paginaActual);
    } catch {
      setError("No se pudieron cargar las templates.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchTemplates(1);
    getAreas().then(setAreas).catch(() => setAreas([]));
  }, [fetchTemplates]);

  async function handleActivar(p: PlantillaTurno) {
    setActivatingId(p.id);
    try {
      const updated = await updateTemplate(p.id, { activo: true });
      setPlantillas((prev) => prev.map((x) => (x.id === updated.id ? updated : x)));
      toast.success("Plantilla activada.");
    } catch {
      toast.error("No se pudo activar la plantilla.");
    } finally {
      setActivatingId(null);
    }
  }

  function handleSaved(saved: PlantillaTurno) {
    setPlantillas((prev) => {
      const idx = prev.findIndex((x) => x.id === saved.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = saved;
        return next;
      }
      return [saved, ...prev];
    });
    if (!editTarget) setTotal((t) => t + 1);
  }

  function handleDeactivated(updated: PlantillaTurno) {
    setPlantillas((prev) => prev.map((x) => (x.id === updated.id ? updated : x)));
  }

  return (
    <div className="space-y-4">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-[#1A2B5E]">Plantillas de turno</h2>
          
        </div>
        {canManage && (
          <button
            type="button"
            onClick={() => { setEditTarget(null); setFormOpen(true); }}
            className="btn btn-sm text-white border-none gap-1.5"
            style={{ background: "#09268E" }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Nueva plantilla
          </button>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-[#E2E8F0] overflow-hidden">
        {error && (
          <div role="alert" className="alert alert-error m-4 text-sm py-3">
            <span>{error}</span>
            <button className="btn btn-xs btn-ghost" onClick={() => void fetchTemplates(pagina)}>Reintentar</button>
          </div>
        )}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className={thCls}>Nombre</th>
                <th className={thCls}>Área</th>
                <th className={thCls}>Horario</th>
                <th className={thCls}>Cruza medianoche</th>
                <th className={thCls}>Tipo</th>
                <th className={thCls}>Estado</th>
                <th className={thCls + " text-right"}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="text-center py-12">
                  <span className="loading loading-spinner loading-md text-[#09268E]" />
                </td></tr>
              ) : templates.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-12 text-slate-400 text-sm">
                  No hay templates registradas.
                </td></tr>
              ) : (
                templates.map((p) => (
                  <tr key={p.id} className="bg-white hover:bg-[#f8fafc] transition-colors group">
                    <td className={tdCls}>
                      <span className="font-semibold">{p.nombre}</span>
                    </td>
                    <td className={tdCls + " text-slate-600"}>{p.nombreArea ?? "—"}</td>
                    <td className={tdCls}>
                      <span className=" text-xs bg-slate-100 rounded px-1.5 py-0.5">
                        {p.horaInicio.slice(0, 5)} – {p.horaFin.slice(0, 5)}
                      </span>
                    </td>
                    <td className={tdCls}>
                      {p.cruzaMedianoche ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-600">
                          
                          Sí
                        </span>
                      ) : (
                        <span className="text-slate-400 text-xs">No</span>
                      )}
                    </td>
                    <td className={tdCls}><ShiftTypeBadge tipo={p.tipoTurno} /></td>
                    <td className={tdCls}><StatusBadge activo={p.activo} /></td>
                    <td className={tdCls + " text-right"}>
                      <div className="flex items-center justify-end gap-1 flex">
                        {canManage && (
                        <button
                          type="button"
                          title="Editar"
                          onClick={() => { setEditTarget(p); setFormOpen(true); }}
                          className="inline-flex items-center justify-center w-7 h-7 rounded-md text-[#09268E] hover:bg-[#eff6ff] transition-colors"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125" />
                          </svg>
                        </button>
                        )}
                        {canManage && (p.activo ? (
                          <button
                            type="button"
                            title="Desactivar"
                            onClick={() => setDeactivateTarget(p)}
                            className="inline-flex items-center justify-center w-7 h-7 rounded-md text-amber-500 hover:bg-amber-50 transition-colors"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 0 0 5.636 5.636m12.728 12.728A9 9 0 0 1 5.636 5.636m12.728 12.728L5.636 5.636" />
                            </svg>
                          </button>
                        ) : (
                          <button
                            type="button"
                            title="Activar"
                            disabled={activatingId === p.id}
                            onClick={() => void handleActivar(p)}
                            className="inline-flex items-center justify-center w-7 h-7 rounded-md text-emerald-600 hover:bg-emerald-50 transition-colors disabled:opacity-50"
                          >
                            {activatingId === p.id ? (
                              <span className="loading loading-spinner loading-xs" />
                            ) : (
                              <svg xmlns="http://www.w3.org/2000/svg" className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                              </svg>
                            )}
                          </button>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <PaginationFooter
          current={pagina}
          total={totalPaginas}
          totalRecords={total}
          showing={templates.length}
          onPageChange={(p) => void fetchTemplates(p)}
        />
      </div>

      <TemplateFormModal
        open={formOpen}
        plantilla={editTarget}
        areas={areas}
        onClose={() => setFormOpen(false)}
        onSaved={handleSaved}
      />
      <TemplateDeleteModal
        open={!!deactivateTarget}
        plantilla={deactivateTarget}
        onClose={() => setDeactivateTarget(null)}
        onDeactivated={handleDeactivated}
      />
    </div>
  );
}
