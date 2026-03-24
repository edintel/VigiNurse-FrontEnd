"use client";
import React, { useEffect, useState, useCallback } from "react";
import { getAuditLogs } from "@/features/administration/audit/services/auditService";
import { PaginationFooter } from "@/shared/ui/PaginationFooter";
import { FilterPanel, FilterLabel, filterInputCls } from "@/shared/ui/FilterPanel";
import { formatDateTime } from "@/features/administration/users/utils/helpers";
import { AuditLog } from "@/features/administration/audit/types";
const AUDIT_PAGE_SIZE = 10;
// Muestra el componente de audit.
export default function AuditPage() {
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [totalRegistros, setTotalRegistros] = useState(0);
    const [totalPaginas, setTotalPaginas] = useState(1);
    const [paginaActual, setPaginaActual] = useState(1);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [usuarioIdStr, setUsuarioIdStr] = useState("");
    const [appliedUsuarioId, setAppliedUsuarioId] = useState<number | undefined>(undefined);
    const fetchLogs = useCallback(async (page: number, usuarioId?: number) => {
        setLoading(true);
        setError(null);
        try {
            const result = await getAuditLogs(page, AUDIT_PAGE_SIZE, usuarioId);
            setLogs(result.datos);
            setTotalRegistros(result.totalRegistros);
            setTotalPaginas(result.totalPaginas);
            setPaginaActual(result.paginaActual);
        }
        catch {
            setError("No se pudieron cargar los registros de auditoría. Intente nuevamente.");
        }
        finally {
            setLoading(false);
        }
    }, []);
    useEffect(() => {
        void fetchLogs(1);
    }, [fetchLogs]);
    // Maneja apply filtros.
    function handleApplyFilters(e: React.FormEvent) {
        e.preventDefault();
        const id = usuarioIdStr ? Number(usuarioIdStr) : undefined;
        setAppliedUsuarioId(id);
        void fetchLogs(1, id);
    }
    // Maneja clear filtros.
    function handleClearFilters() {
        setUsuarioIdStr("");
        setAppliedUsuarioId(undefined);
        void fetchLogs(1, undefined);
    }
    return (<div className="space-y-4">
      <FilterPanel onApply={handleApplyFilters} onClear={handleClearFilters}>
        <div className="flex gap-4">
          <div className="flex flex-col gap-1 w-48">
            <FilterLabel>ID de Usuario</FilterLabel>
            <input type="number" className={filterInputCls} placeholder="Buscar por ID..." value={usuarioIdStr} min={1} onChange={(e) => setUsuarioIdStr(e.target.value)}/>
          </div>
        </div>
      </FilterPanel>

      <div className="bg-white rounded-xl shadow-sm border border-[#E2E8F0] overflow-hidden">
        {error && (<div role="alert" className="alert alert-error m-4 text-sm py-3">
            <span>{error}</span>
            <button className="btn btn-xs btn-ghost" onClick={() => fetchLogs(paginaActual, appliedUsuarioId)}>
              Reintentar
            </button>
          </div>)}

      <div className="overflow-x-auto">
        <table className="table table-zebra w-full [&_td]:py-2.5 [&_th]:py-2.5">
          <thead>
            <tr className="bg-[#F8FAFC] text-[#1A2B5E]">
              <th className="text-xs font-semibold uppercase tracking-wide">ID</th>
              <th className="text-xs font-semibold uppercase tracking-wide">Usuario</th>
              <th className="text-xs font-semibold uppercase tracking-wide">Acción</th>
              <th className="text-xs font-semibold uppercase tracking-wide">Detalle</th>
              <th className="text-xs font-semibold uppercase tracking-wide">IP</th>
              <th className="text-xs font-semibold uppercase tracking-wide">Fecha y hora</th>
              <th className="text-xs font-semibold uppercase tracking-wide text-center">Resultado</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (<tr>
                <td colSpan={7} className="text-center py-12">
                  <span className="loading loading-spinner loading-md text-[#09268E]"/>
                </td>
              </tr>) : logs.length === 0 ? (<tr>
                <td colSpan={7} className="text-center py-12 text-base-content/40 text-sm">
                  No hay registros de auditoría.
                </td>
              </tr>) : (logs.map((log) => (<tr key={log.id} className="hover:bg-base-200">
                  <td className="text-base-content/40 font-mono">
                    {log.id}
                  </td>
                  <td>
                    {log.nombreUsuario ? (<span className="font-semibold text-[#1A2B5E]">
                        {log.nombreUsuario}
                      </span>) : (<span className="text-base-content/30">—</span>)}
                  </td>
                  <td>
                    <span className="badge badge-soft badge-primary whitespace-nowrap">
                      {log.accion}
                    </span>
                  </td>
                  <td className="text-base-content/70 max-w-xs truncate" title={log.detalle}>
                    {log.detalle}
                  </td>
                  <td className="text-base-content/60 font-mono">
                    {log.direccionIp}
                  </td>
                  <td className="text-base-content/60 whitespace-nowrap">
                    {formatDateTime(log.fechaHora)}
                  </td>
                  <td className="text-center">
                    <span className={`badge badge-soft ${log.exitoso ? "badge-success" : "badge-error"}`}>
                      {log.exitoso ? "Exitoso" : "Fallido"}
                    </span>
                  </td>
                </tr>)))}
          </tbody>
        </table>
      </div>

      <PaginationFooter current={paginaActual} total={totalPaginas} totalRecords={totalRegistros} showing={logs.length} onPageChange={(page) => fetchLogs(page, appliedUsuarioId)}/>
    </div>
    </div>);
}
