import axiosInstance from "@/lib/axios";
import { API_ENDPOINTS } from "@/config/api";
import type {
  CreateMedicamentoDTO,
  MedicamentoAdmin,
  PaginatedMedicamentos,
} from "@/features/administration/medicamentos/types";



// Función para obtener la lista de medicamentos con paginación y filtro opcional por nombre
export async function getMedicamentos(
  page = 1,
  pageSize = 10,
  nombre?: string,
): Promise<PaginatedMedicamentos> {
  const params: Record<string, unknown> = { pagina: page, tamanio: pageSize };
  if (nombre) params.nombre = nombre;

  const res = await axiosInstance.get<PaginatedMedicamentos>(API_ENDPOINTS.medicamentos.list, {
    params,
  });

  const data = res.data;
  return {
    datos: data.datos,
    totalRegistros: data.totalRegistros || 0,
    totalPaginas: data.totalPaginas || 1,
    paginaActual: data.paginaActual|| page,
    tamanoPagina: data.tamanoPagina || pageSize,
  };
}

// Función para crear un nuevo medicamento.
export async function createMedicamento(
  dto: CreateMedicamentoDTO,
): Promise<MedicamentoAdmin> {
  const res = await axiosInstance.post<unknown>(API_ENDPOINTS.medicamentos.list, dto);
  
  return res.data as MedicamentoAdmin;
}

export async function getMedicamentosForDropdown(
  nombre?: string,
  page = 1,
  pageSize = 20,
  signal?: AbortSignal,
): Promise<MedicamentoAdmin[]> {
  const params: Record<string, unknown> = { pagina: page, tamanio: pageSize };
  if (nombre) params.nombre = nombre;
  const res = await axiosInstance.get<PaginatedMedicamentos>(API_ENDPOINTS.medicamentos.list, {
    params,
    signal,
  });
  return res.data.datos;
}



