import axiosInstance from "@/lib/axios";
import { API_ENDPOINTS } from "@/config/api";
import type {
  Medicacion,
  CreateMedicacionDTO,
  MedicacionFilters,
  Administracion,
  CreateAdministracionDTO,
  CambiarEstadoMedicacionDTO,
} from "@/features/patients/types";

// Obtiene la medicación de un episodio, con filtros opcionales para estado y medicamento.
export async function getMedications(
  episodioId: number,
  filters: MedicacionFilters = {},
): Promise<Medicacion[]> {
  const params: Record<string, unknown> = {};
  if (filters.estado !== undefined) params.estado = filters.estado;
  if (filters.medicamento) params.medicamento = filters.medicamento;
  const res = await axiosInstance.get<Medicacion[]>(
    API_ENDPOINTS.episodios.medicacion(episodioId),
    { params },
  );
  return res.data;
}

// Crea una nueva prescripción de medicación para un episodio específico.
export async function createMedication(
  episodioId: number,
  dto: CreateMedicacionDTO,
): Promise<Medicacion> {
  const res = await axiosInstance.post<Medicacion>(
    API_ENDPOINTS.episodios.medicacion(episodioId),
    dto,
  );
  return res.data;
}

// Obtiene las administraciones de una prescripción específica dentro de un episodio.
export async function getAdministrations(
  episodioId: number,
  prescripcionId: number,
): Promise<Administracion[]> {
  const res = await axiosInstance.get<Administracion[]>(
    API_ENDPOINTS.episodios.administraciones(episodioId, prescripcionId),
  );
  return res.data;
}

// Crea una nueva administración para una prescripción específica dentro de un episodio.
export async function createAdministration(
  episodioId: number,
  prescripcionId: number,
  dto: CreateAdministracionDTO,
): Promise<Administracion> {
  const res = await axiosInstance.post<Administracion>(
    API_ENDPOINTS.episodios.administraciones(episodioId, prescripcionId),
    dto,
  );
  return res.data;
}

// Cambia el estado de una prescripción de medicación (por ejemplo, activa, suspendida, cancelada) para un episodio específico.
export async function changeMedicationStatus(
  episodioId: number,
  prescripcionId: number,
  dto: CambiarEstadoMedicacionDTO,
): Promise<Medicacion> {
  const res = await axiosInstance.patch<Medicacion>(
    API_ENDPOINTS.episodios.medicacionEstado(episodioId, prescripcionId),
    dto,
  );
  return res.data;
}

// Verifica si hay prescripciones de medicación pendientes (activas o suspendidas) para un episodio específico y devuelve el conteo total.
export async function verifyPendingMedication(
  episodioId: number,
): Promise<number> {
  const activeMedication = await getMedications(episodioId, { estado: 0 });
  const suspendedMedication = await getMedications(episodioId, { estado: 1 });
  const pendingCount = activeMedication.length + suspendedMedication.length;
  console.log(pendingCount);
  return pendingCount;
}
