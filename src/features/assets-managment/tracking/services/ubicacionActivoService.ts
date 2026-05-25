import axiosInstance from "@/lib/axios";
import { API_ENDPOINTS } from "@/config/api";
import type { UbicacionActivoDto } from "@/features/assets-managment/tracking/types";

export async function getUbicacionByTag(
  tagBleId: number,
): Promise<UbicacionActivoDto> {
  const res = await axiosInstance.get<UbicacionActivoDto>(
    API_ENDPOINTS.ubicacionesActivos.byTag(tagBleId),
  );
  return res.data;
}

export async function getAllUbicaciones(): Promise<UbicacionActivoDto[]> {
  const res = await axiosInstance.get<UbicacionActivoDto[]>(
    API_ENDPOINTS.ubicacionesActivos.list,
  );
  return res.data;
}
