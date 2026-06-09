"use client";
import React, { useCallback, useEffect, useState } from "react";
import { useHasPermission } from "@/lib/hasPermission";
import { toast } from "@/lib/toast";
import { getCycles, deleteCycle } from "../../services/cyclesService";
import { getAllActiveTemplates } from "../../services/templatesService";
import { CycleWizardModal } from "./CycleWizardModal";
import { PaginationFooter } from "@/shared/ui/PaginationFooter";
import type { CicloRotacion, PlantillaTurno } from "../../types";

const PAGE_SIZE = 20;
const thCls = "text-xs font-semibold uppercase tracking-wide text-[#1A2B5E] bg-[#f8fafc] border-b border-[#e2e8f0] whitespace-nowrap text-left px-3.5 py-2.5";
const tdCls = "px-3.5 py-2.5 text-sm text-[#0f172a] border-b border-[#f1f5f9] align-middle";

function extractApiError(err: unknown, fallback: string): string {
  if (err && typeof err === "object" && "response" in err) {
    const r = (err as { response?: { data?: { mensaje?: string } } }).response;
    if (r?.data?.mensaje) return r.data.mensaje;
  }
  return fallback;
}

// Componente principal de la pestaña de cycles de rotación, con listado paginado, 
// creación/edición mediante wizard, y eliminación con confirmación.
export function CyclesTab() {
  const canManage = useHasPermission("staffMonitoring.scheduleManage");
  const [cycles, setCiclos] = useState<CicloRotacion[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [pagina, setPagina] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [templates, setPlantillas] = useState<PlantillaTurno[]>([]);

  const [wizardOpen, setWizardOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<CicloRotacion | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<CicloRotacion | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchCycles = useCallback(async (page: number) => {
    setLoading(true);
    setError(null);
    try {
      const result = await getCycles(page, PAGE_SIZE, true);
      setCiclos(result.datos);
      setTotal(result.totalRegistros);
      setTotalPaginas(result.totalPaginas);
      setPagina(result.paginaActual);
    } catch {
      setError("No se pudieron cargar los cycles.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchCycles(1);
    getAllActiveTemplates().then(setPlantillas).catch(() => setPlantillas([]));
  }, [fetchCycles]);

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteCycle(deleteTarget.id);
      toast.success("Ciclo eliminado.");
      setCiclos((prev) => prev.filter((x) => x.id !== deleteTarget.id));
      setTotal((t) => Math.max(0, t - 1));
      setDeleteTarget(null);
    } catch (err) {
      toast.error(extractApiError(err, "No se pudo eliminar el ciclo."));
    } finally {
      setDeleting(false);
    }
  }

  function handleSaved(saved: CicloRotacion) {
    setCiclos((prev) => {
      const idx = prev.findIndex((x) => x.id === saved.id);
      if (idx >= 0) { const next = [...prev]; next[idx] = saved; return next; }
      return [saved, ...prev];
    });
    if (!editTarget) setTotal((t) => t + 1);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-[#1A2B5E]">Ciclos de rotación</h2>
          
        </div>
        {canManage && (
          <button
            type="button"
            onClick={() => { setEditTarget(null); setWizardOpen(true); }}
            className="btn btn-sm text-white border-none gap-1.5"
            style={{ background: "#09268E" }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Nuevo ciclo
          </button>
        )}
      </div>

      {deleteTarget && (
        <div className="rounded-xl bg-red-50 border border-red-200 px-5 py-4 flex items-center gap-4">
          <svg xmlns="http://www.w3.org/2000/svg" className="size-5 text-red-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126Z" />
          </svg>
          <p className="flex-1 text-sm text-red-700">
            ¿Eliminar el ciclo <strong>{deleteTarget.nombre}</strong>? Esta acción no se puede deshacer.
          </p>
          <button className="btn btn-xs btn-ghost" disabled={deleting} onClick={() => setDeleteTarget(null)}>Cancelar</button>
          <button className="btn btn-xs btn-error text-white border-none" disabled={deleting} onClick={() => void handleDelete()}>
            {deleting && <span className="loading loading-spinner loading-xs" />}
            Eliminar
          </button>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-[#E2E8F0] overflow-hidden">
        {error && (
          <div role="alert" className="alert alert-error m-4 text-sm py-3">
            <span>{error}</span>
            <button className="btn btn-xs btn-ghost" onClick={() => void fetchCycles(pagina)}>Reintentar</button>
          </div>
        )}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className={thCls}>Nombre</th>
                <th className={thCls}>Duración</th>
                <th className={thCls}>Turnos</th>
                
                <th className={thCls}>Estado</th>
                <th className={thCls + " text-right"}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="text-center py-12">
                  <span className="loading loading-spinner loading-md text-[#09268E]" />
                </td></tr>
              ) : cycles.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-12 text-slate-400 text-sm">
                  No hay cycles registrados.
                </td></tr>
              ) : (
                cycles.map((c) => {
                  
                  return (
                    <tr key={c.id} className="bg-white hover:bg-[#f8fafc] transition-colors group">
                      <td className={tdCls}>
                        <div>
                          <p className="font-semibold">{c.nombre}</p>
                          {c.descripcion && <p className="text-xs text-slate-400 truncate max-w-[200px]">{c.descripcion}</p>}
                        </div>
                      </td>
                      <td className={tdCls}>
                        <span className="text-xs bg-slate-100 rounded px-1.5 py-0.5">{c.duracionSemanas} sem.</span>
                      </td>
                      <td className={tdCls}>
                        <span className="font-semibold text-[#09268E]">{c.cantidadTurnos}</span>
                      </td>
                     
                      <td className={tdCls}>
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${c.activo ? "bg-green-50 text-green-700 border border-green-200" : "bg-slate-100 text-slate-500 border border-slate-200"}`}>
                          {c.activo ? "Activo" : "Inactivo"}
                        </span>
                      </td>
                      <td className={tdCls + " text-right"}>
                        <div className="flex items-center justify-end gap-1">
                          {canManage && (
                          <button
                            type="button"
                            title="Editar"
                            onClick={() => { setEditTarget(c); setWizardOpen(true); }}
                            className="inline-flex items-center justify-center w-7 h-7 rounded-md text-[#09268E] hover:bg-[#eff6ff] transition-colors"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125" />
                            </svg>
                          </button>
                          )}
                          {canManage && (
                          <button
                            type="button"
                            title="Eliminar"
                            onClick={() => setDeleteTarget(c)}
                            className="inline-flex items-center justify-center w-7 h-7 rounded-md text-red-400 hover:bg-red-50 transition-colors"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                            </svg>
                          </button>
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
          current={pagina}
          total={totalPaginas}
          totalRecords={total}
          showing={cycles.length}
          onPageChange={(p) => void fetchCycles(p)}
        />
      </div>

      <CycleWizardModal
        open={wizardOpen}
        ciclo={editTarget}
        templates={templates}
        onClose={() => setWizardOpen(false)}
        onSaved={handleSaved}
      />
    </div>
  );
}
