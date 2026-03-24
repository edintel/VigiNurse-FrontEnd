export enum AlertaTipo {
  ProximoMantenimiento = 0,
  ActivoEnMantenimiento = 1,
  ActivoDisponible = 2,
}

export const ALERTA_TIPO_LABELS: Record<AlertaTipo, string> = {
  [AlertaTipo.ProximoMantenimiento]: "Próximo Mantenimiento",
  [AlertaTipo.ActivoEnMantenimiento]: "Activo en Mantenimiento",
  [AlertaTipo.ActivoDisponible]: "Activo Disponible",
};

export interface Alerta {
  id: number;
  tipo: AlertaTipo;
  mensaje: string;
  fechaGeneracion: string;
  leida: boolean;
  fechaLectura: string | null;
  hospitalId: number;
  activoId: number | null;
  numeroSerieActivo: string | null;
  mantenimientoId: number | null;
  rolesDestino: string[];
}

export interface AlertaFilters {
  leida?: boolean;
  tipo?: AlertaTipo;
}

export interface AlertasPaginatedResponse {
  datos: Alerta[];
  totalRegistros: number;
  totalPaginas: number;
  paginaActual: number;
  tamanoPagina: number;
}
