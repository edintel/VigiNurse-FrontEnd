import axiosInstance from "@/lib/axios";
import { API_ENDPOINTS } from "@/config/api";
import type {
  TipoSignoVital,
  CreateTipoSignoVitalDTO,
  UpdateTipoSignoVitalDTO,
} from "@/features/administration/signosVitales/types";

// Obtiene todos los tipos de signos vitales.
export async function getTiposSignoVital(): Promise<TipoSignoVital[]> {
  const res = await axiosInstance.get<TipoSignoVital[]>(
    API_ENDPOINTS.signosVitales.tipos,
  );
  return res.data;
}

// Crea un nuevo tipo de signo vital.
export async function createTipoSignoVital(
  dto: CreateTipoSignoVitalDTO,
): Promise<TipoSignoVital> {
  const res = await axiosInstance.post<TipoSignoVital>(
    API_ENDPOINTS.signosVitales.tipos,
    dto,
  );
  return res.data;
}

// Actualiza un tipo de signo vital existente.
export async function updateTipoSignoVital(
  id: number,
  dto: UpdateTipoSignoVitalDTO,
): Promise<TipoSignoVital> {
  const res = await axiosInstance.put<TipoSignoVital>(
    API_ENDPOINTS.signosVitales.tipoById(id),
    dto,
  );
  return res.data;
}
