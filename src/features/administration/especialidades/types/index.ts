export interface Especialidad {
    id: number;
    nombre: string;
    descripcion: string;
}
export interface PaginatedEspecialidades {
    datos: Especialidad[];
    totalRegistros: number;
    totalPaginas: number;
    paginaActual: number;
    tamanoPagina: number;
}
export interface CreateEspecialidadDTO {
    nombre: string;
    descripcion: string;
}
export interface UpdateEspecialidadDTO {
    nombre: string;
    descripcion: string;
}
