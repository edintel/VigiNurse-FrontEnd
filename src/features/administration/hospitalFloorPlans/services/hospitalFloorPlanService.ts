import axiosInstance from "@/lib/axios";
import { API_ENDPOINTS } from "@/config/api";
import type {
  PlanoHospital,
  VistaPlano,
  AreaConPosicion,
  GuardarPosicionAreaDTO,
} from "@/features/administration/hospitalFloorPlans/types";

// Obtiene la lista de planos hospitalarios para un hospital específico
export async function getHospitalFloorPlans(hospitalId: number): Promise<PlanoHospital[]> {
  const res = await axiosInstance.get<PlanoHospital[]>(
    API_ENDPOINTS.hospitalFloorPlans.lista(hospitalId)
  );
  return res.data;
}

// Crea un nuevo plano hospitalario 
export async function createHospitalFloorPlan(formData: FormData): Promise<PlanoHospital> {
  const res = await axiosInstance.post<PlanoHospital>(
    API_ENDPOINTS.hospitalFloorPlans.crear,
    formData,
    { headers: { "Content-Type": "multipart/form-data" } }
  );
  return res.data;
}

// Elimina un plano hospitalario por su ID
export async function deleteHospitalFloorPlan(planoId: number): Promise<void> {
  await axiosInstance.delete(API_ENDPOINTS.hospitalFloorPlans.eliminar(planoId));
}

// Obtiene la vista detallada de un plano hospitalario, incluyendo sus áreas y posiciones
export async function getFloorPlanView(planoId: number): Promise<VistaPlano> {
  const res = await axiosInstance.get<VistaPlano>(
    API_ENDPOINTS.hospitalFloorPlans.vista(planoId)
  );
  return res.data;
}

// Obtiene la lista de áreas con sus posiciones para un hospital específico
export async function getAreasList(): Promise<AreaConPosicion[]> {
  const res = await axiosInstance.get<unknown>(API_ENDPOINTS.areas.list, {
    params: { tamanio: 500 },
  });
  const data = res.data as Record<string, unknown>;
  if (Array.isArray(data)) return data as AreaConPosicion[];
  if (Array.isArray(data.datos)) return data.datos as AreaConPosicion[];
  return [];
}

// Guarda la posición de un área en un plano hospitalario
export async function saveAreaPosition(
  areaId: number,
  dto: GuardarPosicionAreaDTO
): Promise<AreaConPosicion> {
  const res = await axiosInstance.put<AreaConPosicion>(
    API_ENDPOINTS.areas.posicion(areaId),
    dto
  );
  return res.data;
}
