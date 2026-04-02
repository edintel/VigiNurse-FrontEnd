// ─── Paciente ────────────────────────────────────────────────────────────────

export enum Sexo {
  Masculino = 0,
  Femenino = 1,
}

export const SEXO_LABELS: Record<Sexo, string> = {
  [Sexo.Masculino]: "Masculino",
  [Sexo.Femenino]: "Femenino",
};

export const TIPOS_SANGRE = [
  "O+",
  "O-",
  "A+",
  "A-",
  "B+",
  "B-",
  "AB+",
  "AB-",
] as const;

export interface Paciente {
  id: number;
  usuarioId: number | null;
  cedula: string;
  nombre: string;
  apellidos: string;
  fechaNacimiento: string;
  sexo: Sexo;
  tipoSangre: string;
  peso: number;
  altura: number;
  fechaCreacion: string;
  activo: boolean;
}

export interface PaginatedPacientes {
  datos: Paciente[];
  totalRegistros: number;
  totalPaginas: number;
  paginaActual: number;
  tamanoPagina: number;
}

export interface CreatePacienteDTO {
  cedula: string;
  nombre: string;
  apellidos: string;
  fechaNacimiento: string;
  sexo: Sexo;
  tipoSangre: string;
  peso: number;
  altura: number;
}

export interface CreateContactoDTO {
  nombre: string;
  apellidos: string;
  relacion: string;
  telefono: string;
}

export interface PacienteFilters {
  nombre?: string;
  cedula?: string;
}

// ─── Episodio ─────────────────────────────────────────────────────────────────

export enum TriageNivel {
  NoAplica = 0,
  Reanimacion = 1,
  Emergencia = 2,
  Urgencia = 3,
  Prioritario = 4,
  NoUrgente = 5,
}

export const TRIAGE_CONFIG: Record<
  TriageNivel,
  { label: string; textCls: string; bgCls: string; borderCls: string }
> = {
  [TriageNivel.NoAplica]: {
    label: "No aplica",
    textCls: "text-slate-500",
    bgCls: "bg-slate-50",
    borderCls: "border-slate-200",
  },
  [TriageNivel.Reanimacion]: {
    label: "Reanimación",
    textCls: "text-red-600",
    bgCls: "bg-red-50",
    borderCls: "border-red-200",
  },
  [TriageNivel.Emergencia]: {
    label: "Emergencia",
    textCls: "text-orange-600",
    bgCls: "bg-orange-50",
    borderCls: "border-orange-200",
  },
  [TriageNivel.Urgencia]: {
    label: "Urgencia",
    textCls: "text-yellow-600",
    bgCls: "bg-yellow-50",
    borderCls: "border-yellow-200",
  },
  [TriageNivel.Prioritario]: {
    label: "Prioritario",
    textCls: "text-green-600",
    bgCls: "bg-green-50",
    borderCls: "border-green-200",
  },
  [TriageNivel.NoUrgente]: {
    label: "No urgente",
    textCls: "text-blue-600",
    bgCls: "bg-blue-50",
    borderCls: "border-blue-200",
  },
};

export enum TipoEpisodio {
  Urgencia = 0,
  Consulta = 1,
  Hospitalizacion = 2,
  Cirugia = 3,
  Observacion = 4,
  Procedimiento = 5,
}

export const TIPO_EPISODIO_LABELS: Record<TipoEpisodio, string> = {
  [TipoEpisodio.Urgencia]: "Urgencia",
  [TipoEpisodio.Consulta]: "Consulta",
  [TipoEpisodio.Hospitalizacion]: "Hospitalización",
  [TipoEpisodio.Cirugia]: "Cirugía",
  [TipoEpisodio.Observacion]: "Observación",
  [TipoEpisodio.Procedimiento]: "Procedimiento",
};

export enum CondicionClinica {
  CRITICO = "CRITICO",
  GRAVE = "GRAVE",
  INESTABLE = "INESTABLE",
  MODERADO = "MODERADO",
  LEVE = "LEVE",
  ESTABLE = "ESTABLE",
}

