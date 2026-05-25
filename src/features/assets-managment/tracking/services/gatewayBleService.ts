import axiosInstance from "@/lib/axios";
import { API_ENDPOINTS } from "@/config/api";
import type {
  GatewayBle,
  PaginatedGatewaysBle,
  CreateGatewayBleDTO,
  UpdateGatewayBleDTO,
  GatewayBleFilters,
} from "@/features/assets-managment/tracking/types";

export async function getGatewaysBle(
  page = 1,
  pageSize = 10,
  filters: GatewayBleFilters = {},
): Promise<PaginatedGatewaysBle> {
  const params: Record<string, unknown> = { pagina: page, tamanio: pageSize };
  if (filters.estado !== undefined && filters.estado !== null) {
    params.estado = filters.estado;
  }
  if (filters.nombre) params.nombre = filters.nombre;
  const res = await axiosInstance.get<PaginatedGatewaysBle>(
    API_ENDPOINTS.gatewaysBle.list,
    { params },
  );
  return res.data;
}

export async function getGatewayBleById(id: number): Promise<GatewayBle> {
  const res = await axiosInstance.get<GatewayBle>(
    API_ENDPOINTS.gatewaysBle.byId(id),
  );
  return res.data;
}

export async function createGatewayBle(
  dto: CreateGatewayBleDTO,
): Promise<GatewayBle> {
  const res = await axiosInstance.post<GatewayBle>(
    API_ENDPOINTS.gatewaysBle.list,
    dto,
  );
  return res.data;
}

export async function updateGatewayBle(
  id: number,
  dto: UpdateGatewayBleDTO,
): Promise<GatewayBle> {
  const res = await axiosInstance.patch<GatewayBle>(
    API_ENDPOINTS.gatewaysBle.byId(id),
    dto,
  );
  return res.data;
}
