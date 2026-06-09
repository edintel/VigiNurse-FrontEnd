import axiosInstance from "@/lib/axios";
import { API_ENDPOINTS } from "@/config/api";
import type { AsignacionTagActivoDto } from "@/features/assets-managment/tracking/types";

// Obtiene la lista de asignaciones de tags a activos, con la opción de filtrar solo las activas o incluir las inactivas.
export async function getTagAssetAssignments(
  soloActivas = true,
): Promise<AsignacionTagActivoDto[]> {
  const res = await axiosInstance.get<AsignacionTagActivoDto[]>(
    API_ENDPOINTS.asignacionesTagActivo.list,
    { params: { soloActivas } },
  );
  return res.data;
}

// Crea una nueva asignación de tag a activo.
export async function createTagAssetAssignment(dto: {
  tagBleId: number;
  activoId: number;
}): Promise<AsignacionTagActivoDto> {
  const res = await axiosInstance.post<AsignacionTagActivoDto>(
    API_ENDPOINTS.asignacionesTagActivo.list,
    dto,
  );
  return res.data;
}

// Desasigna un tag de un activo, marcando la fecha de desasignación y el usuario que realizó la acción.
export async function unassignTagAsset(id: number): Promise<void> {
  await axiosInstance.patch(
    API_ENDPOINTS.asignacionesTagActivo.desasignar(id),
  );
}
