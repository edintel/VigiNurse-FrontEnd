import { Sexo } from "@/features/patients/types";

export enum TipoAlimentacion {
  LecheMaterna = 0,
  Formula = 1,
  Mixta = 2,
  SondaNasogastrica = 3,
}

export const TIPO_ALIMENTACION_LABELS: Record<TipoAlimentacion, string> = {
  [TipoAlimentacion.LecheMaterna]: "Leche materna",
  [TipoAlimentacion.Formula]: "Fórmula",
  [TipoAlimentacion.Mixta]: "Mixta",
  [TipoAlimentacion.SondaNasogastrica]: "Sonda nasogástrica",
};

export interface RegistroAlimentacion {
  id: number;
  episodioId: number;
  tipoAlimentacion: TipoAlimentacion;
  cantidadMl: number;
  fecha: string;
  alimentadoPorId: number;
  alimentadoPorNombre: string;
}

export interface CreateRegistroAlimentacionDTO {
  tipoAlimentacion: TipoAlimentacion;
  cantidadMl: number;
  fecha?: string | null;
}

export interface UpdateRegistroAlimentacionDTO {
  tipoAlimentacion?: TipoAlimentacion | null;
  cantidadMl?: number | null;
  fecha?: string | null;
}

export interface RegistroCuidado {
  id: number;
  episodioId: number;
  observaciones: string;
  fecha: string;
  hechoPorId: number;
  hechoPorNombre: string;
}

export interface CreateRegistroCuidadoDTO {
  observaciones: string;
  fecha?: string | null;
}

export interface UpdateRegistroCuidadoDTO {
  observaciones?: string | null;
  fecha?: string | null;
}

export interface Bebe {
  id: number;
  pacienteId: number;
  episodioId: number;
  nombre: string;
  apellidos: string;
  fechaNacimiento: string;
  sexo: string; // "Masculino" | "Femenino" — backend devuelve string
  tipoSangre: string | null;
  madreId: number | null;
  nombreMadre: string | null;
  apellidosMadre: string | null;
  peso: number;
  tamano: number;
  puntuacionApgar: number;
  semanasGestacion: number;
  fechaRegistro: string;
  activo: boolean;
  fechaAlta: string | null;
  dadoDeAltaPorNombre: string | null;
}

export interface PaginatedBebes {
  datos: Bebe[];
  totalRegistros: number;
  totalPaginas: number;
  paginaActual: number;
  tamanoPagina: number;
}

export interface DarDeAltaBebeDTO {
  observaciones?: string | null;
}

export interface CreateBebeDTO {
  nombre: string;
  apellidos: string;
  fechaNacimiento: string;
  sexo: Sexo;
  tipoSangre?: string | null;
  madreId?: number | null;
  peso: number;
  tamano: number;
  puntuacionApgar: number;
  semanasGestacion: number;
  areaId: number;
  hospitalId?: number | null;
}

// ─── Ubicación y Brazalete ─────────────────────────────────────────────────────

export enum EstadoBrazalete {
  Disponible = 0,
  Activo = 1,
  Inactivo = 2,
  Perdido = 3,
  Danado = 4,
  Mantenimiento = 5,
}

export const ESTADO_BRAZALETE_LABELS: Record<EstadoBrazalete, string> = {
  [EstadoBrazalete.Disponible]: "Disponible",
  [EstadoBrazalete.Activo]: "Activo",
  [EstadoBrazalete.Inactivo]: "Inactivo",
  [EstadoBrazalete.Perdido]: "Perdido",
  [EstadoBrazalete.Danado]: "Dañado",
  [EstadoBrazalete.Mantenimiento]: "Mantenimiento",
};

export interface Brazalete {
  id: number;
  codigo: string;
  direccionMac: string;
  descripcion: string | null;
  estado: EstadoBrazalete;
  nivelBateria: number | null;
  ultimaSenal: string | null;
  fechaCreacion: string;
}

export interface PaginatedBrazaletes {
  datos: Brazalete[];
  totalRegistros: number;
  totalPaginas: number;
  paginaActual: number;
  tamanoPagina: number;
}

export interface AsignacionBrazalete {
  id: number;
  brazaleteId: number;
  brazaleteMac: string;
  pacienteId: number;
  pacienteNombre: string;
  episodioId: number;
  fechaAsignacion: string;
  asignadoPorNombre: string;
  fechaDesasignacion: string | null;
  desasignadoPorNombre: string | null;
  motivoDesasignacion: string | null;
  activa: boolean;
}

export enum EstadoUbicacionBebe {
  Normal = 0,
  Warning = 1,
  Critical = 2,
  NoSignal = 3,
}

export interface UbicacionBebe {
  bebeId: number;
  brazaleteId: number | null;
  codigoBrazalete: string | null;
  macBrazalete: string | null;
  nivelBateria: number | null;
  ultimaZonaId: number | null;
  ultimaZonaNombre: string | null;
  ultimoSensorId: number | null;
  ultimoSensorNombre: string | null;
  ultimaDeteccion: string | null;
  estadoActual: EstadoUbicacionBebe;
  mensajeEstado: string;
}

// Payload: POST /api/bebes/{id}/asignar-brazalete
export interface AsignarBrazaleteABebeDTO {
  codigoBrazalete: string;
}

// Payload: POST /api/bebes/{id}/desasignar-brazalete
// estadoSiguienteBrazalete solo permite Disponible=0 o Mantenimiento=5
export interface DesasignarBrazaleteABebeDTO {
  razon?: string | null;
  estadoSiguienteBrazalete: EstadoBrazalete;
}

