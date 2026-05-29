import axiosInstance from "@/lib/axios";
import { API_ENDPOINTS } from "@/config/api";
import type { EstadoDisponibilidadPersonal } from "../types";

// Obtiene el estado de disponibilidad del personal médico
export async function updateStaffStatus(
  estado: EstadoDisponibilidadPersonal,
): Promise<void> {
  await axiosInstance.patch(API_ENDPOINTS.personalMedico.miEstado, { estado });
}
