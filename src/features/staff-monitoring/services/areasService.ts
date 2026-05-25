import axiosInstance from "@/lib/axios";
import { API_ENDPOINTS } from "@/config/api";
import type { Area } from "../types";

// Obtiene la lista de áreas, con opción de filtrar por nombre
export async function getAreas(nombre?: string): Promise<Area[]> {
  const params: Record<string, string | number> = { pagina: 1, tamanio: 200 };
  if (nombre) params.nombre = nombre;
  const response = await axiosInstance.get<unknown>(API_ENDPOINTS.areas.list, { params });
  const data = response.data as Record<string, unknown>;
  return Array.isArray(data.datos) ? (data.datos as Area[]) : [];
}
