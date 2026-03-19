export interface User {
    id: number;
    nombre: string;
    apellidos: string;
    cedula: string | null;
    email: string;
    especialidadId: number | null;
    nombreEspecialidad: string | null;
    bloqueado: boolean;
    fechaCreacion: string;
    roles: string[];
}
export interface PaginatedUsers {
    datos: User[];
    totalRegistros: number;
    totalPaginas: number;
    paginaActual: number;
    tamanoPagina: number;
}
export interface CreateUserDTO {
    nombre: string;
    apellidos: string;
    cedula: string;
    email: string;
    password: string;
    especialidadId: number | null;
    rolesIds: number[];
    hospitalId: number | null;
}
export interface UpdateUserDTO {
    nombre: string;
    apellidos: string;
    cedula: string;
    email: string;
    especialidadId: number | null;
    rolesIds: number[];
}
export interface Role {
    id: number;
    nombre: string;
    descripcion: string;
}
export interface Specialty {
    id: number;
    nombre: string;
    descripcion: string;
}
export interface UserFilters {
    nombre?: string;
    apellidos?: string;
    cedula?: string;
    email?: string;
    especialidadId?: number;
    bloqueado?: boolean;
    rol?: string;
}
