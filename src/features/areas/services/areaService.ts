import axiosInstance from "@/lib/axios";
import { API_ENDPOINTS } from "@/config/api";
import type {
  Area,
  PaginatedAreas,
  CreateAreaDTO,
  UpdateAreaDTO,
} from "@/features/areas/types";

// Obtiene áreas paginadas, con filtro opcional por nombre.
export async function getAreas(
  page = 1,
  pageSize = 10,
  nombre?: string,
): Promise<PaginatedAreas> {
  const res = await axiosInstance.get<PaginatedAreas>(
    API_ENDPOINTS.areas.list,
    { params: { pagina: page, tamanio: pageSize, ...(nombre ? { nombre } : {}) } },
  );
  return res.data;
}

// Obtiene un área por su ID.
export async function getAreaById(id: number): Promise<Area> {
  const res = await axiosInstance.get<Area>(API_ENDPOINTS.areas.byId(id));
  return res.data;
}

// Crea un área.
export async function createArea(dto: CreateAreaDTO): Promise<Area> {
  const res = await axiosInstance.post<Area>(API_ENDPOINTS.areas.list, dto);
  return res.data;
}

// Actualiza un área.
export async function updateArea(id: number, dto: UpdateAreaDTO): Promise<Area> {
  const res = await axiosInstance.put<Area>(API_ENDPOINTS.areas.byId(id), dto);
  return res.data;
}

// Elimina un área.
export async function deleteArea(id: number): Promise<void> {
  await axiosInstance.delete(API_ENDPOINTS.areas.byId(id));
}
