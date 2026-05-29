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
    posicion: (id: number) => `${API_BASE_URL}/areas/${id}/posicion`,
  },
  hospitalFloorPlans: {
    lista: (hospitalId: number) => `${API_BASE_URL}/planos-hospital/${hospitalId}/lista`,
    crear: `${API_BASE_URL}/planos-hospital`,
    vista: (planoId: number) => `${API_BASE_URL}/planos-hospital/${planoId}/vista`,
    eliminar: (planoId: number) => `${API_BASE_URL}/planos-hospital/${planoId}`,
  },
  tiposActivos: {
    list: `${API_BASE_URL}/tipos-activos`,
    byId: (id: number) => `${API_BASE_URL}/tipos-activos/${id}`,
  },
  zonas: {
    list: `${API_BASE_URL}/zonas`,
    byId: (id: number) => `${API_BASE_URL}/zonas/${id}`,
  },
  vitalSigns: {
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
    calendar: `${API_BASE_URL}/mantenimientos/calendario`,
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
    asignarMedicoPrincipal: (id: number) =>
      `${API_BASE_URL}/episodios/${id}/asignar-medico-principal`,
    cambiarMedicoActual: (id: number) =>
      `${API_BASE_URL}/episodios/${id}/cambiar-medico-actual`,
    medico: (medicoId: number) =>
      `${API_BASE_URL}/episodios/medico/${medicoId}`,
  },
  medications: {
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
  monitorPacientes: {
    list: `${API_BASE_URL}/monitor-pacientes`,
    byId: (id: number) => `${API_BASE_URL}/monitor-pacientes/${id}`,
    ubicacion: (id: number) => `${API_BASE_URL}/monitor-pacientes/${id}/ubicacion`,
    desasignar: (id: number) => `${API_BASE_URL}/monitor-pacientes/${id}/desasignar`,
    byPaciente: (pacienteId: number) => `${API_BASE_URL}/pacientes/${pacienteId}/monitores`,
    byActivo: (activoId: number) => `${API_BASE_URL}/activos/${activoId}/monitores`,
  },
  personalMedico: {
    list: `${API_BASE_URL}/personal-medico`,
    groups: `${API_BASE_URL}/personal-medico/grupos`,
    grupoById: (id: number) => `${API_BASE_URL}/personal-medico/grupos/${id}`,
    grupoMiembros: (id: number) => `${API_BASE_URL}/personal-medico/grupos/${id}/miembros`,
    grupoMiembroById: (grupoId: number, usuarioId: number) =>
      `${API_BASE_URL}/personal-medico/grupos/${grupoId}/miembros/${usuarioId}`,
    turnos: `${API_BASE_URL}/personal-medico/turnos`,
    turnoById: (id: number) => `${API_BASE_URL}/personal-medico/turnos/${id}`,
    turnosRango: `${API_BASE_URL}/personal-medico/turnos/rango`,
    tasks: `${API_BASE_URL}/personal-medico/tareas`,
    tareaById: (id: number) => `${API_BASE_URL}/personal-medico/tareas/${id}`,
    tareaEstado: (id: number) => `${API_BASE_URL}/personal-medico/tareas/${id}/estado`,
    asignacionesTareas: `${API_BASE_URL}/personal-medico/asignaciones`,
    asignacionTareaById: (id: number) => `${API_BASE_URL}/personal-medico/asignaciones/${id}`,
    tiposTarea: `${API_BASE_URL}/personal-medico/tipos-tarea`,
    tipoTareaById: (id: number) => `${API_BASE_URL}/personal-medico/tipos-tarea/${id}`,
    cargaTrabajo: `${API_BASE_URL}/personal-medico/carga-trabajo`,
    cargaTrabajoUsuario: (usuarioId: number) => `${API_BASE_URL}/personal-medico/carga-trabajo/${usuarioId}`,
    sugerenciasPersonal: `${API_BASE_URL}/personal-medico/carga-trabajo/sugerencias`,
    estadoPersonal: (usuarioId: number) => `${API_BASE_URL}/personal-medico/${usuarioId}/estado`,
    miEstado: `${API_BASE_URL}/personal-medico/mi-estado`,
  },
  turnosPlantillas: {
    list: `${API_BASE_URL}/turnos/plantillas`,
    byId: (id: number) => `${API_BASE_URL}/turnos/plantillas/${id}`,
  },
  bebes: {
    list: `${API_BASE_URL}/bebes`,
    byId: (id: number) => `${API_BASE_URL}/bebes/${id}`,
    alta: (id: number) => `${API_BASE_URL}/bebes/${id}/alta`,
    alimentacion: (episodioId: number) => `${API_BASE_URL}/bebes/episodios/${episodioId}/alimentacion`,
    alimentacionById: (episodioId: number, id: number) => `${API_BASE_URL}/bebes/episodios/${episodioId}/alimentacion/${id}`,
    cuidados: (episodioId: number) => `${API_BASE_URL}/bebes/episodios/${episodioId}/cuidados`,
    cuidadoById: (episodioId: number, id: number) => `${API_BASE_URL}/bebes/episodios/${episodioId}/cuidados/${id}`,
    ubicacion: (bebeId: number) => `${API_BASE_URL}/bebes/${bebeId}/ubicacion`,
    asignarBrazalete: (bebeId: number) => `${API_BASE_URL}/bebes/${bebeId}/asignar-brazalete`,
    desasignarBrazalete: (bebeId: number) => `${API_BASE_URL}/bebes/${bebeId}/desasignar-brazalete`,
  },
  ble: {
    brazaletes: `${API_BASE_URL}/ble/brazaletes`,
    brazaleteById: (id: number) => `${API_BASE_URL}/ble/brazaletes/${id}`,
    brazaleteStatus: (id: number) => `${API_BASE_URL}/ble/brazaletes/${id}/status`,
    asignacionActivaPaciente: (pacienteId: number) => `${API_BASE_URL}/ble/asignaciones/paciente/${pacienteId}/activa`,
    asignacionesPaciente: (pacienteId: number) => `${API_BASE_URL}/ble/asignaciones/paciente/${pacienteId}`,
    asignacionesEpisodio: (episodioId: number) => `${API_BASE_URL}/ble/asignaciones/episodio/${episodioId}`,
    eventosBrazalete: (brazaleteId: number) => `${API_BASE_URL}/ble/eventos/brazalete/${brazaleteId}`,
    eventoById: (id: number) => `${API_BASE_URL}/ble/eventos/${id}`,
    sensores: `${API_BASE_URL}/ble/sensores`,
    sensorById: (id: number) => `${API_BASE_URL}/ble/sensores/${id}`,
  },
  zonasPermitidas: {
    byEpisodio: (episodioId: number) => `${API_BASE_URL}/ble/zonas-permitidas/episodio/${episodioId}`,
    create: `${API_BASE_URL}/ble/zonas-permitidas`,
    revocar: (id: number) => `${API_BASE_URL}/ble/zonas-permitidas/${id}/revocar`,
  },
  alerts: {
    base: `${API_BASE_URL}/ble/alertas`,
    byId: (id: number) => `${API_BASE_URL}/ble/alertas/${id}`,
    acknowledge: (id: number) => `${API_BASE_URL}/ble/alertas/${id}/reconocer`,
    close: (id: number) => `${API_BASE_URL}/ble/alertas/${id}/cerrar`,
  },
  turnosCiclos: {
    list: `${API_BASE_URL}/turnos/ciclos`,
    byId: (id: number) => `${API_BASE_URL}/turnos/ciclos/${id}`,
    assignments: `${API_BASE_URL}/turnos/ciclos/asignaciones`,
    asignacionById: (id: number) => `${API_BASE_URL}/turnos/ciclos/asignaciones/${id}`,
    asignacionPreview: `${API_BASE_URL}/turnos/ciclos/asignaciones/preview`,
    asignacionRenovar: (id: number) => `${API_BASE_URL}/turnos/ciclos/asignaciones/${id}/renovar`,
  },
  chat: {
    conversations: `${API_BASE_URL}/chat/conversations`,
    directConversation: `${API_BASE_URL}/chat/conversations/direct`,
    groupConversation: `${API_BASE_URL}/chat/conversations/group`,
    messages: (conversationId: number) =>
      `${API_BASE_URL}/chat/conversations/${conversationId}/messages`,
  },
  tagsBle: {
    list: `${API_BASE_URL}/tags-ble`,
    byId: (id: number) => `${API_BASE_URL}/tags-ble/${id}`,
  },
  gatewaysBle: {
    list: `${API_BASE_URL}/gateways-ble`,
    byId: (id: number) => `${API_BASE_URL}/gateways-ble/${id}`,
  },
  asignacionesTagActivo: {
    list: `${API_BASE_URL}/asignaciones-tag-activo`,
    desasignar: (id: number) =>
      `${API_BASE_URL}/asignaciones-tag-activo/${id}/desasignar`,
  },
  asignacionesGatewayArea: {
    list: `${API_BASE_URL}/asignaciones-gateway-area`,
    desasignar: (id: number) =>
      `${API_BASE_URL}/asignaciones-gateway-area/${id}/desasignar`,
  },
  asignacionesGatewayZona: {
    list: `${API_BASE_URL}/ble/asignaciones-gateway-zona`,
    desasignar: (id: number) =>
      `${API_BASE_URL}/ble/asignaciones-gateway-zona/${id}/desasignar`,
  },
  ubicacionesActivos: {
    list: `${API_BASE_URL}/ubicaciones-activos`,
    byTag: (tagBleId: number) =>
      `${API_BASE_URL}/ubicaciones-activos/tag/${tagBleId}`,
  },
} as const;

export const SERVER_BASE_URL = API_BASE_URL.replace(/\/+$/g, "").replace(/\/api$/i, "");
export const SIGNALR_HUB_URL = `${API_BASE_URL.replace(/\/+$/g, "").replace(/\/api$/i, "")}/hubs/signos-vitales`;
export const CHAT_HUB_URL = `${API_BASE_URL.replace(/\/+$/g, "").replace(/\/api$/i, "")}/hubs/chat`;
