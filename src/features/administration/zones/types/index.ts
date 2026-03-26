export interface Zona {
  id: number;
  nombre: string;
  descripcion: string;
  esSegura: boolean;
  sensor: string;
}

export interface PaginatedZonas {
  datos: Zona[];
  totalRegistros: number;
  totalPaginas: number;
  paginaActual: number;
  tamanoPagina: number;
}

export interface CreateZonaDTO {
  nombre: string;
  descripcion: string;
  esSegura: boolean;
  sensor: string;
}

export interface UpdateZonaDTO {
  nombre: string;
  descripcion: string;
  esSegura: boolean;
  sensor: string;
}
