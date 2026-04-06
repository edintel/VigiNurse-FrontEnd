import axiosInstance from "@/lib/axios";
import { API_ENDPOINTS } from "@/config/api";
import type {
  NotaEnfermeria,
  CreateNotaEnfermeriaDTO,
} from "@/features/patients/types";

// Obtiene todas las notas de enfermería para un episodio específico
export async function getNotasEnfermeria(
  episodioId: number,
): Promise<NotaEnfermeria[]> {
  const res = await axiosInstance.get<NotaEnfermeria[]>(
    API_ENDPOINTS.episodios.notasEnfermeria(episodioId),
  );
  return res.data;
}

// Crea una nueva nota de enfermería para un episodio específico
export async function createNotaEnfermeria(
  episodioId: number,
  dto: CreateNotaEnfermeriaDTO,
): Promise<NotaEnfermeria> {
  const res = await axiosInstance.post<NotaEnfermeria>(
    API_ENDPOINTS.episodios.notasEnfermeria(episodioId),
    dto,
  );
  return res.data;
}
