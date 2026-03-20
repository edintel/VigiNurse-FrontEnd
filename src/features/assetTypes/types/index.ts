export interface TipoActivo {
  id: number;
  nombre: string;
  descripcion: string;
}

export interface PaginatedTiposActivos {
  datos: TipoActivo[];
  totalRegistros: number;
  totalPaginas: number;
  paginaActual: number;
  tamanoPagina: number;
}

export interface CreateTipoActivoDTO {
  nombre: string;
  descripcion: string;
}

export interface UpdateTipoActivoDTO {
  nombre: string;
  descripcion: string;
}
