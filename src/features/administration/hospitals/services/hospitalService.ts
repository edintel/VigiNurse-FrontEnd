import axiosInstance from "@/lib/axios";
import { API_ENDPOINTS } from "@/config/api";
import type {
  Hospital,
  PaginatedHospitals,
  CreateHospitalDTO,
  UpdateHospitalDTO,
} from "@/features/administration/hospitals/types";
// Obtiene datos de hospitales.
export async function getHospitals(
  page = 1,
  pageSize = 10,
): Promise<PaginatedHospitals> {
  const res = await axiosInstance.get<PaginatedHospitals>(
    API_ENDPOINTS.hospitals.list,
    { params: { pagina: page, tamanoPagina: pageSize } },
  );
  return res.data;
}
// Obtiene datos de hospital por su id.
export async function getHospitalById(id: number): Promise<Hospital> {
  const res = await axiosInstance.get<Hospital>(
    API_ENDPOINTS.hospitals.byId(id),
  );
  return res.data;
}
// Crea hospital.
export async function createHospital(
  dto: CreateHospitalDTO,
): Promise<Hospital> {
  const res = await axiosInstance.post<Hospital>(
    API_ENDPOINTS.hospitals.list,
    dto,
  );
  return res.data;
}
// Actualiza hospital.
export async function updateHospital(
  id: number,
  dto: UpdateHospitalDTO,
): Promise<Hospital> {
  const res = await axiosInstance.put<Hospital>(
    API_ENDPOINTS.hospitals.byId(id),
    dto,
  );
  return res.data;
}
// Elimina hospital.
export async function deleteHospital(id: number): Promise<void> {
  await axiosInstance.delete(API_ENDPOINTS.hospitals.byId(id));
}
