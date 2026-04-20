// ─── Monitor-Paciente ─────────────────────────────────────────────────────────

export interface MonitorPacienteDto {
  id: number;
  pacienteId: number;
  nombrePaciente: string;
  activoId: number;
  numeroSerieActivo: string;
  tipoActivo: string;
  marcaActivo: string;
  modeloActivo: string;
  fechaAsignacion: string;
  fechaDesasignacion: string | null;
  habitacion: string | null;
  numeroCama: string | null;
  creadoPor: number;
  nombreCreador: string;
  activo: boolean;
}

export interface PaginatedMonitorPacientes {
  datos: MonitorPacienteDto[];
  totalRegistros: number;
  totalPaginas: number;
  paginaActual: number;
  tamanoPagina: number;
}

export interface MonitorPacientesFilters {
  activo?: boolean;
}

export interface CrearMonitorPacienteDto {
  pacienteId: number;
  activoId: number;
  habitacion?: string;
  numeroCama?: string;
}

export interface ActualizarUbicacionMonitorDto {
  habitacion?: string;
  numeroCama?: string;
}

// ─── Signos Vitales (SignalR payload) ─────────────────────────────────────────

export interface LecturaSignosVitales {
  pacienteId: number;
  activoId: number;
  registradoEn: string;
  frecuenciaCardiaca: number;
  spO2: number;
  presionSistolica: number;
  presionDiastolica: number;
  temperatura: number;
  frecuenciaRespiratoria: number;
}