export const CONDICION_LABELS: Record<CondicionClinica, string> = {
  [CondicionClinica.CRITICO]: "Crítico",
  [CondicionClinica.GRAVE]: "Grave",
  [CondicionClinica.INESTABLE]: "Inestable",
  [CondicionClinica.MODERADO]: "Moderado",
  [CondicionClinica.LEVE]: "Leve",
  [CondicionClinica.ESTABLE]: "Estable",
};

export const CONDICION_CONFIG: Record<
  CondicionClinica,
  { label: string; bg: string; text: string }
> = {
  [CondicionClinica.CRITICO]: {
    label: "Crítico",
    bg: "#dc2626",
    text: "#ffffff",
  },
  [CondicionClinica.GRAVE]: { label: "Grave", bg: "#ea580c", text: "#ffffff" },
  [CondicionClinica.INESTABLE]: {
    label: "Inestable",
    bg: "#ca8a04",
    text: "#ffffff",
  },
  [CondicionClinica.MODERADO]: {
    label: "Moderado",
    bg: "#16a34a",
    text: "#ffffff",
  },
  [CondicionClinica.LEVE]: { label: "Leve", bg: "#2563eb", text: "#ffffff" },
  [CondicionClinica.ESTABLE]: {
    label: "Estable",
    bg: "#64748b",
    text: "#ffffff",
  },
};

export interface EpisodioActivo {
  episodioId: number;
  pacienteId: number;
  nombre: string;
  apellidos: string;
  cedula: string;
  areaId: number;
  areaNombre: string;
  nivelTriage: TriageNivel;
  tipoEpisodio: TipoEpisodio;
  estado: number;
  fechaAdmision: string;
  razonVisita: string;
}

export interface PaginatedEpisodiosActivos {
  datos: EpisodioActivo[];
  totalRegistros: number;
  totalPaginas: number;
  paginaActual: number;
  tamanoPagina: number;
}

export interface CreateEpisodioDTO {
  fechaAdmision: string;
  tipo: TipoEpisodio;
  nivelTriage: TriageNivel;
  condicionClinica: string;
  razonVisita: string;
  areaId: number;
  hospitalId: number | null;
}

export interface EpisodioFilters {
  nombre?: string;
  cedula?: string;
  areaId?: number;
  nivelTriage?: TriageNivel;
}

// ─── Historial de episodios ───────────────────────────────────────────────────

export enum EpisodioEstado {
  Pendiente = 0,
  EnCurso = 1,
  Cancelado = 2,
  Finalizado = 3,
}

export const ESTADO_EPISODIO_CONFIG: Record<
  EpisodioEstado,
  { label: string; textCls: string; bgCls: string; borderCls: string }
> = {
  [EpisodioEstado.Pendiente]: {
    label: "Pendiente",
    textCls: "text-amber-600",
    bgCls: "bg-amber-50",
    borderCls: "border-amber-200",
  },
  [EpisodioEstado.EnCurso]: {
    label: "En curso",
    textCls: "text-blue-600",
    bgCls: "bg-blue-50",
    borderCls: "border-blue-200",
  },
  [EpisodioEstado.Cancelado]: {
    label: "Cancelado",
    textCls: "text-red-600",
    bgCls: "bg-red-50",
    borderCls: "border-red-200",
  },
  [EpisodioEstado.Finalizado]: {
    label: "Finalizado",
    textCls: "text-green-600",
    bgCls: "bg-green-50",
    borderCls: "border-green-200",
  },
};

export interface EpisodioHistorial {
  id: number;
  pacienteId: number;
  pacienteNombre: string;
  fechaAdmision: string;
  fechaSalida: string | null;
  estado: EpisodioEstado;
  tipo: TipoEpisodio;
  nivelTriage: TriageNivel;
  condicionClinica: string;
  razonVisita: string;
  razonFinalizacion: string | null;
  areaId: number;
  areaNombre: string;
  hospitalId: number;
  hospitalNombre: string;
  admitidoPor: number;
  admitidoPorNombre: string;
  finalizadoPor: number | null;
  finalizadoPorNombre: string | null;
}

