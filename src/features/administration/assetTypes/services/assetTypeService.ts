import axiosInstance from "@/lib/axios";
import { API_ENDPOINTS } from "@/config/api";
import type {
  TipoActivo,
  PaginatedTiposActivos,
  CreateTipoActivoDTO,
  UpdateTipoActivoDTO,
} from "@/features/administration/assetTypes/types";

// Obtiene tipos de activo paginados.
export async function getAssetTypes(
  page = 1,
  pageSize = 10,
): Promise<PaginatedTiposActivos> {
  const res = await axiosInstance.get<PaginatedTiposActivos>(
    API_ENDPOINTS.tiposActivos.list,
    { params: { pagina: page, tamanio: pageSize } },
  );
  return res.data;
}

// Obtiene un tipo de activo por su ID.
export async function getAssetTypeById(id: number): Promise<TipoActivo> {
  const res = await axiosInstance.get<TipoActivo>(
    API_ENDPOINTS.tiposActivos.byId(id),
  );
  return res.data;
}

// Crea un tipo de activo.
export async function createAssetType(
  dto: CreateTipoActivoDTO,
): Promise<TipoActivo> {
  const res = await axiosInstance.post<TipoActivo>(
    API_ENDPOINTS.tiposActivos.list,
    dto,
  );
  return res.data;
}

// Actualiza un tipo de activo.
export async function updateAssetType(
  id: number,
  dto: UpdateTipoActivoDTO,
): Promise<TipoActivo> {
  const res = await axiosInstance.put<TipoActivo>(
    API_ENDPOINTS.tiposActivos.byId(id),
    dto,
  );
  return res.data;
}
