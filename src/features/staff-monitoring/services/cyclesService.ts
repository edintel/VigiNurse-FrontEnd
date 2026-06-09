import axiosInstance from "@/lib/axios";
import { API_ENDPOINTS } from "@/config/api";
import type { CicloRotacion, CreateCicloDto, UpdateCicloDto, Paginated } from "../types";

// Obtiene una lista paginada de cycles de rotación, con opción de filtrar por estado activo/inactivo
export async function getCycles(
  pagina = 1,
  tamanio = 20,
  activo?: boolean,
): Promise<Paginated<CicloRotacion>> {
  const params: Record<string, string | number | boolean> = { pagina, tamanio };
  if (activo !== undefined) params.activo = activo;
  const response = await axiosInstance.get<unknown>(API_ENDPOINTS.turnosCiclos.list, { params });
  const data = response.data as Record<string, unknown>;
  return {
    datos: Array.isArray(data.datos) ? (data.datos as CicloRotacion[]) : [],
    totalRegistros: Number(data.totalRegistros) || 0,
    totalPaginas: Number(data.totalPaginas) || 1,
    paginaActual: Number(data.paginaActual) || 1,
    tamanoPagina: Number(data.tamanoPagina) || tamanio,
  };
}

// Obtiene los detalles de un ciclo de rotación específico por su ID
export async function getCycleById(id: number): Promise<CicloRotacion> {
  const response = await axiosInstance.get<CicloRotacion>(API_ENDPOINTS.turnosCiclos.byId(id));
  return response.data;
}

// Crea un nuevo ciclo de rotación con los datos proporcionados
export async function createCycle(dto: CreateCicloDto): Promise<CicloRotacion> {
  const response = await axiosInstance.post<CicloRotacion>(API_ENDPOINTS.turnosCiclos.list, dto);
  return response.data;
}

// Actualiza un ciclo de rotación existente identificado por su ID con los nuevos datos proporcionados
export async function updateCycle(id: number, dto: UpdateCicloDto): Promise<CicloRotacion> {
  const response = await axiosInstance.put<CicloRotacion>(API_ENDPOINTS.turnosCiclos.byId(id), dto);
  return response.data;
}

// Elimina un ciclo de rotación específico por su ID
export async function deleteCycle(id: number): Promise<void> {
  await axiosInstance.delete(API_ENDPOINTS.turnosCiclos.byId(id));
}

// Obtiene una lista de todos los cycles de rotación activos sin paginación
export async function getAllActiveCycles(): Promise<CicloRotacion[]> {
  const result = await getCycles(1, 200, true);
  return result.datos;
}
