// ── Existing types ────────────────────────────────────────────────────────────
export interface PersonalMedico {
  id: number;
  nombre: string;
  apellidos: string;
  cedula: string;
  email: string;
  especialidadId: number | null;
  nombreEspecialidad: string | null;
  areaId: number | null;
  nombreArea: string | null;
  estado: EstadoDisponibilidadPersonal | null;
  hospitalId: number;
  nombreHospital: string;
  bloqueado: boolean;
  fechaCreacion: string;
  roles: string[];
}

export interface PaginatedPersonal {
  datos: PersonalMedico[];
  totalRegistros: number;
  totalPaginas: number;
  paginaActual: number;
  tamanoPagina: number;
}

export interface PersonalFilters {
  nombre?: string;
  apellidos?: string;
  cedula?: string;
  email?: string;
  especialidadId?: number;
  rol?: string;
  estado?: EstadoDisponibilidadPersonal;
  bloqueado?: boolean;
}

// ── Enums ─────────────────────────────────────────────────────────────────────
export enum TipoTurno {
  Regular = 0,
  Guardia = 1,
}

export enum EstadoAsignacion {
  Activo = 0,
  Completado = 1,
  Cancelado = 2,
}

// ── Areas ─────────────────────────────────────────────────────────────────────
export interface Area {
  id: number;
  nombre: string;
}

// ── Plantillas ────────────────────────────────────────────────────────────────
export interface PlantillaTurno {
  id: number;
  nombre: string;
  horaInicio: string;
  horaFin: string;
  cruzaMedianoche: boolean;
  areaId: number;
  nombreArea: string;
  tipoTurno: TipoTurno;
  activo: boolean;
}

export interface PlantillaFilters {
  areaId?: number;
  tipoTurno?: TipoTurno;
  activo?: boolean;
}

export interface CreatePlantillaDto {
  nombre: string;
  horaInicio: string;
  horaFin: string;
  cruzaMedianoche: boolean;
  areaId: number;
  tipoTurno: TipoTurno;
}

// ── Grupos ────────────────────────────────────────────────────────────────────
export interface GrupoPersonal {
  id: number;
  nombre: string;
  color: string;
  activo: boolean;
  cantidadMiembros: number;
}

export interface MiembroGrupo {
  usuarioId: number;
  nombre: string;
  apellidos: string;
  fechaIngreso: string;
  especialidad?: string;
}

export interface CreateGrupoDto {
  nombre: string;
  color: string;
}

export interface AddMiembroDto {
  usuarioId: number;
  fechaIngreso: string;
}

// ── Ciclos ────────────────────────────────────────────────────────────────────
export interface TurnoCiclo {
  orden: number;
  plantillaId: number;
  diasSemana: string;
}

export interface CicloRotacion {
  id: number;
  nombre: string;
  descripcion: string;
  duracionSemanas: number;
  cantidadTurnos: number;
  activo: boolean;
  turnos: TurnoCiclo[];
}

export interface CreateCicloDto {
  nombre: string;
  duracionSemanas: number;
  cantidadTurnos: number;
  descripcion: string;
  turnos: TurnoCiclo[];
}

export interface UpdateCicloDto {
  nombre: string;
  descripcion: string;
  activo: boolean;
  turnos?: { orden: number; plantillaId: number }[];
}

// ── Turnos (personal-medico) ──────────────────────────────────────────────────
export interface TurnoPersonal {
  id: number;
  usuarioId: number;
  nombreUsuario: string;
  apellidosUsuario: string;
  areaId: number;
  nombreArea: string;
  plantillaId: number | null;
  nombrePlantilla: string | null;
  fechaInicio: string;
  fechaFin: string;
  tipoTurno: TipoTurno;
  grupoCicloAsignacionId: number | null;
  nombreGrupo: string | null;
}

export interface TurnoFilters {
  usuarioId?: number;
  areaId?: number;
  tipoTurno?: TipoTurno;
  fechaDesde?: string;
  fechaHasta?: string;
}

export interface CreateTurnoManualDto {
  usuarioId: number;
  areaId: number;
  fechaInicio: string;
  fechaFin: string;
  tipoTurno: TipoTurno;
  plantillaId?: number;
}

export interface CreateTurnoRangoDto {
  usuarioId: number;
  areaId: number;
  fechaDesde: string;
  fechaHasta: string;
  diasSemana: number[];
  tipoTurno: TipoTurno;
  plantillaId?: number;
  horaInicio?: string;
  horaFin?: string;
}

export interface RangoTurnoResult {
  turnosCreados: number;
  fechaDesde: string;
  fechaHasta: string;
  diasSemana: number[];
}

