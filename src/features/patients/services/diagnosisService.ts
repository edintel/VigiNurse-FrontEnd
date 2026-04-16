import axiosInstance from "@/lib/axios";
import { API_ENDPOINTS } from "@/config/api";
import type { Diagnostico, CreateDiagnosticoDTO } from "@/features/patients/types";

// Obtiene todos los diagnósticos de un episodio.
export async function getEpisodeDiagnostics(
  episodioId: number,
): Promise<Diagnostico[]> {
  const res = await axiosInstance.get<Diagnostico[]>(
    API_ENDPOINTS.episodios.diagnosticos(episodioId),
  );
  return res.data;
}

// Registra un nuevo diagnóstico en un episodio.
export async function createDiagnosis(
  episodioId: number,
  dto: CreateDiagnosticoDTO,
): Promise<Diagnostico> {
  const res = await axiosInstance.post<Diagnostico>(
    API_ENDPOINTS.episodios.diagnosticos(episodioId),
    dto,
  );
  return res.data;
}
