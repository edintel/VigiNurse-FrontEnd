import axiosInstance from "@/lib/axios";
import { API_ENDPOINTS } from "@/config/api";
import type {
  GatewayBle,
  PaginatedGatewaysBle,
  CreateGatewayBleDTO,
  UpdateGatewayBleDTO,
  EstadoGatewayBle,
} from "@/features/administration/areasYZonas/types";

export async function getGatewaysBle(
  page = 1,
  pageSize = 20,
  estado?: EstadoGatewayBle | null,
): Promise<PaginatedGatewaysBle> {
  const params: Record<string, unknown> = { pagina: page, tamanio: pageSize };
  if (estado != null) params.estado = estado;
  const res = await axiosInstance.get<PaginatedGatewaysBle>(
    API_ENDPOINTS.gatewaysBle.list,
    { params },
  );
  return res.data;
}

export async function createGatewayBle(dto: CreateGatewayBleDTO): Promise<GatewayBle> {
  const res = await axiosInstance.post<GatewayBle>(API_ENDPOINTS.gatewaysBle.list, dto);
  return res.data;
}

export async function updateGatewayBle(id: number, dto: UpdateGatewayBleDTO): Promise<GatewayBle> {
  const res = await axiosInstance.patch<GatewayBle>(API_ENDPOINTS.gatewaysBle.byId(id), dto);
  return res.data;
}
