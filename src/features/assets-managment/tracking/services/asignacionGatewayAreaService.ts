import axiosInstance from "@/lib/axios";
import { API_ENDPOINTS } from "@/config/api";

export interface AsignacionGatewayAreaDto {
  id: number;
  gatewayBleId: number;
  gatewayNombre: string;
  gatewayMac: string;
  areaId: number;
  areaNombre: string;
  fechaAsignacion: string;
  fechaDesasignacion: string | null;
  asignadoPorNombre: string;
}

export async function getAsignacionesGatewayArea(
  soloActivas = true,
): Promise<AsignacionGatewayAreaDto[]> {
  const res = await axiosInstance.get<AsignacionGatewayAreaDto[]>(
    API_ENDPOINTS.asignacionesGatewayArea.list,
    { params: { soloActivas } },
  );
  return res.data;
}

export async function createAsignacionGatewayArea(dto: {
  gatewayBleId: number;
  areaId: number;
}): Promise<AsignacionGatewayAreaDto> {
  const res = await axiosInstance.post<AsignacionGatewayAreaDto>(
    API_ENDPOINTS.asignacionesGatewayArea.list,
    dto,
  );
  return res.data;
}

export async function desasignarGatewayArea(id: number): Promise<void> {
  await axiosInstance.patch(
    API_ENDPOINTS.asignacionesGatewayArea.desasignar(id),
  );
}
