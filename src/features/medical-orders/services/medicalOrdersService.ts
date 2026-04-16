import axiosInstance from "@/lib/axios";
import { API_ENDPOINTS } from "@/config/api";
import type {
  PaginatedOrdenesGlobales,
  ArchivoOrdenDto,
  CrearEstudioImagenDto,
  EstudioImagen,
} from "@/features/patients/types";

export async function getMedicalOrders(
  pagina = 1,
  tamanio = 20,
  tipo?: number,
  prioridad?: number,
): Promise<PaginatedOrdenesGlobales> {
  const params: Record<string, unknown> = { pagina, tamanio };
  if (tipo != null) params.tipo = tipo;
  if (prioridad != null) params.prioridad = prioridad;
  const res = await axiosInstance.get<PaginatedOrdenesGlobales>(
    API_ENDPOINTS.ordenesGlobales.list,
    { params },
  );
  return res.data;
}

export async function getOrderAttachments(
  ordenId: number,
): Promise<ArchivoOrdenDto[]> {
  const res = await axiosInstance.get<ArchivoOrdenDto[]>(
    API_ENDPOINTS.ordenesGlobales.archivos(ordenId),
  );
  return res.data;
}

export async function uploadOrderAttachment(
  ordenId: number,
  archivo: File,
): Promise<ArchivoOrdenDto> {
  const form = new FormData();
  form.append("archivo", archivo);
  const res = await axiosInstance.post<ArchivoOrdenDto>(
    API_ENDPOINTS.ordenesGlobales.archivos(ordenId),
    form,
    { headers: { "Content-Type": "multipart/form-data" } },
  );
  return res.data;
}

export async function downloadOrderAttachment(archivoId: number): Promise<Blob> {
  const res = await axiosInstance.get<Blob>(
    API_ENDPOINTS.ordenesGlobales.archivoDescargar(archivoId),
    { responseType: "blob" },
  );
  return res.data;
}

export async function deleteOrderAttachment(archivoId: number): Promise<void> {
  await axiosInstance.delete(
    API_ENDPOINTS.ordenesGlobales.archivoEliminar(archivoId),
  );
}

export async function linkPACSStudy(
  ordenId: number,
  dto: CrearEstudioImagenDto,
): Promise<EstudioImagen> {
  const res = await axiosInstance.post<EstudioImagen>(
    API_ENDPOINTS.ordenesGlobales.vincularEstudio(ordenId),
    dto,
  );
  return res.data;
}
