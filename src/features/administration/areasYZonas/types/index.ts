export { type Area, type PaginatedAreas, type CreateAreaDTO, type UpdateAreaDTO } from "@/features/administration/areas/types";
export {
  TipoZona, EstadoZona, TipoSensor, EstadoSensor,
  TIPO_ZONA_LABELS, ESTADO_ZONA_LABELS, TIPO_SENSOR_LABELS, ESTADO_SENSOR_LABELS,
  type Zona, type Sensor, type PaginatedZonas,
  type CrearZonaDTO, type ActualizarZonaDTO,
  type CrearSensorDTO, type ActualizarSensorDTO,
} from "@/features/baby-monitoring/types/zones";

export enum EstadoGatewayBle {
  Activo = 0,
  Inactivo = 1,
  Offline = 2,
}

export const ESTADO_GATEWAY_LABELS: Record<EstadoGatewayBle, string> = {
  [EstadoGatewayBle.Activo]: "En línea",
  [EstadoGatewayBle.Inactivo]: "Inactivo",
  [EstadoGatewayBle.Offline]: "Offline",
};

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
  zonaId: number | null;
  zonaNombre: string | null;
}

export interface PaginatedGatewaysBle {
  datos: GatewayBle[];
  totalRegistros: number;
  totalPaginas: number;
  paginaActual: number;
  tamanoPagina: number;
}

export interface CreateGatewayBleDTO {
  nombre: string;
  direccionMac: string;
  descripcion?: string | null;
}

export interface UpdateGatewayBleDTO {
  nombre?: string;
  descripcion?: string;
  estado?: EstadoGatewayBle;
}

export interface AsignacionGatewayAreaDto {
  id: number;
  gatewayBleId: number;
  gatewayNombre: string;
  gatewayMac: string;
  areaId: number;
  areaNombre: string;
  fechaAsignacion: string;
  fechaDesasignacion: string | null;
  asignadoPorNombre: string;
}

export interface AsignacionGatewayZonaDto {
  id: number;
  gatewayBleId: number;
  gatewayNombre: string;
  gatewayMac: string;
  zonaId: number;
  zonaNombre: string;
  fechaAsignacion: string;
  fechaDesasignacion: string | null;
  asignadoPorNombre: string;
}
