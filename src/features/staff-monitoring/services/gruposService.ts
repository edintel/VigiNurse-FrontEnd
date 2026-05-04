import axiosInstance from "@/lib/axios";
import { API_ENDPOINTS } from "@/config/api";
import type { GrupoPersonal, MiembroGrupo, CreateGrupoDto, AddMiembroDto, Paginated } from "../types";

// Obtiene una lista paginada de grupos de personal médico, con opción de filtrar por estado activo.
export async function getGrupos(
  pagina = 1,
  tamanio = 20,
  activo?: boolean,
): Promise<Paginated<GrupoPersonal>> {
  const params: Record<string, string | number | boolean> = { pagina, tamanio };
  if (activo !== undefined) params.activo = activo;
  const response = await axiosInstance.get<unknown>(API_ENDPOINTS.personalMedico.grupos, { params });
  const data = response.data as Record<string, unknown>;
  return {
    datos: Array.isArray(data.datos)
      ? (data.datos as Array<Record<string, unknown>>).map((g) => ({
          ...g,
          cantidadMiembros: (g.cantidadMiembros as number) ?? (g.totalMiembros as number) ?? 0,
        })) as GrupoPersonal[]
      : [],
    totalRegistros: Number(data.totalRegistros) || 0,
    totalPaginas: Number(data.totalPaginas) || 1,
    paginaActual: Number(data.paginaActual) || 1,
    tamanoPagina: Number(data.tamanoPagina) || tamanio,
  };
}

// Obtiene los detalles de un grupo de personal médico por su ID.
export async function getGrupoById(id: number): Promise<GrupoPersonal> {
  const response = await axiosInstance.get<GrupoPersonal>(API_ENDPOINTS.personalMedico.grupoById(id));
  return response.data;
}

// Crea un nuevo grupo de personal médico con los datos proporcionados.
export async function createGrupo(dto: CreateGrupoDto): Promise<GrupoPersonal> {
  const response = await axiosInstance.post<GrupoPersonal>(API_ENDPOINTS.personalMedico.grupos, dto);
  return response.data;
}

// Actualiza un grupo de personal médico existente con los datos proporcionados. Permite actualizar el nombre, color y estado activo.
export async function updateGrupo(id: number, dto: Partial<CreateGrupoDto> & { activo?: boolean }): Promise<GrupoPersonal> {
  const response = await axiosInstance.put<GrupoPersonal>(API_ENDPOINTS.personalMedico.grupoById(id), dto);
  return response.data;
}

// Elimina un grupo de personal médico por su ID.
export async function deleteGrupo(id: number): Promise<void> {
  await axiosInstance.delete(API_ENDPOINTS.personalMedico.grupoById(id));
}

// Obtiene la lista de miembros de un grupo de personal médico por el ID del grupo.
export async function getGrupoMiembros(grupoId: number): Promise<MiembroGrupo[]> {
  const response = await axiosInstance.get<unknown>(API_ENDPOINTS.personalMedico.grupoMiembros(grupoId));
  const data = response.data;
  return Array.isArray(data) ? (data as MiembroGrupo[]) : [];
}

// Agrega un nuevo miembro a un grupo de personal médico utilizando el ID del grupo y los datos del nuevo miembro.
export async function addMiembro(grupoId: number, dto: AddMiembroDto): Promise<void> {
  await axiosInstance.post(API_ENDPOINTS.personalMedico.grupoMiembros(grupoId), dto);
}

// Elimina un miembro de un grupo de personal médico utilizando el ID del grupo y el ID del usuario.
export async function removeMiembro(grupoId: number, usuarioId: number): Promise<void> {
  await axiosInstance.delete(API_ENDPOINTS.personalMedico.grupoMiembroById(grupoId, usuarioId));
}

// Función de conveniencia para obtener todos los grupos activos sin necesidad de manejar la paginación.
export async function getAllGruposActivos(): Promise<GrupoPersonal[]> {
  const result = await getGrupos(1, 200, true);
  return result.datos;
}