export interface PaginatedEpisodiosHistorial {
  datos: EpisodioHistorial[];
  totalRegistros: number;
  totalPaginas: number;
  paginaActual: number;
  tamanoPagina: number;
}

// ─── Finalizar episodio ───────────────────────────────────────────────────────

export interface FinalizarEpisodioDTO {
  razonFinalizacion: string;
  fechaSalida: string;
}

// ─── Alergias ─────────────────────────────────────────────────────────────────

export enum SeveridadAlergia {
  Leve = 0,
  Moderada = 1,
  Grave = 2,
}

export const SEVERIDAD_CONFIG: Record<
  SeveridadAlergia,
  {
    label: string;
    textCls: string;
    bgCls: string;
    borderCls: string;
    leftBorderCls: string;
    iconBgCls: string;
  }
> = {
  [SeveridadAlergia.Leve]: {
    label: "Leve",
    textCls: "text-green-700",
    bgCls: "bg-green-50",
    borderCls: "border-green-200",
    leftBorderCls: "border-l-green-400",
    iconBgCls: "bg-green-100",
  },
  [SeveridadAlergia.Moderada]: {
    label: "Moderada",
    textCls: "text-amber-700",
    bgCls: "bg-amber-50",
    borderCls: "border-amber-300",
    leftBorderCls: "border-l-amber-400",
    iconBgCls: "bg-amber-100",
  },
  [SeveridadAlergia.Grave]: {
    label: "Grave",
    textCls: "text-red-700",
    bgCls: "bg-red-50",
    borderCls: "border-red-200",
    leftBorderCls: "border-l-red-500",
    iconBgCls: "bg-red-100",
  },
};

export interface Alergia {
  id: number;
  pacienteId: number;
  alergeno: string;
  severidad: SeveridadAlergia;
  reaccion: string;
  fechaRegistro: string;
}

export interface CreateAlergiaDTO {
  alergeno: string;
  severidad: SeveridadAlergia;
  reaccion: string;
}

export type UpdateAlergiaDTO = CreateAlergiaDTO;

// ─── Contacto ─────────────────────────────────────────────────────────────────

export interface ContactoPaciente {
  id: number;
  pacienteId: number;
  nombre: string;
  apellidos: string;
  relacion: string;
  telefono: string;
}

export interface UpdatePacienteDTO {
  nombre: string;
  apellidos: string;
  tipoSangre: string;
  peso: number;
  altura: number;
}

export interface UpdateContactoDTO {
  nombre: string;
  apellidos: string;
  relacion: string;
  telefono: string;
}

// ─── Diagnósticos ─────────────────────────────────────────────────────────────

export interface Diagnostico {
  id: number;
  episodioId: number;
  doctorId: number;
  doctorNombre: string;
  cie: string;
  descripcion: string;
  fecha: string;
}

export interface CreateDiagnosticoDTO {
  cie: string;
  descripcion: string;
  fecha: string;
}

// ─── Signos vitales ───────────────────────────────────────────────────────────

export interface SignoVital {
  id: number;
  episodioId: number;
  tipoSignoId: number;
  tipoSignoNombre: string;
  unidad: string;
  valor: number;
  minimoNormal: number;
  maximoNormal: number;
  fecha: string;
  regeneradoPor: number;
  regeneradoPorNombre: string;
}

export interface CreateSignoVitalDTO {
  tipoSignoId: number;
  valor: number;
  fecha: string;
}

export interface SignoVitalFilters {
  tipoSignoId?: number;
  desde?: string;
  hasta?: string;
}

// ─── Medicación ──────────────────────────────────────────────────────────────

export enum MedicacionEstado {
  Activa = 0,
  Suspendida = 1,
  Completada = 2,
  Cancelada = 3,
}

export const MEDICACION_ESTADO_CONFIG: Record<
  MedicacionEstado,
  { label: string; bgCls: string; textCls: string }
