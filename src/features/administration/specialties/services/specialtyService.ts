import axiosInstance from "@/lib/axios";
import { API_ENDPOINTS } from "@/config/api";
import type {
  Especialidad,
  PaginatedEspecialidades,
  CreateEspecialidadDTO,
  UpdateEspecialidadDTO,
} from "@/features/administration/specialties/types";
// Obtiene datos de especialidades.
export async function getSpecialties(
  page = 1,
  pageSize = 10,
): Promise<PaginatedEspecialidades> {
  const res = await axiosInstance.get<PaginatedEspecialidades>(
    API_ENDPOINTS.specialties.list,
    { params: { pagina: page, tamanoPagina: pageSize } },
  );
  return res.data;
}
// Obtiene datos de especialidad por su id.
export async function getSpecialtyById(id: number): Promise<Especialidad> {
  const res = await axiosInstance.get<Especialidad>(
    API_ENDPOINTS.specialties.byId(id),
  );
  return res.data;
}
// Crea especialidad.
export async function createSpecialty(
  dto: CreateEspecialidadDTO,
): Promise<Especialidad> {
  const res = await axiosInstance.post<Especialidad>(
    API_ENDPOINTS.specialties.list,
    dto,
  );
  return res.data;
}
// Actualiza especialidad.
export async function updateSpecialty(
  id: number,
  dto: UpdateEspecialidadDTO,
): Promise<Especialidad> {
  const res = await axiosInstance.put<Especialidad>(
    API_ENDPOINTS.specialties.byId(id),
    dto,
  );
  return res.data;
}
