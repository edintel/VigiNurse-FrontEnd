import axiosInstance from "@/lib/axios";
import { API_ENDPOINTS } from "@/config/api";
import type { Tarea, CrearTareaDto, ActualizarEstadoTareaDto, TareaFilters, Paginated } from "../types";

// Obtiene una lista paginada de tasks con filtros opcionales
export async function getTasks(
  pagina = 1,
  tamanio = 20,
  filters?: TareaFilters,
): Promise<Paginated<Tarea>> {
  const params: Record<string, string | number> = { pagina, tamanio };
  if (filters?.tipoTareaId !== undefined) params.tipoTareaId = filters.tipoTareaId;
  if (filters?.estado !== undefined) params.estado = filters.estado;
  if (filters?.prioridad !== undefined) params.prioridad = filters.prioridad;
  if (filters?.areaId !== undefined) params.areaId = filters.areaId;
  if (filters?.episodioId !== undefined) params.episodioId = filters.episodioId;
  if (filters?.usuarioCreadorId !== undefined) params.usuarioCreadorId = filters.usuarioCreadorId;
  const response = await axiosInstance.get<unknown>(API_ENDPOINTS.personalMedico.tasks, { params });
  const data = response.data as Record<string, unknown>;
  return {
    datos: Array.isArray(data.datos) ? (data.datos as Tarea[]) : [],
    totalRegistros: Number(data.totalRegistros) || 0,
    totalPaginas: Number(data.totalPaginas) || 1,
    paginaActual: Number(data.paginaActual) || 1,
    tamanoPagina: Number(data.tamanoPagina) || tamanio,
  };
}

// Obtiene los detalles de una tarea por su ID
export async function getTaskById(id: number): Promise<Tarea> {
  const response = await axiosInstance.get<Tarea>(API_ENDPOINTS.personalMedico.tareaById(id));
  return response.data;
}

// Crea una nueva tarea
export async function createTask(dto: CrearTareaDto): Promise<Tarea> {
  const response = await axiosInstance.post<Tarea>(API_ENDPOINTS.personalMedico.tasks, dto);
  return response.data;
}

// Actualiza el estado de una tarea existente
export async function updateTaskStatus(id: number, dto: ActualizarEstadoTareaDto): Promise<Tarea> {
  const response = await axiosInstance.patch<Tarea>(
    API_ENDPOINTS.personalMedico.tareaEstado(id),
    dto,
  );
  return response.data;
}
