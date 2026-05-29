import axiosInstance from "@/lib/axios";
import { API_ENDPOINTS } from "@/config/api";
import type { UbicacionActivoDto } from "@/features/assets-managment/tracking/types";

// Obtiene la ubicación actual de un activo a través del ID del tag BLE asignado.
export async function getLocationByTag(
  tagBleId: number,
): Promise<UbicacionActivoDto> {
  const res = await axiosInstance.get<UbicacionActivoDto>(
    API_ENDPOINTS.ubicacionesActivos.byTag(tagBleId),
  );
  return res.data;
}

// Obtiene todas las ubicaciones de activos registrados en el sistema, sin filtrar por tag BLE.
export async function getAllLocations(): Promise<UbicacionActivoDto[]> {
  const res = await axiosInstance.get<UbicacionActivoDto[]>(
    API_ENDPOINTS.ubicacionesActivos.list,
  );
  return res.data;
}
