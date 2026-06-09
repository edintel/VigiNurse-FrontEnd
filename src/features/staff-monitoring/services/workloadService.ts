import axiosInstance from "@/lib/axios";
import { API_ENDPOINTS } from "@/config/api";
import type { CargaTrabajo, SugerenciaPersonal, Paginated, NivelCarga } from "../types";

// Obtiene la carga de trabajo del personal médico con paginación y filtro por nivel de carga
export async function getWorkload(
  pagina = 1,
  tamanio = 200,
  nivelCarga?: NivelCarga,
): Promise<Paginated<CargaTrabajo>> {
  const params: Record<string, string | number> = { pagina, tamanio };
  if (nivelCarga !== undefined) params.nivelCarga = nivelCarga;
  const response = await axiosInstance.get<unknown>(API_ENDPOINTS.personalMedico.cargaTrabajo, {
    params,
  });
  const data = response.data as Record<string, unknown>;
  return {
    datos: Array.isArray(data.datos) ? (data.datos as CargaTrabajo[]) : [],
    totalRegistros: Number(data.totalRegistros) || 0,
    totalPaginas: Number(data.totalPaginas) || 1,
    paginaActual: Number(data.paginaActual) || 1,
    tamanoPagina: Number(data.tamanoPagina) || tamanio,
  };
}

// Obtiene sugerencias de personal médico para asignar tasks, con filtros opcionales por área, tarea y rol
export async function getStaffSuggestions(params: {
  areaId?: number;
  tareaId?: number;
  rolId?: number;
}): Promise<SugerenciaPersonal[]> {
  const qParams: Record<string, string | number> = {};
  if (params.areaId !== undefined) qParams.areaId = params.areaId;
  if (params.tareaId !== undefined) qParams.tareaId = params.tareaId;
  if (params.rolId !== undefined) qParams.rolId = params.rolId;
  const response = await axiosInstance.get<SugerenciaPersonal[]>(
    API_ENDPOINTS.personalMedico.sugerenciasPersonal,
    { params: qParams },
  );
  return Array.isArray(response.data) ? response.data : [];
}

// Obtiene la carga de trabajo específica de un usuario por su ID
export async function getUserWorkload(usuarioId: number): Promise<CargaTrabajo> {
  const response = await axiosInstance.get<CargaTrabajo>(
    API_ENDPOINTS.personalMedico.cargaTrabajoUsuario(usuarioId),
  );
  return response.data;
}
