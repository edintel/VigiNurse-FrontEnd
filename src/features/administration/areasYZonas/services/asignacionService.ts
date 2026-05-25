import axiosInstance from "@/lib/axios";
import { API_ENDPOINTS } from "@/config/api";
import type {
  AsignacionGatewayAreaDto,
  AsignacionGatewayZonaDto,
} from "@/features/administration/areasYZonas/types";

// ─── Gateway-Área ─────────────────────────────────────────────────────────────

export async function getAsignacionesGatewayArea(
  soloActivas = true,
): Promise<AsignacionGatewayAreaDto[]> {
  const res = await axiosInstance.get<AsignacionGatewayAreaDto[]>(
    API_ENDPOINTS.asignacionesGatewayArea.list,
    { params: { soloActivas } },
  );
  return res.data;
}

export async function asignarGatewayArea(dto: {
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
  await axiosInstance.patch(API_ENDPOINTS.asignacionesGatewayArea.desasignar(id));
}

// ─── Gateway-Zona ─────────────────────────────────────────────────────────────

export async function getAsignacionesGatewayZona(): Promise<AsignacionGatewayZonaDto[]> {
  const res = await axiosInstance.get<AsignacionGatewayZonaDto[]>(
    API_ENDPOINTS.asignacionesGatewayZona.list,
  );
  return res.data;
}

export async function asignarGatewayZona(dto: {
  gatewayBleId: number;
  zonaId: number;
}): Promise<AsignacionGatewayZonaDto> {
  const res = await axiosInstance.post<AsignacionGatewayZonaDto>(
    API_ENDPOINTS.asignacionesGatewayZona.list,
    dto,
  );
  return res.data;
}

export async function desasignarGatewayZona(id: number): Promise<void> {
  await axiosInstance.patch(API_ENDPOINTS.asignacionesGatewayZona.desasignar(id));
}
