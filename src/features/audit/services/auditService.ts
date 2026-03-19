import axiosInstance from "@/lib/axios";
import { API_ENDPOINTS } from "@/config/api";
import type { PaginatedAuditLogs } from "@/features/audit/types";
// Obtiene datos de audit logs.
export async function getAuditLogs(pagina = 1, tamanio = 50, usuarioId?: number): Promise<PaginatedAuditLogs> {
    const url = usuarioId !== undefined
        ? API_ENDPOINTS.audit.byUser(usuarioId)
        : API_ENDPOINTS.audit.logs;
    const response = await axiosInstance.get<unknown>(url, {
        params: { pagina, tamanio },
    });
    const data = response.data as Record<string, unknown>;
    return {
        datos: Array.isArray(data.datos) ? (data.datos as PaginatedAuditLogs["datos"]) : [],
        totalRegistros: Number(data.totalRegistros) || 0,
        totalPaginas: Number(data.totalPaginas) || 1,
        paginaActual: Number(data.paginaActual) || 1,
        tamanoPagina: Number(data.tamanoPagina) || tamanio,
    };
}
