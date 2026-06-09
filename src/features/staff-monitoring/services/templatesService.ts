import axiosInstance from "@/lib/axios";
import { API_ENDPOINTS } from "@/config/api";
import type {
  PlantillaTurno,
  PlantillaFilters,
  CreatePlantillaDto,
  Paginated,
} from "../types";

// Obtiene una lista paginada de templates de turno, con filtros opcionales
export async function getTemplates(
  pagina = 1,
  tamanio = 20,
  filters?: PlantillaFilters,
): Promise<Paginated<PlantillaTurno>> {
  const params: Record<string, string | number | boolean> = { pagina, tamanio };
  if (filters?.areaId !== undefined) params.areaId = filters.areaId;
  if (filters?.tipoTurno !== undefined) params.tipoTurno = filters.tipoTurno;
  if (filters?.activo !== undefined) params.activo = filters.activo;

  const response = await axiosInstance.get<unknown>(API_ENDPOINTS.turnosPlantillas.list, { params });
  const data = response.data as Record<string, unknown>;
  return {
    datos: Array.isArray(data.datos) ? (data.datos as PlantillaTurno[]) : [],
    totalRegistros: Number(data.totalRegistros) || 0,
    totalPaginas: Number(data.totalPaginas) || 1,
    paginaActual: Number(data.paginaActual) || 1,
    tamanoPagina: Number(data.tamanoPagina) || tamanio,
  };
}

// Crea una nueva plantilla de turno
export async function createTemplate(dto: CreatePlantillaDto): Promise<PlantillaTurno> {
  const response = await axiosInstance.post<PlantillaTurno>(API_ENDPOINTS.turnosPlantillas.list, dto);
  return response.data;
}

// Actualiza una plantilla de turno existente por su ID
export async function updateTemplate(id: number, dto: Partial<CreatePlantillaDto> & { activo?: boolean }): Promise<PlantillaTurno> {
  const response = await axiosInstance.put<PlantillaTurno>(API_ENDPOINTS.turnosPlantillas.byId(id), dto);
  return response.data;
}

// Elimina una plantilla de turno por su ID
export async function deleteTemplate(id: number): Promise<void> {
  await axiosInstance.delete(API_ENDPOINTS.turnosPlantillas.byId(id));
}

// Obtiene todas las templates de turno activas sin paginación
export async function getAllActiveTemplates(): Promise<PlantillaTurno[]> {
  const result = await getTemplates(1, 200, { activo: true });
  return result.datos;
}
