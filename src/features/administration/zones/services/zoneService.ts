import axiosInstance from "@/lib/axios";
import { API_ENDPOINTS } from "@/config/api";
import type {
  Zona,
  PaginatedZonas,
  CreateZonaDTO,
  UpdateZonaDTO,
} from "@/features/administration/zones/types";

// Obtiene zonas paginadas.
export async function getZones(
  page = 1,
  pageSize = 10,
): Promise<PaginatedZonas> {
  const res = await axiosInstance.get<PaginatedZonas>(
    API_ENDPOINTS.zonas.list,
    { params: { pagina: page, tamanio: pageSize } },
  );
  return res.data;
}

// Obtiene una zona por su ID.
export async function getZoneById(id: number): Promise<Zona> {
  const res = await axiosInstance.get<Zona>(API_ENDPOINTS.zonas.byId(id));
  return res.data;
}

// Crea una zona.
export async function createZone(dto: CreateZonaDTO): Promise<Zona> {
  const res = await axiosInstance.post<Zona>(API_ENDPOINTS.zonas.list, dto);
  return res.data;
}

// Actualiza una zona.
export async function updateZone(
  id: number,
  dto: UpdateZonaDTO,
): Promise<Zona> {
  const res = await axiosInstance.put<Zona>(
    API_ENDPOINTS.zonas.byId(id),
    dto,
  );
  return res.data;
}

// Elimina una zona.
export async function deleteZone(id: number): Promise<void> {
  await axiosInstance.delete(API_ENDPOINTS.zonas.byId(id));
}
