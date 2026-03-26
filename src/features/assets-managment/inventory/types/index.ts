export enum ActivoEstado {
  Disponible = 0,
  Mantenimiento = 1,
  Retirado = 2,
}

export const ACTIVO_ESTADO_LABELS: Record<ActivoEstado, string> = {
  [ActivoEstado.Disponible]: "Disponible",
  [ActivoEstado.Mantenimiento]: "Mantenimiento",
  [ActivoEstado.Retirado]: "Retirado",
};

export interface Activo {
  id: number;
  numeroSerie: string;
  tipoActivoId: number;
  tipoActivoNombre: string;
  marca: string;
  modelo: string;
  estado: ActivoEstado;
  estadoNombre: string;
  esCritico: boolean;
  rfidCodigo: string | null;
  qrCodigo: string | null;
  creadoPor: number;
  nombreCreador: string;
  fechaCreacion: string;
  areaId: number;
  areaNombre: string;
  motivoRetiro: string | null;
  retiradoPor: number | null;
  nombreRetiro: string | null;
  fechaRetiro: string | null;
}

export interface PaginatedActivos {
  datos: Activo[];
  totalRegistros: number;
  totalPaginas: number;
  paginaActual: number;
  tamanoPagina: number;
}

export interface CreateActivoDTO {
  numeroSerie: string;
  tipoActivoId: number;
  marca: string;
  modelo: string;
  estado: ActivoEstado;
  esCritico: boolean;
  rfidCodigo: string | null;
  areaId: number;
  hospitalId: null;
}

export interface UpdateActivoDTO {
  numeroSerie: string;
  tipoActivoId: number;
  marca: string;
  modelo: string;
  estado: ActivoEstado;
  esCritico: boolean;
  rfidCodigo: string | null;
  areaId: number;
}

export interface RetirarActivoDTO {
  motivoRetiro: string;
}

export interface ActivoFilters {
  estado?: ActivoEstado | null;
  tipoId?: number | null;
  areaId?: number | null;
  numeroSerie?: string;
  marca?: string;
  modelo?: string;
}
