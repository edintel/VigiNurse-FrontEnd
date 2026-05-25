import axiosInstance from "@/lib/axios";
import { API_ENDPOINTS } from "@/config/api";
import type {
  TagBle,
  PaginatedTagsBle,
  CreateTagBleDTO,
  UpdateTagBleDTO,
  TagBleFilters,
} from "@/features/assets-managment/tracking/types";

export async function getTagsBle(
  page = 1,
  pageSize = 10,
  filters: TagBleFilters = {},
): Promise<PaginatedTagsBle> {
  const params: Record<string, unknown> = { pagina: page, tamanio: pageSize };
  if (filters.estado !== undefined && filters.estado !== null) {
    params.estado = filters.estado;
  }
  if (filters.codigo) params.codigo = filters.codigo;
  const res = await axiosInstance.get<PaginatedTagsBle>(
    API_ENDPOINTS.tagsBle.list,
    { params },
  );
  return res.data;
}

export async function getTagBleById(id: number): Promise<TagBle> {
  const res = await axiosInstance.get<TagBle>(API_ENDPOINTS.tagsBle.byId(id));
  return res.data;
}

export async function createTagBle(dto: CreateTagBleDTO): Promise<TagBle> {
  const res = await axiosInstance.post<TagBle>(API_ENDPOINTS.tagsBle.list, dto);
  return res.data;
}

export async function updateTagBle(
  id: number,
  dto: UpdateTagBleDTO,
): Promise<TagBle> {
  const res = await axiosInstance.patch<TagBle>(
    API_ENDPOINTS.tagsBle.byId(id),
    dto,
  );
  return res.data;
}
