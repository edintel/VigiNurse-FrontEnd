import axiosInstance from "@/lib/axios";
import { API_ENDPOINTS } from "@/config/api";
import type {
  Especialidad,
  PaginatedEspecialidades,
  CreateEspecialidadDTO,
  UpdateEspecialidadDTO,
} from "@/features/administration/especialidades/types";
// Obtiene datos de especialidades.
export async function getEspecialidades(
  page = 1,
  pageSize = 10,
): Promise<PaginatedEspecialidades> {
  const res = await axiosInstance.get<PaginatedEspecialidades>(
    API_ENDPOINTS.especialidades.list,
    { params: { pagina: page, tamanoPagina: pageSize } },
  );
  return res.data;
}
// Obtiene datos de especialidad por su id.
export async function getEspecialidadById(id: number): Promise<Especialidad> {
  const res = await axiosInstance.get<Especialidad>(
    API_ENDPOINTS.especialidades.byId(id),
  );
  return res.data;
}
// Crea especialidad.
export async function createEspecialidad(
  dto: CreateEspecialidadDTO,
): Promise<Especialidad> {
  const res = await axiosInstance.post<Especialidad>(
    API_ENDPOINTS.especialidades.list,
    dto,
  );
  return res.data;
}
// Actualiza especialidad.
export async function updateEspecialidad(
  id: number,
  dto: UpdateEspecialidadDTO,
): Promise<Especialidad> {
  const res = await axiosInstance.put<Especialidad>(
    API_ENDPOINTS.especialidades.byId(id),
    dto,
  );
  return res.data;
}