// ── Asignaciones ──────────────────────────────────────────────────────────────
export interface AsignacionCiclo {
  id: number;
  grupoId: number;
  nombreGrupo: string;
  colorGrupo: string;
  cicloId: number;
  nombreCiclo: string;
  fechaInicio: string;
  fechaFin: string;
  semanaInicio: number;
  estado: EstadoAsignacion;
}

export interface AsignacionPreview {
  turnosAGenerar: number;
  semanas: Array<{
    semana: number;
    turnos: Array<{
      dia: string;
      plantillaNombre: string;
      horaInicio: string;
      horaFin: string;
    }>;
  }>;
}

export interface CreateAsignacionCicloDto {
  grupoId: number;
  cicloId: number;
  fechaInicio: string;
  semanaInicio: number;
}

export interface RenovarAsignacionDto {
  fechaInicio: string;
  semanaInicio: number;
}

// ── Pagination ────────────────────────────────────────────────────────────────
export interface Paginated<T> {
  datos: T[];
  totalRegistros: number;
  totalPaginas: number;
  paginaActual: number;
  tamanoPagina: number;
}

// ── PersonalMedicoDetalle ──────────────────────────────────────────────────────
export interface PersonalMedicoDetalle {
  id: number;
  nombre: string;
  apellidos: string;
  cedula: string | null;
  email: string;
  especialidadId: number | null;
  nombreEspecialidad: string | null;
  hospitalId: number | null;
  nombreHospital: string | null;
  areaId: number | null;
  nombreArea: string | null;
  estadoPersonal: EstadoDisponibilidadPersonal | null;
  bloqueado: boolean;
  fechaCreacion: string;
  roles: string[];
}

// ── Tasks ─────────────────────────────────────────────────────────────────────
export enum EstadoTarea {
  Pendiente = 0,
  Asignada = 1,
  Cancelada = 2,
  Completada = 3,
}

export enum PrioridadTarea {
  Baja = 0,
  Media = 1,
  Alta = 2,
}

export enum NivelCarga {
  Libre = 0,
  Baja = 1,
  Media = 2,
  Alta = 3,
  Critica = 4,
}

export enum EstadoDisponibilidadPersonal {
  Disponible = 0,
  Ocupado = 1,
  EnBreak = 2,
  FueraDeServicio = 3
}

export interface Tarea {
  id: number;
  tipoTareaId: number;
  nombreTipoTarea: string;
  descripcion: string;
  prioridad: PrioridadTarea;
  areaId: number;
  nombreArea: string;
  hospitalId: number;
  nombreHospital: string;
  estado: EstadoTarea;
  fechaCreacion: string;
  usuarioCreadorId: number;
  nombreCreador: string;
  episodioId: number | null;
}

export interface TipoTarea {
  id: number;
  nombre: string;
  descripcion: string | null;
  hospitalId: number;
  nombreHospital: string;
}

export interface AsignacionTarea {
  id: number;
  usuarioId: number;
  nombreUsuario: string;
  tareaId: number;
  descripcionTarea: string;
  asignadoPorId: number;
  nombreAsignadoPor: string;
  fechaAsignacion: string;
  hospitalId: number;
  nombreHospital: string;
}

export interface CargaTrabajo {
  id: number;
  usuarioId: number;
  nombreUsuario: string;
  hospitalId: number;
  nombreHospital: string;
  totalTareasActivas: number;
  nivelCarga: NivelCarga;
  nivelCargaDescripcion: string;
  ultimaActualizacion: string;
}

export interface SugerenciaPersonal {
  usuarioId: number;
  nombreCompleto: string;
  email: string;
  rol: string;
  especialidad: string | null;
  estado: EstadoDisponibilidadPersonal;
  estadoDescripcion: string;
  totalTareasActivas: number;
  nivelCarga: NivelCarga;
  nivelCargaDescripcion: string;
}

export interface CrearTareaDto {
  tipoTareaId: number;
  descripcion: string;
  prioridad: PrioridadTarea;
  areaId: number;
  episodioId?: number | null;
  hospitalId?: number | null;
}

export interface ActualizarEstadoTareaDto {
  estado: EstadoTarea;
}

export interface CrearAsignacionTareaDto {
  usuarioId: number;
  tareaId: number;
  hospitalId?: number | null;
}

export interface ActualizarAsignacionTareaDto {
  usuarioId: number;
}

export interface CrearTipoTareaDto {
  nombre: string;
  descripcion?: string | null;
  hospitalId?: number | null;
}

export interface ActualizarTipoTareaDto {
  nombre?: string | null;
  descripcion?: string | null;
}

export interface TareaFilters {
  tipoTareaId?: number;
  estado?: EstadoTarea;
  prioridad?: PrioridadTarea;
  areaId?: number;
  episodioId?: number;
  usuarioCreadorId?: number;
}
