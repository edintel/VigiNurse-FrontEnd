import axiosInstance from "@/lib/axios";
import { API_ENDPOINTS } from "@/config/api";
import type {
  Activo,
  PaginatedActivos,
  CreateActivoDTO,
  UpdateActivoDTO,
  RetirarActivoDTO,
  ActivoFilters,
} from "@/features/assets-managment/inventory/types";

// Obtiene activos paginados con filtros opcionales.
export async function getActivos(
  page = 1,
  pageSize = 10,
  filters: ActivoFilters = {},
): Promise<PaginatedActivos> {
  const params: Record<string, unknown> = { pagina: page, tamanio: pageSize };
  if (filters.estado !== undefined && filters.estado !== null) {
    params.estado = filters.estado;
  }
  if (filters.tipoId) params.tipoId = filters.tipoId;
  if (filters.areaId) params.areaId = filters.areaId;
  if (filters.numeroSerie) params.numeroSerie = filters.numeroSerie;
  if (filters.marca) params.marca = filters.marca;
  if (filters.modelo) params.modelo = filters.modelo;
  const res = await axiosInstance.get<PaginatedActivos>(
    API_ENDPOINTS.activos.list,
    { params },
  );
  return res.data;
}

// Crea un activo.
export async function createActivo(dto: CreateActivoDTO): Promise<Activo> {
  const res = await axiosInstance.post<Activo>(API_ENDPOINTS.activos.list, dto);
  return res.data;
}

// Actualiza un activo.
export async function updateActivo(
  id: number,
  dto: UpdateActivoDTO,
): Promise<Activo> {
  const res = await axiosInstance.patch<Activo>(
    API_ENDPOINTS.activos.byId(id),
    dto,
  );
  return res.data;
}

// Obtiene un activo por ID.
export async function getActivoById(id: number): Promise<Activo> {
  const res = await axiosInstance.get<Activo>(API_ENDPOINTS.activos.byId(id));
  return res.data;
}

// Retira un activo sin eliminarlo.
export async function retirarActivo(
  id: number,
  dto: RetirarActivoDTO,
): Promise<void> {
  await axiosInstance.patch(API_ENDPOINTS.activos.retirar(id), dto);
}

// Obtiene la imagen QR de un activo como Blob.
export async function getActivoQrBlob(id: number): Promise<Blob> {
  const res = await axiosInstance.get<Blob>(API_ENDPOINTS.activos.qr(id), {
    responseType: "blob",
  });
  return res.data;
}
