import axiosInstance from "@/lib/axios";
import { API_ENDPOINTS } from "@/config/api";
import type {
  SignoVital,
  CreateSignoVitalDTO,
  SignoVitalFilters,
} from "@/features/patients/types";

// Obtiene los signos vitales de un episodio con filtros opcionales.
export async function getSignosVitalesEpisodio(
  episodioId: number,
  filters: SignoVitalFilters = {},
): Promise<SignoVital[]> {
  const params: Record<string, unknown> = {};
  if (filters.tipoSignoId != null) params.tipoSignoId = filters.tipoSignoId;
  if (filters.desde) params.desde = filters.desde;
  if (filters.hasta) params.hasta = filters.hasta;
  const res = await axiosInstance.get<SignoVital[]>(
    API_ENDPOINTS.episodios.signosVitalesEpisodio(episodioId),
    { params },
  );
  return res.data;
}

// Registra un nuevo signo vital en un episodio.
export async function createSignoVital(
  episodioId: number,
  dto: CreateSignoVitalDTO,
): Promise<SignoVital> {
  const res = await axiosInstance.post<SignoVital>(
    API_ENDPOINTS.episodios.signosVitalesEpisodio(episodioId),
    dto,
  );
  return res.data;
}
