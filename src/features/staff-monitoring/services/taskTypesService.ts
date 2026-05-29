import axiosInstance from "@/lib/axios";
import { API_ENDPOINTS } from "@/config/api";
import type { TipoTarea, CrearTipoTareaDto, ActualizarTipoTareaDto, Paginated } from "../types";

// Obtiene una lista paginada de tipos de tarea para el personal médico
export async function getTaskTypes(pagina = 1, tamanio = 100): Promise<Paginated<TipoTarea>> {
  const params = { pagina, tamanio };
  const response = await axiosInstance.get<unknown>(API_ENDPOINTS.personalMedico.tiposTarea, {
    params,
  });
  const data = response.data as Record<string, unknown>;
  return {
    datos: Array.isArray(data.datos) ? (data.datos as TipoTarea[]) : [],
    totalRegistros: Number(data.totalRegistros) || 0,
    totalPaginas: Number(data.totalPaginas) || 1,
    paginaActual: Number(data.paginaActual) || 1,
    tamanoPagina: Number(data.tamanoPagina) || tamanio,
  };
}

// Crea un nuevo tipo de tarea para el personal médico
export async function createTaskType(dto: CrearTipoTareaDto): Promise<TipoTarea> {
  const response = await axiosInstance.post<TipoTarea>(API_ENDPOINTS.personalMedico.tiposTarea, dto);
  return response.data;
}

// Actualiza un tipo de tarea existente para el personal médico
export async function updateTaskType(id: number, dto: ActualizarTipoTareaDto): Promise<TipoTarea> {
  const response = await axiosInstance.put<TipoTarea>(
    API_ENDPOINTS.personalMedico.tipoTareaById(id),
    dto,
  );
  return response.data;
}
