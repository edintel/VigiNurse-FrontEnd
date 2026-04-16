import axiosInstance from "@/lib/axios";
import { API_ENDPOINTS } from "@/config/api";
import type {
  EstudioImagen,
  EstudioImagenDetalle,
  EstadoEstudio,
  PaginatedEstudios,
  PacientePACSDto,
  PacientePACSOrthancCoincidenciaDto,
  EstudioOrthancDto,
} from "@/features/patients/types";

// Obtiene la lista de estudios de un paciente, con paginación y filtros opcionales
export async function getPatientStudies(
  pacienteId: number,
  pagina = 1,
  tamanio = 20,
  tipoEstudio?: string,
  estado?: EstadoEstudio,
  ordenId?: number,
): Promise<PaginatedEstudios> {
  const params: Record<string, unknown> = { pagina, tamanio };
  if (tipoEstudio) params.tipoEstudio = tipoEstudio;
  if (estado !== undefined) params.estado = estado;
  if (ordenId !== undefined) params.ordenId = ordenId;
  const res = await axiosInstance.get<PaginatedEstudios>(
    API_ENDPOINTS.imagenes.estudiosPaciente(pacienteId),
    { params },
  );
  return res.data;
}

// Obtiene el detalle de un estudio específico, incluyendo información de Orthanc si está disponible
export async function getStudyDetail(
  estudioId: number,
): Promise<EstudioImagenDetalle> {
  const res = await axiosInstance.get<EstudioImagenDetalle>(
    API_ENDPOINTS.imagenes.estudioDetalle(estudioId),
  );
  return res.data;
}

// Obtiene el paciente PACS asociado a un paciente, si existe
export async function getPacsPatient(
  pacienteId: number,
): Promise<PacientePACSDto> {
  const res = await axiosInstance.get<PacientePACSDto>(
    API_ENDPOINTS.pacs.paciente(pacienteId),
  );
  return res.data;
}

// Busca un paciente en el PACS y lo asocia al paciente local si se encuentra
export async function searchPacsPatient(
  pacienteId: number,
  hospitalId?: number,
): Promise<PacientePACSDto> {
  const params: Record<string, unknown> = {};
  if (hospitalId != null) params.hospitalId = hospitalId;
  const res = await axiosInstance.post<PacientePACSDto>(
    API_ENDPOINTS.pacs.buscar(pacienteId),
    null,
    { params },
  );
  return res.data;
}

// Obtiene las coincidencias de un paciente en el PACS, con información básica del paciente en Orthanc
export async function getPacsMatches(
  pacienteId: number,
  hospitalId?: number,
): Promise<PacientePACSOrthancCoincidenciaDto[]> {
  const params: Record<string, unknown> = {};
  if (hospitalId != null) params.hospitalId = hospitalId;
  const res = await axiosInstance.get<PacientePACSOrthancCoincidenciaDto[]>(
    API_ENDPOINTS.pacs.coincidencias(pacienteId),
    { params },
  );
  return res.data;
}

// Crea o actualiza la asociación entre un paciente local y un paciente en el PACS, guardando el ID de Orthanc
export async function createPacsPatient(
  pacienteId: number,
  hospitalId: number,
  orthancPatientId: string,
): Promise<PacientePACSDto> {
  const res = await axiosInstance.post<PacientePACSDto>(
    API_ENDPOINTS.pacs.paciente(pacienteId),
    { hospitalId, orthancPatientId },
  );
  return res.data;
}

// Obtiene la lista de estudios de un paciente desde Orthanc, con información básica de cada estudio
export async function getOrthancStudies(
  pacienteId: number,
): Promise<EstudioOrthancDto[]> {
  const res = await axiosInstance.get<EstudioOrthancDto[]>(
    API_ENDPOINTS.pacs.estudiosOrthanc(pacienteId),
  );
  return res.data;
}

export type { EstudioImagen, EstudioImagenDetalle };
