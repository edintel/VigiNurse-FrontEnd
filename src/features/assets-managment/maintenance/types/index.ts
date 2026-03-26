export enum MantenimientoTipo {
  Preventivo = 0,
  Correctivo = 1,
}

export enum MantenimientoEstado {
  Programado = 0,
  EnProceso = 1,
  Finalizado = 2,
  Cancelado = 3,
}

export interface Mantenimiento {
  id: number;
  activoId: number;
  tipo: MantenimientoTipo;
  tipoNombre: string;
  razon: string;
  fechaProgramada: string;
  responsableId: number;
  nombreResponsable: string;
  estado: MantenimientoEstado;
  estadoNombre: string;
  fechaInicio?: string | null;
  fechaFin?: string | null;
  activoNumeroSerie?: string | null;
  resultado?: string | null;
  fechaEjecucion?: string | null;
  fechaFinalizacion?: string | null;
  nombreProgramador?: string | null;
  fechaCreacion?: string | null;
  activoAreaId?: number | null;
  activoAreaNombre?: string | null;
  razonCancelacion?: string | null;
  fechaCancelacion?: string | null;
}

export interface PaginatedMantenimientos {
  datos: Mantenimiento[];
  totalRegistros: number;
  totalPaginas: number;
  paginaActual: number;
}

export interface CreateMantenimientoDTO {
  tipo: MantenimientoTipo;
  razon: string;
  fechaProgramada: string;
  responsableId: number;
}

export interface UpdateMantenimientoDTO {
  tipo: MantenimientoTipo;
  razon: string;
  fechaProgramada: string;
  responsableId: number;
}

export interface MantenimientoFilters {
  estado?: number;
  tipo?: number;
  responsableId?: number;
}

export interface CalendarioFilters {
  areaId?: number;
  estado?: number;
  tipo?: number;
  responsableId?: number;
}

export interface ChangeEstadoDTO {
  nuevoEstado: number;
  resultado?: string | null;
  nuevoEstadoActivo?: number | null;
  razonCancelacion?: string | null;
}
