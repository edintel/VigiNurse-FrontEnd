import axiosInstance from "@/lib/axios";
import { API_ENDPOINTS } from "@/config/api";
import type { PaginatedPersonal, PersonalFilters } from "../types";


// Obtiene una lista paginada de personal médico con filtros opcionales
export async function getMedicalStaff(
  pagina = 1,
  tamanio = 20,
  filters?: PersonalFilters,
): Promise<PaginatedPersonal> {
  const params: Record<string, string | number | boolean> = { pagina, tamanio };
  if (filters) {
    if (filters.nombre) params.nombre = filters.nombre;
    if (filters.apellidos) params.apellidos = filters.apellidos;
    if (filters.cedula) params.cedula = filters.cedula;
    if (filters.email) params.email = filters.email;
    if (filters.especialidadId !== undefined) params.especialidadId = filters.especialidadId;
    if (filters.rol) params.rol = filters.rol;
    if (filters.estado !== undefined) params.estado = filters.estado;
    if (filters.bloqueado !== undefined) params.bloqueado = filters.bloqueado;
  }
  const response = await axiosInstance.get<unknown>(
    API_ENDPOINTS.personalMedico.list,
    { params },
  );
  const data = response.data as Record<string, unknown>;
  return {
    datos: Array.isArray(data.datos) ? (data.datos as import("../types").PersonalMedico[]) : [],
    totalRegistros: Number(data.totalRegistros) || 0,
    totalPaginas: Number(data.totalPaginas) || 1,
    paginaActual: Number(data.paginaActual) || 1,
    tamanoPagina: Number(data.tamanoPagina) || tamanio,
  };
}
