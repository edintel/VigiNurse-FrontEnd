export interface AuditLog {
    id: number;
    usuarioId: number | null;
    nombreUsuario: string | null;
    accion: string;
    detalle: string;
    direccionIp: string;
    fechaHora: string;
    exitoso: boolean;
}
export interface PaginatedAuditLogs {
    datos: AuditLog[];
    totalRegistros: number;
    totalPaginas: number;
    paginaActual: number;
    tamanoPagina: number;
}
