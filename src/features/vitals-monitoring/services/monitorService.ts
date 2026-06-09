import axiosInstance from "@/lib/axios";
import { API_ENDPOINTS } from "@/config/api";
import type {
  MonitorPacienteDto,
  PaginatedMonitorPacientes,
  MonitorPacientesFilters,
  CrearMonitorPacienteDto,
  ActualizarUbicacionMonitorDto,
} from "@/features/vitals-monitoring/types";

function buildPaginatedResponse(
  payload: PaginatedMonitorPacientes | MonitorPacienteDto[],
  fallbackPage: number,
  fallbackPageSize: number,
): PaginatedMonitorPacientes {
  if (Array.isArray(payload)) {
    return {
      datos: payload,
      totalRegistros: payload.length,
      totalPaginas: 1,
      paginaActual: fallbackPage,
      tamanoPagina: fallbackPageSize,
    };
  }
  return payload;
}

// Obtiene una lista paginada de monitores vinculados a pacientes, con filtros opcionales.
export async function getPatientMonitors(
  page = 1,
  pageSize = 50,
  filters: MonitorPacientesFilters = {},
): Promise<PaginatedMonitorPacientes> {
  const params: Record<string, string | number | boolean> = {
    pagina: page,
    tamanio: pageSize,
  };
  if (filters.activo !== undefined) params.activo = filters.activo;

  const res = await axiosInstance.get<PaginatedMonitorPacientes | MonitorPacienteDto[]>(
    API_ENDPOINTS.monitorPacientes.list,
    { params },
  );
  return buildPaginatedResponse(res.data, page, pageSize);
}

// Obtiene los detalles de un monitor vinculado a paciente por su ID. Lanza error si no se encuentra.
export async function getPatientMonitorById(id: number): Promise<MonitorPacienteDto> {
  const res = await axiosInstance.get<MonitorPacienteDto>(
    API_ENDPOINTS.monitorPacientes.byId(id),
  );
  return res.data;
}

// Obtiene una lista paginada de monitores vinculados a un paciente específico, con manejo de respuesta flexible.
export async function getMonitorsByPatient(
  pacienteId: number,
  page = 1,
  pageSize = 50,
): Promise<PaginatedMonitorPacientes> {
  const res = await axiosInstance.get<PaginatedMonitorPacientes | MonitorPacienteDto[]>(
    API_ENDPOINTS.monitorPacientes.byPaciente(pacienteId),
    {
      params: { pagina: page, tamanio: pageSize },
    },
  );
  return buildPaginatedResponse(res.data, page, pageSize);
}

// Crea una nueva vinculación entre un paciente y un monitor, enviando los datos necesarios al backend.
export async function createPatientMonitor(
  dto: CrearMonitorPacienteDto,
): Promise<MonitorPacienteDto> {
  const res = await axiosInstance.post<MonitorPacienteDto>(
    API_ENDPOINTS.monitorPacientes.list,
    dto,
  );
  return res.data;
}

// Actualiza la ubicación (habitación y número de cama) de un monitor vinculado a paciente, enviando los cambios al backend.
export async function updateMonitorLocation(
  id: number,
  dto: ActualizarUbicacionMonitorDto,
): Promise<MonitorPacienteDto> {
  const res = await axiosInstance.put<MonitorPacienteDto>(
    API_ENDPOINTS.monitorPacientes.ubicacion(id),
    dto,
  );
  return res.data;
}

// Desasigna un monitor de un paciente, marcando la vinculación como inactiva en el backend.
export async function unassignMonitor(id: number): Promise<void> {
  await axiosInstance.patch(API_ENDPOINTS.monitorPacientes.desasignar(id));
}

// Elimina completamente la vinculación entre un paciente y un monitor, removiéndola del sistema en el backend.
export async function deletePatientMonitor(id: number): Promise<void> {
  await axiosInstance.delete(API_ENDPOINTS.monitorPacientes.byId(id));
}
