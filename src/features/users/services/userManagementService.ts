import axiosInstance from "@/lib/axios";
import { API_ENDPOINTS } from "@/config/api";
import type {
  User,
  PaginatedUsers,
  Role,
  Specialty,
  CreateUserDTO,
  UpdateUserDTO,
  UserFilters,
} from "@/features/users/types";
// Valida si el valor es un objeto no nulo.
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
// Normaliza rol.
function normalizeRole(raw: unknown): Role | null {
  if (!isRecord(raw)) return null;
  const id = raw.id;
  const nombre = raw.nombre;
  const descripcion = raw.descripcion;
  const parsedId = Number(id);
  if (
    (typeof id === "number" || typeof id === "string") &&
    Number.isFinite(parsedId) &&
    typeof nombre === "string" &&
    typeof descripcion === "string"
  ) {
    return {
      id: parsedId,
      nombre,
      descripcion,
    };
  }
  return null;
}
// Ejecuta la logica para extraer roles de la respuesta.
function extractRolesArray(payload: unknown): Role[] {
  const rolesSource = Array.isArray(payload)
    ? payload
    : isRecord(payload) && Array.isArray(payload.datos)
      ? payload.datos
      : null;
  if (!rolesSource) {
    throw new Error("Invalid roles response");
  }
  return rolesSource
    .map(normalizeRole)
    .filter((role): role is Role => role !== null);
}
// Normaliza especialidad.
function normalizeSpecialty(raw: unknown): Specialty | null {
  if (!isRecord(raw)) return null;
  const id = raw.id;
  const nombre = raw.nombre;
  const descripcion = raw.descripcion;
  const parsedId = Number(id);
  if (
    (typeof id === "number" || typeof id === "string") &&
    Number.isFinite(parsedId) &&
    typeof nombre === "string" &&
    typeof descripcion === "string"
  ) {
    return {
      id: parsedId,
      nombre,
      descripcion,
    };
  }
  return null;
}
// Ejecuta la logica para extraer especialidades de la respuesta.
function extractSpecialtiesArray(payload: unknown): Specialty[] {
  const specialtiesSource = Array.isArray(payload)
    ? payload
    : isRecord(payload) && Array.isArray(payload.datos)
      ? payload.datos
      : null;
  if (!specialtiesSource) {
    throw new Error("Invalid specialties response");
  }
  return specialtiesSource
    .map(normalizeSpecialty)
    .filter((specialty): specialty is Specialty => specialty !== null);
}
// Obtiene datos de usuarios.
export async function getUsers(
  pagina = 1,
  tamanio = 20,
  filters?: UserFilters,
): Promise<PaginatedUsers> {
  const params: Record<string, string | number | boolean> = { pagina, tamanio };
  if (filters) {
    if (filters.nombre) params.nombre = filters.nombre;
    if (filters.apellidos) params.apellidos = filters.apellidos;
    if (filters.cedula) params.cedula = filters.cedula;
    if (filters.email) params.email = filters.email;
    if (filters.especialidadId !== undefined)
      params.especialidadId = filters.especialidadId;
    if (filters.bloqueado !== undefined) params.bloqueado = filters.bloqueado;
    if (filters.rol) params.rol = filters.rol;
  }
  const response = await axiosInstance.get<unknown>(API_ENDPOINTS.admin.users, {
    params,
  });
  const data = response.data as Record<string, unknown>;
  return {
    datos: Array.isArray(data.datos) ? (data.datos as User[]) : [],
    totalRegistros: Number(data.totalRegistros) || 0,
    totalPaginas: Number(data.totalPaginas) || 1,
    paginaActual: Number(data.paginaActual) || 1,
    tamanoPagina: Number(data.tamanoPagina) || tamanio,
  };
}
// Obtiene datos de roles.
export async function getRoles(): Promise<Role[]> {
  const response = await axiosInstance.get<unknown>(API_ENDPOINTS.roles.list);
  return extractRolesArray(response.data);
}
// Obtiene datos de especialidades.
export async function getSpecialties(): Promise<Specialty[]> {
  const response = await axiosInstance.get<unknown>(
    API_ENDPOINTS.specialties.list,
  );
  return extractSpecialtiesArray(response.data);
}
// Crea usuario.
export async function createUser(dto: CreateUserDTO): Promise<User> {
  const response = await axiosInstance.post<User>(
    API_ENDPOINTS.admin.users,
    dto,
  );
  return response.data;
}
// Actualiza usuario.
export async function updateUser(
  id: number,
  dto: UpdateUserDTO,
): Promise<User> {
  const response = await axiosInstance.patch<User>(
    API_ENDPOINTS.admin.user(id),
    dto,
  );
  return response.data;
}
// Ejecuta la logica para bloquear usuario.
export async function blockUser(id: number): Promise<void> {
  await axiosInstance.patch(API_ENDPOINTS.admin.block(id));
}
// Ejecuta la logica para desbloquear usuario.
export async function unblockUser(id: number): Promise<void> {
  await axiosInstance.patch(API_ENDPOINTS.admin.unblock(id));
}
