import axiosInstance from "@/lib/axios";
import { API_ENDPOINTS } from "@/config/api";
import type {
  AsignacionGatewayAreaDto,
  AsignacionGatewayZonaDto,
} from "@/features/administration/areasAndZones/types";


// Obtiene todas las asignaciones entre gateways y áreas, con opción de filtrar solo las activas
export async function getGatewayAreaAssignments(
  soloActivas = true,
): Promise<AsignacionGatewayAreaDto[]> {
  const res = await axiosInstance.get<AsignacionGatewayAreaDto[]>(
    API_ENDPOINTS.asignacionesGatewayArea.list,
    { params: { soloActivas } },
  );
  return res.data;
}

// Asigna un gateway a un área específica, devolviendo la información de la asignación creada
export async function assignGatewayArea(dto: {
  gatewayBleId: number;
  areaId: number;
}): Promise<AsignacionGatewayAreaDto> {
  const res = await axiosInstance.post<AsignacionGatewayAreaDto>(
    API_ENDPOINTS.asignacionesGatewayArea.list,
    dto,
  );
  return res.data;
}

// Desasigna un gateway de un área específica utilizando el ID de la asignación
export async function unassignGatewayArea(id: number): Promise<void> {
  await axiosInstance.patch(API_ENDPOINTS.asignacionesGatewayArea.desasignar(id));
}


// Obtiene todas las asignaciones entre gateways y zonas, con opción de filtrar solo las activas
export async function getGatewayZoneAssignments(): Promise<AsignacionGatewayZonaDto[]> {
  const res = await axiosInstance.get<AsignacionGatewayZonaDto[]>(
    API_ENDPOINTS.asignacionesGatewayZona.list,
  );
  return res.data;
}

// Asigna un gateway a una zona específica, devolviendo la información de la asignación creada
export async function assignGatewayZone(dto: {
  gatewayBleId: number;
  zonaId: number;
}): Promise<AsignacionGatewayZonaDto> {
  const res = await axiosInstance.post<AsignacionGatewayZonaDto>(
    API_ENDPOINTS.asignacionesGatewayZona.list,
    dto,
  );
  return res.data;
}

// Desasigna un gateway de una zona específica utilizando el ID de la asignación
export async function unassignGatewayZone(id: number): Promise<void> {
  await axiosInstance.patch(API_ENDPOINTS.asignacionesGatewayZona.desasignar(id));
}