export interface AsignarBrazaleteABebeResponse {
  asignacionActiva: AsignacionBrazalete;
  bebe: Bebe;
  brazalete: Brazalete;
}

export interface DesasignarBrazaleteABebeResponse {
  asignacionCerrada: AsignacionBrazalete;
  bebe: Bebe;
  brazalete: Brazalete;
}

export enum TipoEventoRastreo {
  Deteccion = 0,
  EntradaZona = 1,
  SalidaZona = 2,
  FueraDeCobertura = 3,
  SenalDebil = 4,
  EtiquetaDesconocida = 5,
  SensorDesconocido = 6,
}

export const TIPO_EVENTO_RASTREO_LABELS: Record<TipoEventoRastreo, string> = {
  [TipoEventoRastreo.Deteccion]: "Detección",
  [TipoEventoRastreo.EntradaZona]: "Entrada a zona",
  [TipoEventoRastreo.SalidaZona]: "Salida de zona",
  [TipoEventoRastreo.FueraDeCobertura]: "Fuera de cobertura",
  [TipoEventoRastreo.SenalDebil]: "Señal débil",
  [TipoEventoRastreo.EtiquetaDesconocida]: "Etiqueta desconocida",
  [TipoEventoRastreo.SensorDesconocido]: "Sensor desconocido",
};

export interface EventoRastreo {
  id: number;
  brazaleteId: number | null;
  brazaleteMac: string | null;
  gatewayBleId: number | null;
  gatewayMac: string | null;
  zonaId: number | null;
  zonaNombre: string | null;
  tipoEvento: TipoEventoRastreo;
  rssiDbm: number | null;
  nivelBateria: number | null;
  payloadBruto: string;
  fechaEvento: string;
  fechaProcesado: string;
}

export interface PaginatedEventosRastreo {
  datos: EventoRastreo[];
  totalRegistros: number;
  totalPaginas: number;
  paginaActual: number;
  tamanoPagina: number;
}

// Payload: POST /api/ble/brazaletes
export interface CrearBrazaleteDTO {
  codigo: string;
  direccionMac: string;
  descripcion?: string | null;
}

// Payload: PUT /api/ble/brazaletes/{id}
// NO actualiza: codigo, direccionMac, estado
export interface ActualizarBrazaleteDTO {
  descripcion?: string | null;
}

// Payload: PATCH /api/ble/brazaletes/{id}/status
// No se puede usar para poner estado Activo=1 — lo asigna el sistema automáticamente
export interface CambiarEstadoBrazaleteDTO {
  estado: EstadoBrazalete;
  motivo?: string | null;
}

// ─── Alertas BLE ───────────────────────────────────────────────────────────────

export enum TipoAlertaBLE {
  ZonaNoPermitida = 0,
  FueraDeCobertura = 1,
  MovimientoNoAutorizado = 2,
  BrazaleteSinAsignacion = 3,
  SenalDebil = 4,
  BrazaleteDanado = 5,
  SalidaDetectada = 6,
  BateriaBaja = 7,
}

export const TIPO_ALERTA_BLE_LABELS: Record<TipoAlertaBLE, string> = {
  [TipoAlertaBLE.ZonaNoPermitida]: "Zona no permitida",
  [TipoAlertaBLE.FueraDeCobertura]: "Fuera de cobertura",
  [TipoAlertaBLE.MovimientoNoAutorizado]: "Movimiento no autorizado",
  [TipoAlertaBLE.BrazaleteSinAsignacion]: "Brazalete sin asignación",
  [TipoAlertaBLE.SenalDebil]: "Señal débil",
  [TipoAlertaBLE.BrazaleteDanado]: "Brazalete dañado",
  [TipoAlertaBLE.SalidaDetectada]: "Salida detectada",
  [TipoAlertaBLE.BateriaBaja]: "Batería baja",
};

export enum SeveridadAlerta {
  Critica = 0,
  Alta = 1,
  Media = 2,
  Baja = 3,
}

export const SEVERIDAD_ALERTA_LABELS: Record<SeveridadAlerta, string> = {
  [SeveridadAlerta.Critica]: "Crítica",
  [SeveridadAlerta.Alta]: "Alta",
  [SeveridadAlerta.Media]: "Media",
  [SeveridadAlerta.Baja]: "Baja",
};

export enum EstadoAlertaBLE {
  Abierta = 0,
  Reconocida = 1,
  Cerrada = 2,
}

export const ESTADO_ALERTA_BLE_LABELS: Record<EstadoAlertaBLE, string> = {
  [EstadoAlertaBLE.Abierta]: "Abierta",
  [EstadoAlertaBLE.Reconocida]: "Reconocida",
  [EstadoAlertaBLE.Cerrada]: "Cerrada",
};

export interface AlertaBrazalete {
  id: number;
  tipo: TipoAlertaBLE;
  severidad: SeveridadAlerta;
  estado: EstadoAlertaBLE;
  brazaleteId: number;
  brazaleteMac: string;
  pacienteId: number | null;
  pacienteNombre: string | null;
  episodioId: number | null;
  gatewayBleId: number | null;
  eventoRastreoId: number | null;
  zonaId: number | null;
  zonaNombre: string | null;
  descripcion: string;
  fechaCreacion: string;
  ultimaActualizacion: string;
  reconocidaPorNombre: string | null;
  fechaReconocimiento: string | null;
  cerradaPorNombre: string | null;
  fechaCierre: string | null;
  notasCierre: string | null;
}

export interface PaginatedAlertas {
  datos: AlertaBrazalete[];
  totalRegistros: number;
  totalPaginas: number;
  paginaActual: number;
  tamanoPagina: number;
}

export interface CloseAlertDTO {
  notasCierre?: string | null;
}

