export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:5025/api";
export const API_ENDPOINTS = {
  auth: {
    login: `${API_BASE_URL}/auth/login`,
    changePassword: `${API_BASE_URL}/auth/cambiar-password`,
    requestRecovery: `${API_BASE_URL}/auth/solicitar-recuperacion`,
    validateToken: `${API_BASE_URL}/auth/validar-token`,
    resetPassword: `${API_BASE_URL}/auth/restablecer-password`,
  },
  roles: {
    list: `${API_BASE_URL}/roles`,
  },
  specialties: {
    list: `${API_BASE_URL}/especialidades`,
  },
  especialidades: {
    list: `${API_BASE_URL}/especialidades`,
    byId: (id: number) => `${API_BASE_URL}/especialidades/${id}`,
  },
  users: {
    me: (id: number | string) => `${API_BASE_URL}/usuarios/${id}`,
  },
  admin: {
    users: `${API_BASE_URL}/usuarios`,
    user: (id: number) => `${API_BASE_URL}/usuarios/${id}`,
    block: (id: number) => `${API_BASE_URL}/usuarios/${id}/bloquear`,
    unblock: (id: number) => `${API_BASE_URL}/usuarios/${id}/desbloquear`,
  },
  audit: {
    logs: `${API_BASE_URL}/auditoria`,
    byUser: (usuarioId: number) =>
      `${API_BASE_URL}/auditoria/usuario/${usuarioId}`,
  },
  hospitals: {
    list: `${API_BASE_URL}/hospitales`,
    byId: (id: number) => `${API_BASE_URL}/hospitales/${id}`,
  },
  areas: {
    list: `${API_BASE_URL}/areas`,
    byId: (id: number) => `${API_BASE_URL}/areas/${id}`,
  },
  tiposActivos: {
    list: `${API_BASE_URL}/tipos-activos`,
    byId: (id: number) => `${API_BASE_URL}/tipos-activos/${id}`,
  },
  zonas: {
    list: `${API_BASE_URL}/zonas`,
    byId: (id: number) => `${API_BASE_URL}/zonas/${id}`,
  },
  signosVitales: {
    tipos: `${API_BASE_URL}/signos-vitales/tipos`,
    tipoById: (id: number) => `${API_BASE_URL}/signos-vitales/tipos/${id}`,
  },
  activos: {
    list: `${API_BASE_URL}/activos`,
    byId: (id: number) => `${API_BASE_URL}/activos/${id}`,
    retirar: (id: number) => `${API_BASE_URL}/activos/${id}/retirar`,
    qr: (id: number) => `${API_BASE_URL}/activos/${id}/qr`,
  },
  alertas: {
    list: `${API_BASE_URL}/alertas`,
    leer: (id: number) => `${API_BASE_URL}/alertas/${id}/leer`,
  },
  mantenimientos: {
    calendario: `${API_BASE_URL}/mantenimientos/calendario`,
    byActivo: (activoId: number) =>
      `${API_BASE_URL}/activos/${activoId}/mantenimientos`,
    byId: (activoId: number, mantenimientoId: number) =>
      `${API_BASE_URL}/activos/${activoId}/mantenimientos/${mantenimientoId}`,
    estado: (activoId: number, mantenimientoId: number) =>
      `${API_BASE_URL}/activos/${activoId}/mantenimientos/${mantenimientoId}/estado`,
  },
  pacientes: {
    list: `${API_BASE_URL}/pacientes`,
    byId: (id: number) => `${API_BASE_URL}/pacientes/${id}`,
    cuenta: `${API_BASE_URL}/pacientes/cuenta`,
    contactos: (id: number) => `${API_BASE_URL}/pacientes/${id}/contactos`,
    contactoById: (pacienteId: number, contactoId: number) =>
      `${API_BASE_URL}/pacientes/${pacienteId}/contactos/${contactoId}`,
    episodios: (pacienteId: number) =>
      `${API_BASE_URL}/pacientes/${pacienteId}/episodios`,
    episodioActivo: (pacienteId: number) =>
      `${API_BASE_URL}/pacientes/${pacienteId}/episodios/activo`,
    alergias: (id: number) => `${API_BASE_URL}/pacientes/${id}/alergias`,
    alergiaById: (pacienteId: number, alergiaId: number) =>
      `${API_BASE_URL}/pacientes/${pacienteId}/alergias/${alergiaId}`,
  },
  episodios: {
    activos: `${API_BASE_URL}/episodios/activos`,
    byId: (id: number) => `${API_BASE_URL}/episodios/${id}`,
    finalizar: (id: number) => `${API_BASE_URL}/episodios/${id}/finalizar`,
    ordenes: (id: number) => `${API_BASE_URL}/episodios/${id}/ordenes`,
    ordenEstado: (episodioId: number, ordenId: number) =>
      `${API_BASE_URL}/episodios/${episodioId}/ordenes/${ordenId}/estado`,
    diagnosticos: (id: number) =>
      `${API_BASE_URL}/episodios/${id}/diagnosticos`,
    signosVitalesEpisodio: (id: number) =>
      `${API_BASE_URL}/episodios/${id}/signos-vitales`,
    notasEnfermeria: (id: number) =>
      `${API_BASE_URL}/episodios/${id}/notas-enfermeria`,
    evolucionClinica: (id: number) =>
      `${API_BASE_URL}/episodios/${id}/evoluciones`,
    medicacion: (id: number) => `${API_BASE_URL}/episodios/${id}/medicacion`,
    medicacionById: (episodioId: number, prescripcionId: number) =>
      `${API_BASE_URL}/episodios/${episodioId}/medicacion/${prescripcionId}`,
    medicacionEstado: (episodioId: number, prescripcionId: number) =>
      `${API_BASE_URL}/episodios/${episodioId}/medicacion/${prescripcionId}/estado`,
    administraciones: (episodioId: number, prescripcionId: number) =>
      `${API_BASE_URL}/episodios/${episodioId}/medicacion/${prescripcionId}/administraciones`,
    recetaAlta: (episodioId: number) =>
      `${API_BASE_URL}/episodios/${episodioId}/receta-alta`,
  },
  medicamentos: {
    list: `${API_BASE_URL}/medicamentos`,
    byId: (id: number) => `${API_BASE_URL}/medicamentos/${id}`,
  },
  imagenes: {
    estudiosPaciente: (pacienteId: number) =>
      `${API_BASE_URL}/pacientes/${pacienteId}/estudios/registros`,
    estudioDetalle: (estudioId: number) =>
      `${API_BASE_URL}/estudios/${estudioId}`,
    instanciaImagen: (estudioId: number, orthancInstanceId: string) =>
      `${API_BASE_URL}/estudios/${estudioId}/instancias/${orthancInstanceId}/imagen`,
  },
  ordenesGlobales: {
    list: `${API_BASE_URL}/ordenes`,
    archivos: (ordenId: number) =>
      `${API_BASE_URL}/ordenes/${ordenId}/archivos`,
    archivoDescargar: (archivoId: number) =>
      `${API_BASE_URL}/ordenes/archivos/${archivoId}/descargar`,
    archivoEliminar: (archivoId: number) =>
      `${API_BASE_URL}/ordenes/archivos/${archivoId}`,
    vincularEstudio: (ordenId: number) =>
      `${API_BASE_URL}/ordenes/${ordenId}/estudio`,
  },
  pacs: {
    paciente: (pacienteId: number) =>
      `${API_BASE_URL}/pacientes/${pacienteId}/pacs`,
    buscar: (pacienteId: number) =>
      `${API_BASE_URL}/pacientes/${pacienteId}/pacs/buscar`,
    coincidencias: (pacienteId: number) =>
      `${API_BASE_URL}/pacientes/${pacienteId}/pacs/coincidencias`,
    estudiosOrthanc: (pacienteId: number) =>
      `${API_BASE_URL}/pacientes/${pacienteId}/estudios`,
  },
} as const;