> = {
  [MedicacionEstado.Activa]: {
    label: "Activa",
    bgCls: "bg-[#eff6ff]",
    textCls: "text-[#2563eb]",
  },
  [MedicacionEstado.Suspendida]: {
    label: "Suspendida",
    bgCls: "bg-[#fffbeb]",
    textCls: "text-[#d97706]",
  },
  [MedicacionEstado.Completada]: {
    label: "Completada",
    bgCls: "bg-[#f1f5f9]",
    textCls: "text-[#64748b]",
  },
  [MedicacionEstado.Cancelada]: {
    label: "Cancelada",
    bgCls: "bg-[#fee2e2]",
    textCls: "text-[#dc2626]",
  },
};

export interface Medicacion {
  id: number;
  episodioId: number;
  doctorId: number;
  doctorNombre: string;
  medicamentoId: number;
  medicamentoNombre: string;
  dosis: number;
  unidadMedida: string;
  frecuenciaHoras: number;
  fechaInicio: string;
  fechaFin: string | null;
  estado: MedicacionEstado;
  creadoEn: string;
  actualizadoEn: string;
}

export interface CreateMedicacionDTO {
  medicamentoId: number;
  dosis: number;
  unidadMedida: string;
  frecuenciaHoras: number;
  fechaInicio: string;
  fechaFin?: string | null;
}

export interface MedicacionFilters {
  estado?: MedicacionEstado;
  medicamento?: string;
}

export interface Administracion {
  id: number;
  medicacionId: number;
  fechaAdministracion: string;
  enfermeraId: number;
  enfermeraNombre: string;
  observaciones: string;
}

export interface CreateAdministracionDTO {
  fechaAdministracion: string;
  observaciones: string;
}

export interface CambiarEstadoMedicacionDTO {
  nuevoEstado: MedicacionEstado;
  justificacion: string;
}

export interface Medicamento {
  id: number;
  nombre: string;
}

// ─── Notas de enfermería ──────────────────────────────────────────────────────

export interface NotaEnfermeria {
  id: number;
  episodioId: number;
  enfermeraId: number;
  enfermeraNombre: string;
  descripcion: string;
  fecha: string;
}

export interface CreateNotaEnfermeriaDTO {
  descripcion: string;
  fecha: string;
}

// Evolucion clínica

export interface EvolucionClinica {
  id: number;
  episodioId: number;
  doctorId: number;
  doctorNombre: string;
  descripcion: string;
  fecha: string;
}

export interface CreateEvolucionClinicaDTO {
  descripcion: string;
  fecha: string;
}

// Ordenes medicas

export enum OrdenEstado {
  Pendiente = 0,
  EnProceso = 1,
  Completada = 2,
  Cancelada = 3,
}

export const ORDEN_ESTADO_CONFIG: Record<
  OrdenEstado,
  { label: string; bgCls: string; borderCls: string; textCls: string }
> = {
  [OrdenEstado.Pendiente]: {
    label: "Pendiente",
    bgCls: "bg-[#fffbeb]",
    borderCls: "border-[#fde68a]",
    textCls: "text-[#d97706]",
  },
  [OrdenEstado.EnProceso]: {
    label: "En proceso",
    bgCls: "bg-[#eff6ff]",
    borderCls: "border-[#bfdbfe]",
    textCls: "text-[#2563eb]",
  },
  [OrdenEstado.Completada]: {
    label: "Completada",
    bgCls: "bg-[#ecfdf5]",
    borderCls: "border-[#a7f3d0]",
    textCls: "text-[#059669]",
  },
  [OrdenEstado.Cancelada]: {
    label: "Cancelada",
    bgCls: "bg-[#f1f5f9]",
    borderCls: "border-[#e2e8f0]",
    textCls: "text-[#64748b]",
  },
};

export enum TipoOrden {
  Laboratorio = 0,
  Imagen = 1,
  Medicamento = 2,
  Procedimiento = 3,
  Interconsulta = 4,
  Otro = 5,
}

