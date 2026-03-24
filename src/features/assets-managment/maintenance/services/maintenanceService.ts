import axiosInstance from "@/lib/axios";
import { API_ENDPOINTS } from "@/config/api";
import type {
  Mantenimiento,
  PaginatedMantenimientos,
  CreateMantenimientoDTO,
  UpdateMantenimientoDTO,
  MantenimientoFilters,
  CalendarioFilters,
  ChangeEstadoDTO,
} from "@/features/assets-managment/maintenance/types";

// Obtener mantenimientos de un activo con paginación y filtros opcionales
export async function getMantenimientosByActivo(
  activoId: number,
  pagina = 1,
  tamanio = 10,
  filters: MantenimientoFilters = {},
): Promise<PaginatedMantenimientos> {
  const params: Record<string, number> = { pagina, tamanio };
  if (filters.estado !== undefined) params.estado = filters.estado;
  if (filters.tipo !== undefined) params.tipo = filters.tipo;
  if (filters.responsableId !== undefined)
    params.responsableId = filters.responsableId;
  const res = await axiosInstance.get<PaginatedMantenimientos>(
    API_ENDPOINTS.mantenimientos.byActivo(activoId),
    { params },
  );
  return res.data;
}

// Obtener mantenimientos para calendario con filtros opcionales
export async function getMantenimientosCalendario(
  desde: string,
  hasta: string,
  filters: CalendarioFilters = {},
): Promise<Mantenimiento[]> {
  const params: Record<string, string | number> = { desde, hasta };
  if (filters.areaId !== undefined) params.areaId = filters.areaId;
  if (filters.estado !== undefined) params.estado = filters.estado;
  if (filters.tipo !== undefined) params.tipo = filters.tipo;
  if (filters.responsableId !== undefined)
    params.responsableId = filters.responsableId;
  const res = await axiosInstance.get<unknown>(
    API_ENDPOINTS.mantenimientos.calendario,
    { params },
  );
  const data = res.data as Record<string, unknown>;
  return Array.isArray(data.datos)
    ? (data.datos as Mantenimiento[])
    : Array.isArray(data)
      ? (data as Mantenimiento[])
      : [];
}

// Actualizar mantenimiento
export async function updateMantenimiento(
  activoId: number,
  mantenimientoId: number,
  dto: UpdateMantenimientoDTO,
): Promise<Mantenimiento> {
  const res = await axiosInstance.patch<Mantenimiento>(
    API_ENDPOINTS.mantenimientos.byId(activoId, mantenimientoId),
    dto,
  );
  return res.data;
}

// Cambiar estado del mantenimiento
export async function changeMantenimientoEstado(
  activoId: number,
  mantenimientoId: number,
  dto: ChangeEstadoDTO,
): Promise<Mantenimiento> {
  const res = await axiosInstance.patch<Mantenimiento>(
    API_ENDPOINTS.mantenimientos.estado(activoId, mantenimientoId),
    dto,
  );
  return res.data;
}

// Crear nuevo mantenimiento
export async function createMantenimiento(
  activoId: number,
  dto: CreateMantenimientoDTO,
): Promise<Mantenimiento> {
  const res = await axiosInstance.post<Mantenimiento>(
    API_ENDPOINTS.mantenimientos.byActivo(activoId),
    dto,
  );
  return res.data;
}
