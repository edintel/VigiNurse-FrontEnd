import axiosInstance from "@/lib/axios";
import { API_ENDPOINTS } from "@/config/api";
import type {
  TurnoPersonal,
  TurnoFilters,
  CreateTurnoManualDto,
  CreateTurnoRangoDto,
  RangoTurnoResult,
  AsignacionCiclo,
  AsignacionPreview,
  CreateAsignacionCicloDto,
  RenovarAsignacionDto,
  EstadoAsignacion,
  Paginated,
} from "../types";


// Obtiene turnos con filtros y paginación
export async function getShifts(
  pagina = 1,
  tamanio = 100,
  filters?: TurnoFilters,
): Promise<Paginated<TurnoPersonal>> {
  const params: Record<string, string | number> = { pagina, tamanio };
  if (filters?.usuarioId !== undefined) params.usuarioId = filters.usuarioId;
  if (filters?.areaId !== undefined) params.areaId = filters.areaId;
  if (filters?.tipoTurno !== undefined) params.tipoTurno = filters.tipoTurno;
  if (filters?.fechaDesde) params.fechaDesde = filters.fechaDesde;
  if (filters?.fechaHasta) params.fechaHasta = filters.fechaHasta;

  const response = await axiosInstance.get<unknown>(API_ENDPOINTS.personalMedico.turnos, { params });
  const data = response.data as Record<string, unknown>;
  return {
    datos: Array.isArray(data.datos) ? (data.datos as TurnoPersonal[]) : [],
    totalRegistros: Number(data.totalRegistros) || 0,
    totalPaginas: Number(data.totalPaginas) || 1,
    paginaActual: Number(data.paginaActual) || 1,
    tamanoPagina: Number(data.tamanoPagina) || tamanio,
  };
}

// Obtiene un turno por su ID
export async function getShiftById(id: number): Promise<TurnoPersonal> {
  const response = await axiosInstance.get<TurnoPersonal>(API_ENDPOINTS.personalMedico.turnoById(id));
  return response.data;
}


// Elimina un turno por su ID
export async function deleteShift(id: number): Promise<void> {
  await axiosInstance.delete(API_ENDPOINTS.personalMedico.turnoById(id));
}


// Crea un turno manualmente
export async function createManualShift(dto: CreateTurnoManualDto): Promise<TurnoPersonal> {
  const response = await axiosInstance.post<TurnoPersonal>(API_ENDPOINTS.personalMedico.turnos, dto);
  return response.data;
}

// Crea turnos en un rango de fechas con días específicos
export async function createShiftRange(dto: CreateTurnoRangoDto): Promise<RangoTurnoResult> {
  const response = await axiosInstance.post<RangoTurnoResult>(API_ENDPOINTS.personalMedico.turnosRango, dto);
  return response.data;
}

// Obtiene assignments de cycles con filtros y paginación

export async function getAssignments(
  pagina = 1,
  tamanio = 20,
  grupoId?: number,
  estado?: EstadoAsignacion,
): Promise<Paginated<AsignacionCiclo>> {
  const params: Record<string, string | number> = { pagina, tamanio };
  if (grupoId !== undefined) params.grupoId = grupoId;
  if (estado !== undefined) params.estado = estado;
  const response = await axiosInstance.get<unknown>(API_ENDPOINTS.turnosCiclos.assignments, { params });
  const data = response.data as Record<string, unknown>;
  return {
    datos: Array.isArray(data.datos) ? (data.datos as AsignacionCiclo[]) : [],
    totalRegistros: Number(data.totalRegistros) || 0,
    totalPaginas: Number(data.totalPaginas) || 1,
    paginaActual: Number(data.paginaActual) || 1,
    tamanoPagina: Number(data.tamanoPagina) || tamanio,
  };
}

// Obtiene una asignación de ciclo por su ID
export async function getAssignmentPreview(
  grupoId: number,
  cicloId: number,
  fechaInicio: string,
  semanaInicio: number,
): Promise<AsignacionPreview> {
  const response = await axiosInstance.get<AsignacionPreview>(
    API_ENDPOINTS.turnosCiclos.asignacionPreview,
    { params: { grupoId, cicloId, fechaInicio, semanaInicio } },
  );
  return response.data;
}

// Crea una nueva asignación de ciclo
export async function createCycleAssignment(dto: CreateAsignacionCicloDto): Promise<AsignacionCiclo> {
  const response = await axiosInstance.post<AsignacionCiclo>(API_ENDPOINTS.turnosCiclos.assignments, dto);
  return response.data;
}

// Renueva una asignación de ciclo existente
export async function renewAssignment(id: number, dto: RenovarAsignacionDto): Promise<AsignacionCiclo> {
  const response = await axiosInstance.post<AsignacionCiclo>(API_ENDPOINTS.turnosCiclos.asignacionRenovar(id), dto);
  return response.data;
}

// Elimina una asignación de ciclo por su ID
export async function deleteAssignment(id: number): Promise<void> {
  await axiosInstance.delete(API_ENDPOINTS.turnosCiclos.asignacionById(id));
}
