import axiosInstance from "@/lib/axios";
import { API_ENDPOINTS } from "@/config/api";
import type {
  OrdenMedica,
  Dato,
  CreateOrdenDTO,
  CambiarEstadoOrdenDTO,
  OrdenesFilters,
} from "@/features/patients/types";

// Obtiene las órdenes de un episodio con filtros opcionales (estado, tipo, prioridad) y paginación.
export async function getOrdenesEpisodio(
  episodioId: number,
  filters: OrdenesFilters = {},
  page = 1,
  pageSize = 20,
): Promise<OrdenMedica> {
  const params: Record<string, unknown> = { pagina: page, tamanio: pageSize };
  if (filters.estado !== undefined) params.estado = filters.estado;
  if (filters.tipo !== undefined) params.tipo = filters.tipo;
  if (filters.prioridad !== undefined) params.prioridad = filters.prioridad;
  const res = await axiosInstance.get<unknown>(
    API_ENDPOINTS.episodios.ordenes(episodioId),
    { params },
  );

  const data = res.data as unknown;
  const isRecord = (v: unknown): v is Record<string, unknown> =>
    typeof v === "object" && v !== null;
  if (isRecord(data) && Array.isArray(data.datos))
    return data as unknown as OrdenMedica;
  throw new Error("Invalid órdenes response");
}

// Crea una nueva orden médica para un episodio.
export async function createOrden(
  episodioId: number,
  dto: CreateOrdenDTO,
): Promise<Dato> {
  const res = await axiosInstance.post<Dato>(
    API_ENDPOINTS.episodios.ordenes(episodioId),
    dto,
  );
  return res.data;
}

// Cambia el estado de una orden médica (p.ej. completarla o cancelarla).
export async function cambiarEstadoOrden(
  episodioId: number,
  ordenId: number,
  dto: CambiarEstadoOrdenDTO,
): Promise<void> {
  await axiosInstance.patch(
    API_ENDPOINTS.episodios.ordenEstado(episodioId, ordenId),
    dto,
  );
}

// Retorna la cantidad de órdenes médicas pendientes (Pendiente + EnProceso) para un episodio.
export async function verifyPendingOrders(episodioId: number): Promise<number> {
  const [pendientes, enProceso] = await Promise.all([
    getOrdenesEpisodio(episodioId, { estado: 0 }, 1, 1),
    getOrdenesEpisodio(episodioId, { estado: 1 }, 1, 1),
  ]);
  return pendientes.totalRegistros + enProceso.totalRegistros;
}
