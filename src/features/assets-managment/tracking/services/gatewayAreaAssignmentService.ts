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

// Obtiene las asignaciones de gateways a áreas, con la opción de filtrar solo las activas (sin fecha de desasignación).
export async function getGatewayAreaAssignments(
  soloActivas = true,
): Promise<AsignacionGatewayAreaDto[]> {
  const res = await axiosInstance.get<AsignacionGatewayAreaDto[]>(
    API_ENDPOINTS.asignacionesGatewayArea.list,
    { params: { soloActivas } },
  );
  return res.data;
}

// Crea una nueva asignación de gateway a área.
export async function createGatewayAreaAssignment(dto: {
  gatewayBleId: number;
  areaId: number;
}): Promise<AsignacionGatewayAreaDto> {
  const res = await axiosInstance.post<AsignacionGatewayAreaDto>(
    API_ENDPOINTS.asignacionesGatewayArea.list,
    dto,
  );
  return res.data;
}

// Desasigna un gateway de un área, estableciendo la fecha de desasignación.
export async function unassignGatewayArea(id: number): Promise<void> {
  await axiosInstance.patch(
    API_ENDPOINTS.asignacionesGatewayArea.desasignar(id),
  );
}
