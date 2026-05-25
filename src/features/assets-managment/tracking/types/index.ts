export enum EstadoTagBle {
  Activo = 0,
  Inactivo = 1,
  Perdido = 2,
}

export enum EstadoGatewayBle {
  Activo = 0,
  Inactivo = 1,
  Offline = 2,
}

export interface TagBle {
  id: number;
  codigo: string;
  direccionMac: string;
  descripcion: string | null;
  estado: EstadoTagBle;
  estadoNombre: string;
  nivelBateria: number | null;
  ultimaSenal: string | null;
  fechaCreacion: string;
  activoId: number | null;
  activoDescripcion: string | null;
}

export interface GatewayBle {
  id: number;
  nombre: string;
  direccionMac: string;
  descripcion: string | null;
  estado: EstadoGatewayBle;
  estadoNombre: string;
  ultimaConexion: string | null;
  fechaCreacion: string;
  areaId: number | null;
  areaNombre: string | null;
}

export interface PaginatedTagsBle {
  datos: TagBle[];
  totalRegistros: number;
  totalPaginas: number;
  paginaActual: number;
}

export interface PaginatedGatewaysBle {
  datos: GatewayBle[];
  totalRegistros: number;
  totalPaginas: number;
  paginaActual: number;
}

export interface CreateTagBleDTO {
  codigo: string;
  direccionMac: string;
  descripcion?: string;
}

export interface UpdateTagBleDTO {
  codigo?: string;
  descripcion?: string;
  estado?: EstadoTagBle;
}

export interface CreateGatewayBleDTO {
  nombre: string;
  direccionMac: string;
  descripcion?: string;
}

export interface UpdateGatewayBleDTO {
  nombre?: string;
  descripcion?: string;
  estado?: EstadoGatewayBle;
}

export interface TagBleFilters {
  estado?: EstadoTagBle | null;
  codigo?: string;
}

export interface GatewayBleFilters {
  estado?: EstadoGatewayBle | null;
  nombre?: string;
}

export interface AsignacionTagActivoDto {
  id: number;
  tagBleId: number;
  tagCodigo: string;
  tagMac: string;
  activoId: number;
  activoNumeroSerie: string;
  activoMarca: string;
  activoModelo: string;
  fechaAsignacion: string;
  fechaDesasignacion: string | null;
  asignadoPorNombre: string;
  desasignadoPorNombre: string | null;
}

export interface UbicacionActivoDto {
  id: number;
  tagBleId: number;
  tagCodigo: string;
  tagMac: string;
  activoId: number | null;
  activoNumeroSerie: string | null;
  activoMarca: string | null;
  activoModelo: string | null;
  activoTipo: string | null;
  macGateway: string;
  gatewayBleId: number | null;
  gatewayNombre: string | null;
  areaId: number | null;
  areaNombre: string | null;
  rssi: number;
  timestamp: string;
  temperatura: number | null;
  humedad: number | null;
  bateria: number | null;
  ultimaActualizacion: string;
}