export const TIPO_ORDEN_LABELS: Record<TipoOrden, string> = {
  [TipoOrden.Laboratorio]: "Laboratorio",
  [TipoOrden.Imagen]: "Imagen",
  [TipoOrden.Medicamento]: "Medicamento",
  [TipoOrden.Procedimiento]: "Procedimiento",
  [TipoOrden.Interconsulta]: "Interconsulta",
  [TipoOrden.Otro]: "Otro",
};

export enum OrdenPrioridad {
  Baja = 0,
  Normal = 1,
  Alta = 2,
  Urgente = 3,
}

export const ORDEN_PRIORIDAD_CONFIG: Record<
  OrdenPrioridad,
  { label: string; bgCls: string; borderCls: string; textCls: string }
> = {
  [OrdenPrioridad.Baja]: {
    label: "Baja",
    bgCls: "bg-[#eff6ff]",
    borderCls: "border-[#dbeafe]",
    textCls: "text-[#2563eb]",
  },
  [OrdenPrioridad.Normal]: {
    label: "Normal",
    bgCls: "bg-[#eff6ff]",
    borderCls: "border-[#dbeafe]",
    textCls: "text-[#2563eb]",
  },
  [OrdenPrioridad.Alta]: {
    label: "Alta",
    bgCls: "bg-[rgba(255,98,125,0.1)]",
    borderCls: "border-[rgba(255,98,125,0.2)]",
    textCls: "text-[#ff627d]",
  },
  [OrdenPrioridad.Urgente]: {
    label: "Urgente",
    bgCls: "bg-[#f3e8ff]",
    borderCls: "border-[#e9d5ff]",
    textCls: "text-[#7e22ce]",
  },
};

export const CATEGORIAS_POR_TIPO: Record<TipoOrden, string[]> = {
  [TipoOrden.Laboratorio]: [
    "Hemograma completo",
    "Química sanguínea",
    "Perfil lipídico",
    "Perfil hepático",
    "Perfil cardíaco",
    "Perfil renal",
    "Urianálisis",
    "Cultivo",
    "Coagulación",
    "Prueba de embarazo",
  ],
  [TipoOrden.Imagen]: [
    "Radiografía",
    "Tomografía",
    "Resonancia magnética",
    "Ecografía",
    "Electrocardiograma",
    "Ecocardiograma",
    "Endoscopía",
  ],
  [TipoOrden.Medicamento]: [
    "Analgésico",
    "Antibiótico",
    "Antipirético",
    "Antiinflamatorio",
    "Sedación",
    "Fluidoterapia",
    "Vitaminas",
  ],
  [TipoOrden.Procedimiento]: [
    "Sutura",
    "Curación",
    "Cateterismo",
    "Drenaje",
    "Biopsia",
    "Intubación",
    "Canalización",
  ],
  [TipoOrden.Interconsulta]: [
    "Cardiología",
    "Neurología",
    "Traumatología",
    "Cirugía",
    "Urología",
    "Ginecología",
    "Psiquiatría",
    "Dermatología",
  ],
  [TipoOrden.Otro]: ["Otro"],
};

export interface CreateOrdenDTO {
  descripcion: string;
  tipoOrden: TipoOrden;
  categoria: string;
  prioridad: OrdenPrioridad;
  costoTotal: 0;
}

export interface CambiarEstadoOrdenDTO {
  nuevoEstado: OrdenEstado;
  comentarioEjecucion: string | null;
  justificacionCancelacion: string | null;
}

export interface OrdenMedica {
  datos: Dato[];
  totalRegistros: number;
  totalPaginas: number;
  paginaActual: number;
  tamanoPagina: number;
}

export interface Dato {
  id: number;
  episodioId: number;
  usuarioSolicitanteId: number;
  solicitanteNombre: string;
  usuarioEjecutanteId: number | null;
  ejecutanteNombre: string | null;
  descripcion: string;
  tipoOrden: number;
  categoria: string;
  prioridad: number;
  estado: number;
  fechaEmision: string;
  fechaEjecucion: string | null;
  comentarioEjecucion: string | null;
  fechaCancelacion: string | null;
  justificacionCancelacion: string | null;
  costoTotal: number;
}
