export interface Area {
  id: number;
  hospitalId: number;
  hospitalNombre: string;
  nombre: string;
}

export interface PaginatedAreas {
  datos: Area[];
  totalRegistros: number;
  totalPaginas: number;
  paginaActual: number;
  tamanoPagina: number;
}

export interface CreateAreaDTO {
  nombre: string;
}

export interface UpdateAreaDTO {
  nombre: string;
}
