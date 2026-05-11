export enum TipoZona {
  Segura = 0,
  Transito = 1,
  Salida = 2,
  Restringida = 3,
}

export const TIPO_ZONA_LABELS: Record<TipoZona, string> = {
  [TipoZona.Segura]: "Segura",
  [TipoZona.Transito]: "Tránsito",
  [TipoZona.Salida]: "Salida",
  [TipoZona.Restringida]: "Restringida",
};

export enum EstadoZona {
  Activa = 0,
  Inactiva = 1,
}

export const ESTADO_ZONA_LABELS: Record<EstadoZona, string> = {
  [EstadoZona.Activa]: "Activa",
  [EstadoZona.Inactiva]: "Inactiva",
};

export enum TipoSensor {
  BleAnchor = 0,
  Gateway = 1,
  SensorPuerta = 2,
}

export const TIPO_SENSOR_LABELS: Record<TipoSensor, string> = {
  [TipoSensor.BleAnchor]: "BLE Anchor",
  [TipoSensor.Gateway]: "Gateway",
  [TipoSensor.SensorPuerta]: "Sensor de puerta",
};

export enum EstadoSensor {
  Activo = 0,
  Inactivo = 1,
  Falla = 2,
  Mantenimiento = 3,
}

export const ESTADO_SENSOR_LABELS: Record<EstadoSensor, string> = {
  [EstadoSensor.Activo]: "Activo",
  [EstadoSensor.Inactivo]: "Inactivo",
  [EstadoSensor.Falla]: "Falla",
  [EstadoSensor.Mantenimiento]: "Mantenimiento",
};

export interface Sensor {
  id: number;
  codigo: string;
  nombre: string;
  tipo: TipoSensor;
  direccionMac: string;
  ubicacionDescripcion: string | null;
  zonaId: number;
  zonaNombre: string;
  zonaTipo: TipoZona;
  estado: EstadoSensor;
  ultimaSenal: string | null;
  fechaInstalacion: string;
}

export interface Zona {
  id: number;
  nombre: string;
  descripcion: string | null;
  tipo: TipoZona;
  estado: EstadoZona;
  esSegura: boolean;
  sensor: string | null;
  hospitalId: number;
  sensores?: Sensor[] | null;
}

export interface PaginatedZonas {
  datos: Zona[];
  totalRegistros: number;
  totalPaginas: number;
  paginaActual: number;
  tamanoPagina: number;
}

export interface CrearZonaDTO {
  hospitalId?: number | null;
  nombre: string;
  descripcion?: string | null;
  tipo: TipoZona;
  estado: EstadoZona;
  esSegura: boolean;
  sensor?: string | null;
}

export interface ActualizarZonaDTO {
  nombre: string;
  descripcion?: string | null;
  tipo: TipoZona;
  estado?: EstadoZona | null;
  esSegura: boolean;
  sensor?: string | null;
}

export interface CrearSensorDTO {
  codigo: string;
  nombre: string;
  tipo: TipoSensor;
  direccionMac: string;
  ubicacionDescripcion?: string | null;
  zonaId: number;
  fechaInstalacion: string;
}

export interface ActualizarSensorDTO {
  nombre?: string | null;
  tipo?: TipoSensor | null;
  ubicacionDescripcion?: string | null;
  zonaId?: number | null;
  estado?: EstadoSensor | null;
}

export interface ZonaPermitidaBebe {
  id: number;
  pacienteId: number;
  pacienteNombre: string;
  episodioId: number;
  zonaId: number;
  zonaNombre: string;
  autorizadoPorNombre: string;
  fechaInicio: string;
  fechaFin: string | null;
  activa: boolean;
}

export interface CrearZonaPermitidaBebeDTO {
  pacienteId: number;
  episodioId: number;
  zonaId: number;
  fechaFin?: string | null;
}
