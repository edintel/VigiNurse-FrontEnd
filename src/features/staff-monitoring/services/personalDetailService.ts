import axiosInstance from "@/lib/axios";
import { API_ENDPOINTS } from "@/config/api";
import type { PersonalMedicoDetalle } from "../types";

// Obtiene los detalles de un usuario por su ID
export async function getUserById(id: number): Promise<PersonalMedicoDetalle> {
  const response = await axiosInstance.get<PersonalMedicoDetalle>(
    API_ENDPOINTS.admin.user(id),
  );
  return response.data;
}
