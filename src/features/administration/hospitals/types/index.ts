export interface Hospital {
    id: number;
    nombre: string;
}
export interface PaginatedHospitals {
    datos: Hospital[];
    totalRegistros: number;
    totalPaginas: number;
    paginaActual: number;
    tamanoPagina: number;
}
export interface CreateHospitalDTO {
    nombre: string;
}
export interface UpdateHospitalDTO {
    nombre: string;
}
