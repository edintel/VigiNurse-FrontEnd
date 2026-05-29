"use client";
import React, { useCallback, useEffect, useState } from "react";
import { toast } from "@/lib/toast";
import { getTaskTypes } from "../../services/taskTypesService";
import { TaskTypeFormModal } from "./TaskTypeFormModal";
import { PaginationFooter } from "@/shared/ui/PaginationFooter";
import type { TipoTarea } from "../../types";

const PAGE_SIZE = 20;
const thCls =
  "text-xs font-semibold uppercase tracking-wide text-[#1A2B5E] bg-[#f8fafc] border-b border-[#e2e8f0] whitespace-nowrap text-left px-3.5 py-2.5";
const tdCls = "px-3.5 py-2.5 text-sm text-[#0f172a] border-b border-[#f1f5f9] align-middle";

// Pestaña de gestión de tipos de tarea. Permite crear, editar y listar los tipos de tarea disponibles en el hospital.
export function TaskTypesTab() {
  const [tipos, setTipos] = useState<TipoTarea[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [pagina, setPagina] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<TipoTarea | null>(null);

  const fetchTypes = useCallback(async (page: number) => {
    setLoading(true);
    setError(null);
    try {
      const result = await getTaskTypes(page, PAGE_SIZE);
      setTipos(result.datos);
      setTotal(result.totalRegistros);
      setTotalPaginas(result.totalPaginas);
      setPagina(result.paginaActual);
    } catch {
      setError("No se pudieron cargar los tipos de tarea.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchTypes(1);
  }, [fetchTypes]);

  function handleSaved(saved: TipoTarea) {
    setTipos((prev) => {
      const idx = prev.findIndex((x) => x.id === saved.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = saved;
        return next;
      }
      return [saved, ...prev];
    });
    if (!editTarget) setTotal((t) => t + 1);
    toast.success(editTarget ? "Tipo actualizado." : "Tipo creado.");
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-[#1A2B5E]">Tipos de tarea</h2>
          <p className="text-xs text-slate-500">Categorías de tasks disponibles en el hospital.</p>
        </div>
        <button
          type="button"
          onClick={() => { setEditTarget(null); setFormOpen(true); }}
          className="btn btn-sm text-white border-none gap-1.5"
          style={{ background: "#09268E" }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Nuevo tipo
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-[#E2E8F0] overflow-hidden">
        {error && (
          <div role="alert" className="alert alert-error m-4 text-sm py-3">
            <span>{error}</span>
            <button className="btn btn-xs btn-ghost" onClick={() => void fetchTypes(pagina)}>Reintentar</button>
          </div>
        )}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className={thCls}>Nombre</th>
                <th className={thCls}>Descripción</th>
                <th className={thCls}>Hospital</th>
                <th className={thCls + " text-right"}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={4} className="text-center py-12">
                    <span className="loading loading-spinner loading-md text-[#09268E]" />
                  </td>
                </tr>
              ) : tipos.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-center py-12 text-slate-400 text-sm">
                    No hay tipos de tarea registrados.
                  </td>
                </tr>
              ) : (
                tipos.map((t) => (
                  <tr key={t.id} className="bg-white hover:bg-[#f8fafc] transition-colors">
                    <td className={tdCls}>
                      <span className="font-semibold">{t.nombre}</span>
                    </td>
                    <td className={tdCls + " text-slate-500 max-w-xs"}>
                      {t.descripcion ? (
                        <span className="line-clamp-2">{t.descripcion}</span>
                      ) : (
                        <span className="text-slate-300">—</span>
                      )}
                    </td>
                    <td className={tdCls + " text-slate-500"}>{t.nombreHospital}</td>
                    <td className={tdCls + " text-right"}>
                      <button
                        type="button"
                        title="Editar"
                        onClick={() => { setEditTarget(t); setFormOpen(true); }}
                        className="inline-flex items-center justify-center w-7 h-7 rounded-md text-[#09268E] hover:bg-[#eff6ff] transition-colors"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125" />
                        </svg>
                      </button>
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
          showing={tipos.length}
          onPageChange={(p) => void fetchTypes(p)}
        />
      </div>

      <TaskTypeFormModal
        open={formOpen}
        tipo={editTarget}
        onClose={() => setFormOpen(false)}
        onSaved={handleSaved}
      />
    </div>
  );
}
