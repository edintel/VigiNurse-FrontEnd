import axiosInstance from "@/lib/axios";
import { API_ENDPOINTS } from "@/config/api";
import type {
  EpisodioActivo,
  PaginatedEpisodiosActivos,
  CreateEpisodioDTO,
  EpisodioFilters,
  EpisodioHistorial,
  PaginatedEpisodiosHistorial,
  FinalizarEpisodioDTO,
  CreateRecetaAltaDTO,
  RecetaAlta,
} from "@/features/patients/types";

// Obtiene episodios activos paginados con filtros opcionales.
export async function getEpisodiosActivos(
  page = 1,
  pageSize = 10,
  filters: EpisodioFilters = {},
): Promise<PaginatedEpisodiosActivos> {
  const params: Record<string, unknown> = { pagina: page, tamanio: pageSize };
  if (filters.nombre) params.nombre = filters.nombre;
  if (filters.cedula) params.cedula = filters.cedula;
  if (filters.areaId != null) params.areaId = filters.areaId;
  if (filters.nivelTriage != null) params.nivelTriage = filters.nivelTriage;
  const res = await axiosInstance.get<PaginatedEpisodiosActivos>(
    API_ENDPOINTS.episodios.activos,
    { params },
  );
  return res.data;
}

// Crea un nuevo episodio para un paciente.
export async function createEpisodio(
  pacienteId: number,
  dto: CreateEpisodioDTO,
): Promise<EpisodioActivo> {
  const res = await axiosInstance.post<EpisodioActivo>(
    API_ENDPOINTS.pacientes.episodios(pacienteId),
    dto,
  );
  return res.data;
}

// Obtiene el historial de episodios de un paciente paginado, con filtro opcional de rango de fechas.
export async function getEpisodiosPaciente(
  pacienteId: number,
  page = 1,
  pageSize = 20,
  filters: { fechaDesde?: string; fechaHasta?: string } = {},
): Promise<PaginatedEpisodiosHistorial> {
  const params: Record<string, unknown> = { pagina: page, tamanio: pageSize };
  if (filters.fechaDesde) params.fechaDesde = filters.fechaDesde;
  if (filters.fechaHasta) params.fechaHasta = filters.fechaHasta;
  const res = await axiosInstance.get<PaginatedEpisodiosHistorial>(
    API_ENDPOINTS.pacientes.episodios(pacienteId),
    { params },
  );
  return res.data;
}

// Obtiene el detalle completo de un episodio por su ID.
export async function getEpisodioById(id: number): Promise<EpisodioHistorial> {
  const res = await axiosInstance.get<EpisodioHistorial>(
    API_ENDPOINTS.episodios.byId(id),
  );
  return res.data;
}

// Obtiene el episodio activo de un paciente. Retorna null si no tiene episodio activo.
export async function getEpisodioActivo(
  pacienteId: number,
): Promise<EpisodioHistorial | null> {
  try {
    const res = await axiosInstance.get<EpisodioHistorial>(
      API_ENDPOINTS.pacientes.episodioActivo(pacienteId),
    );
    return res.data;
  } catch (err: unknown) {
    const status = (err as { response?: { status?: number } })?.response
      ?.status;
    if (status === 404) return null;
    throw err;
  }
}

// Finaliza un episodio activo.
export async function finalizarEpisodio(
  episodioId: number,
  dto: FinalizarEpisodioDTO,
): Promise<void> {
  await axiosInstance.patch(API_ENDPOINTS.episodios.finalizar(episodioId), dto);
}

// Crea una receta de alta para un episodio.
export async function crearRecetaAlta(
  episodioId: number,
  dto: CreateRecetaAltaDTO,
): Promise<void> {
  await axiosInstance.post(API_ENDPOINTS.episodios.recetaAlta(episodioId), dto);
}

// Obtiene la receta de alta de un episodio. Retorna null si no existe.
export async function getRecetaAlta(episodioId: number): Promise<RecetaAlta | null> {
  try {
    const res = await axiosInstance.get<RecetaAlta>(
      API_ENDPOINTS.episodios.recetaAlta(episodioId),
    );
    return res.data;
  } catch (err: unknown) {
    const status = (err as { response?: { status?: number } })?.response?.status;
    if (status === 404) return null;
    throw err;
  }
}

