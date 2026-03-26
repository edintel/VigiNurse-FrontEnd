import axiosInstance from "@/lib/axios";
import { API_ENDPOINTS } from "@/config/api";
import type {
  Alerta,
  AlertaFilters,
  AlertasPaginatedResponse,
} from "@/features/alerts/maintenance/types";

const PAGE_SIZE = 10;

// Obtiene una lista paginada de alertas, con filtros opcionales para leídas y tipo de alerta.
export async function getAlertas(
  pagina: number,
  filters: AlertaFilters = {},
): Promise<AlertasPaginatedResponse> {
  const params: Record<string, string | number | boolean> = {
    pagina,
    tamanio: PAGE_SIZE,
  };
  if (filters.leida !== undefined) params.leida = filters.leida;
  if (filters.tipo !== undefined) params.tipo = filters.tipo;

  const res = await axiosInstance.get<AlertasPaginatedResponse>(
    API_ENDPOINTS.alertas.list,
    { params },
  );
  return res.data;
}

// Marca una alerta como leída.
export async function marcarAlertaLeida(id: number): Promise<Alerta> {
  const res = await axiosInstance.patch<Alerta>(API_ENDPOINTS.alertas.leer(id));
  return res.data;
}
