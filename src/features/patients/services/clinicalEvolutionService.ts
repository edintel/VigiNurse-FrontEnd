import axiosInstance from "@/lib/axios";
import { API_ENDPOINTS } from "@/config/api";
import type {
  EvolucionClinica,
  CreateEvolucionClinicaDTO,
} from "@/features/patients/types";

// Obtiene todas las evoluciones clínicas de un episodio.
export async function getClinicalEvolution(
  episodioId: number,
): Promise<EvolucionClinica[]> {
  const res = await axiosInstance.get<EvolucionClinica[]>(
    API_ENDPOINTS.episodios.evolucionClinica(episodioId),
  );
  return res.data;
}

// Registra una nueva evolución clínica en un episodio.
export async function createClinicalEvolution(
  episodioId: number,
  dto: CreateEvolucionClinicaDTO,
): Promise<EvolucionClinica> {
  const res = await axiosInstance.post<EvolucionClinica>(
    API_ENDPOINTS.episodios.evolucionClinica(episodioId),
    dto,
  );
  return res.data;
}
