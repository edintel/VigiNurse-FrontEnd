"use client";
import React, { useCallback, useEffect, useState } from "react";
import { useHasPermission } from "@/lib/hasPermission";
import { toast } from "@/lib/toast";
import { getGroups, deleteGroup } from "../../services/groupsService";
import { GroupFormModal } from "./GroupFormModal";
import { GroupDetailModal } from "./GroupDetailModal";
import { PaginationFooter } from "@/shared/ui/PaginationFooter";
import type { GrupoPersonal } from "../../types";

const PAGE_SIZE = 20;

function extractApiError(err: unknown, fallback: string): string {
  if (err && typeof err === "object" && "response" in err) {
    const r = (err as { response?: { data?: { mensaje?: string } } }).response;
    if (r?.data?.mensaje) return r.data.mensaje;
  }
  return fallback;
}

// Componente principal para la pestaña de groups de personal
export function GroupsTab() {
  const canManage = useHasPermission("staffMonitoring.scheduleManage");
  const [groups, setGrupos] = useState<GrupoPersonal[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [pagina, setPagina] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formOpen, setFormOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<GrupoPersonal | null>(null);
  const [detalleTarget, setDetalleTarget] = useState<GrupoPersonal | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<GrupoPersonal | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchGroups = useCallback(async (page: number) => {
    setLoading(true);
    setError(null);
    try {
      const result = await getGroups(page, PAGE_SIZE, true);
      setGrupos(result.datos);
      setTotal(result.totalRegistros);
      setTotalPaginas(result.totalPaginas);
      setPagina(result.paginaActual);
    } catch {
      setError("No se pudieron cargar los groups.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void fetchGroups(1); }, [fetchGroups]);

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteGroup(deleteTarget.id);
      toast.success("Grupo eliminado.");
      setGrupos((prev) => prev.filter((x) => x.id !== deleteTarget.id));
      setTotal((t) => Math.max(0, t - 1));
      setDeleteTarget(null);
    } catch (err) {
      toast.error(extractApiError(err, "No se pudo eliminar el grupo."));
    } finally {
      setDeleting(false);
    }
  }

  function handleSaved(saved: GrupoPersonal) {
    setGrupos((prev) => {
      const idx = prev.findIndex((x) => x.id === saved.id);
      if (idx >= 0) { const next = [...prev]; next[idx] = saved; return next; }
      return [saved, ...prev];
    });
    if (!editTarget) setTotal((t) => t + 1);
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-[#1A2B5E]">Grupos de personal</h2>
          <p className="text-xs text-slate-500">{total} grupo{total !== 1 ? "s" : ""} registrado{total !== 1 ? "s" : ""}</p>
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
            Nuevo grupo
          </button>
        )}
      </div>

      {error && (
        <div role="alert" className="alert alert-error text-sm py-3">
          <span>{error}</span>
          <button className="btn btn-xs btn-ghost" onClick={() => void fetchGroups(pagina)}>Reintentar</button>
        </div>
      )}

      {/* Delete confirmation inline */}
      {deleteTarget && (
        <div className="rounded-xl bg-red-50 border border-red-200 px-5 py-4 flex items-center gap-4">
          <svg xmlns="http://www.w3.org/2000/svg" className="size-5 text-red-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126Z" />
          </svg>
          <p className="flex-1 text-sm text-red-700">
            ¿Eliminar el grupo <strong>{deleteTarget.nombre}</strong>? Esta acción no se puede deshacer.
          </p>
          <button className="btn btn-xs btn-ghost text-slate-600" disabled={deleting} onClick={() => setDeleteTarget(null)}>Cancelar</button>
          <button className="btn btn-xs btn-error text-white border-none" disabled={deleting} onClick={() => void handleDelete()}>
            {deleting && <span className="loading loading-spinner loading-xs" />}
            Eliminar
          </button>
        </div>
      )}

      {/* Cards grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-[#e2e8f0] shadow-sm p-5 animate-pulse">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-4 h-4 rounded-full bg-slate-200" />
                <div className="h-4 bg-slate-200 rounded flex-1" />
              </div>
              <div className="h-3 bg-slate-100 rounded w-20 mb-2" />
              <div className="h-5 bg-slate-100 rounded w-16" />
            </div>
          ))}
        </div>
      ) : groups.length === 0 && !error ? (
        <div className="text-center py-16 text-slate-400 text-sm bg-white rounded-xl border border-[#e2e8f0]">
          No hay groups registrados.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {groups.map((g) => (
            <div
              key={g.id}
              className="bg-white rounded-xl border border-[#e2e8f0] shadow-sm p-5 hover:shadow-md transition-shadow group relative"
              style={{ borderTop: `3px solid ${g.color}` }}
            >
              <div className="flex items-start gap-2 mb-3">
                <span className="w-3.5 h-3.5 rounded-full shrink-0 mt-1" style={{ backgroundColor: g.color }} />
                <h3 className="text-sm font-bold text-[#0f172a] leading-tight flex-1 min-w-0 truncate">{g.nombre}</h3>
              </div>
              <p className="text-xs text-slate-500 mb-3">
                {g.cantidadMiembros} miembro{g.cantidadMiembros !== 1 ? "s" : ""}
              </p>
              <div className="flex items-center justify-between">
                <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${g.activo ? "bg-green-50 text-green-700 border border-green-200" : "bg-slate-100 text-slate-500 border border-slate-200"}`}>
                  {g.activo ? "Activo" : "Inactivo"}
                </span>
                <div className="flex gap-1">
                  <button
                    type="button"
                    title="Ver detalle"
                    onClick={() => setDetalleTarget(g)}
                    className="inline-flex items-center justify-center w-7 h-7 rounded-md text-[#09268E] hover:bg-[#eff6ff] transition-colors"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                    </svg>
                  </button>
                  {canManage && (
                  <button
                    type="button"
                    title="Editar"
                    onClick={() => { setEditTarget(g); setFormOpen(true); }}
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
                    onClick={() => setDeleteTarget(g)}
                    className="inline-flex items-center justify-center w-7 h-7 rounded-md text-red-400 hover:bg-red-50 transition-colors"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                    </svg>
                  </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {totalPaginas > 1 && (
        <div className="bg-white rounded-xl border border-[#e2e8f0]">
          <PaginationFooter
            current={pagina}
            total={totalPaginas}
            totalRecords={total}
            showing={groups.length}
            onPageChange={(p) => void fetchGroups(p)}
          />
        </div>
      )}

      <GroupFormModal
        open={formOpen}
        grupo={editTarget}
        onClose={() => setFormOpen(false)}
        onSaved={handleSaved}
      />
      <GroupDetailModal
        open={!!detalleTarget}
        grupo={detalleTarget}
        onClose={() => setDetalleTarget(null)}
      />
    </div>
  );
}
