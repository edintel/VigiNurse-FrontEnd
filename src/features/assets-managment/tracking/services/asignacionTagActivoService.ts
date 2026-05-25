import axiosInstance from "@/lib/axios";
import { API_ENDPOINTS } from "@/config/api";
import type { AsignacionTagActivoDto } from "@/features/assets-managment/tracking/types";

export async function getAsignacionesTagActivo(
  soloActivas = true,
): Promise<AsignacionTagActivoDto[]> {
  const res = await axiosInstance.get<AsignacionTagActivoDto[]>(
    API_ENDPOINTS.asignacionesTagActivo.list,
    { params: { soloActivas } },
  );
  return res.data;
}

export async function createAsignacionTagActivo(dto: {
  tagBleId: number;
  activoId: number;
}): Promise<AsignacionTagActivoDto> {
  const res = await axiosInstance.post<AsignacionTagActivoDto>(
    API_ENDPOINTS.asignacionesTagActivo.list,
    dto,
  );
  return res.data;
}

export async function desasignarTagActivo(id: number): Promise<void> {
  await axiosInstance.patch(
    API_ENDPOINTS.asignacionesTagActivo.desasignar(id),
  );
}
