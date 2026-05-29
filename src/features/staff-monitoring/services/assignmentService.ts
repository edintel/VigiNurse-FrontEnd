import axiosInstance from "@/lib/axios";
import { API_ENDPOINTS } from "@/config/api";
import type {
  AsignacionTarea,
  CrearAsignacionTareaDto,
  ActualizarAsignacionTareaDto,
  Paginated,
} from "../types";

// Obtiene una lista paginada de assignments de tasks, con opciones de filtrado por tareaId y usuarioId
export async function getTaskAssignments(
  pagina = 1,
  tamanio = 100,
  tareaId?: number,
  usuarioId?: number,
): Promise<Paginated<AsignacionTarea>> {
  const params: Record<string, string | number> = { pagina, tamanio };
  if (tareaId !== undefined) params.tareaId = tareaId;
  if (usuarioId !== undefined) params.usuarioId = usuarioId;
  const response = await axiosInstance.get<unknown>(
    API_ENDPOINTS.personalMedico.asignacionesTareas,
    { params },
  );
  const data = response.data as Record<string, unknown>;
  return {
    datos: Array.isArray(data.datos) ? (data.datos as AsignacionTarea[]) : [],
    totalRegistros: Number(data.totalRegistros) || 0,
    totalPaginas: Number(data.totalPaginas) || 1,
    paginaActual: Number(data.paginaActual) || 1,
    tamanoPagina: Number(data.tamanoPagina) || tamanio,
  };
}

// Crea una nueva asignación de tarea para un usuario específico, con la opción de asignar a un hospital
export async function createTaskAssignment(dto: CrearAsignacionTareaDto): Promise<AsignacionTarea> {
  const response = await axiosInstance.post<AsignacionTarea>(
    API_ENDPOINTS.personalMedico.asignacionesTareas,
    dto,
  );
  return response.data;
}

// Actualiza una asignación de tarea existente
export async function updateTaskAssignment(
  id: number,
  dto: ActualizarAsignacionTareaDto,
): Promise<AsignacionTarea> {
  const response = await axiosInstance.put<AsignacionTarea>(
    API_ENDPOINTS.personalMedico.asignacionTareaById(id),
    dto,
  );
  return response.data;
}
