import axiosInstance from "@/lib/axios";
import { API_ENDPOINTS } from "@/config/api";
import type {
  Bebe,
  PaginatedBebes,
  CreateBebeDTO,
  DarDeAltaBebeDTO,
  RegistroAlimentacion,
  CreateRegistroAlimentacionDTO,
  UpdateRegistroAlimentacionDTO,
  RegistroCuidado,
  CreateRegistroCuidadoDTO,
  UpdateRegistroCuidadoDTO,
  Brazalete,
  PaginatedBrazaletes,
  AsignacionBrazalete,
  UbicacionBebe,
  AsignarBrazaleteABebeDTO,
  AsignarBrazaleteABebeResponse,
  DesasignarBrazaleteABebeDTO,
  DesasignarBrazaleteABebeResponse,
  EventoRastreo,
  PaginatedEventosRastreo,
  CrearBrazaleteDTO,
  ActualizarBrazaleteDTO,
  CambiarEstadoBrazaleteDTO,
  AlertaBrazalete,
  PaginatedAlertas,
  CloseAlertDTO,
} from "@/features/baby-monitoring/types";
import {
  EstadoBrazalete,
  TipoEventoRastreo,
  EstadoAlertaBLE,
  SeveridadAlerta,
  TipoAlertaBLE,
} from "@/features/baby-monitoring/types";

export async function getBabies(page = 1, pageSize = 10): Promise<PaginatedBebes> {
  const res = await axiosInstance.get<PaginatedBebes>(API_ENDPOINTS.bebes.list, {
    params: { pagina: page, tamanio: pageSize },
  });
  return res.data;
}

export async function createBaby(dto: CreateBebeDTO): Promise<Bebe> {
  const res = await axiosInstance.post<Bebe>(API_ENDPOINTS.bebes.list, dto);
  return res.data;
}

export async function getBabyById(id: number): Promise<Bebe> {
  const res = await axiosInstance.get<Bebe>(API_ENDPOINTS.bebes.byId(id));
  return res.data;
}

export async function dischargeBaby(id: number, dto: DarDeAltaBebeDTO): Promise<Bebe> {
  const res = await axiosInstance.post<Bebe>(API_ENDPOINTS.bebes.alta(id), dto);
  return res.data;
}

// ─── Alimentación ──────────────────────────────────────────────────────────────

export async function getBabyFeedings(episodioId: number): Promise<RegistroAlimentacion[]> {
  const res = await axiosInstance.get<RegistroAlimentacion[]>(API_ENDPOINTS.bebes.alimentacion(episodioId));
  return res.data;
}

export async function createBabyFeeding(episodioId: number, dto: CreateRegistroAlimentacionDTO): Promise<RegistroAlimentacion> {
  const res = await axiosInstance.post<RegistroAlimentacion>(API_ENDPOINTS.bebes.alimentacion(episodioId), dto);
  return res.data;
}

export async function updateBabyFeeding(episodioId: number, id: number, dto: UpdateRegistroAlimentacionDTO): Promise<RegistroAlimentacion> {
  const res = await axiosInstance.put<RegistroAlimentacion>(API_ENDPOINTS.bebes.alimentacionById(episodioId, id), dto);
  return res.data;
}

export async function deleteBabyFeeding(episodioId: number, id: number): Promise<void> {
  await axiosInstance.delete(API_ENDPOINTS.bebes.alimentacionById(episodioId, id));
}

// ─── Cuidados ──────────────────────────────────────────────────────────────────

export async function getBabyCareRecords(episodioId: number): Promise<RegistroCuidado[]> {
  const res = await axiosInstance.get<RegistroCuidado[]>(API_ENDPOINTS.bebes.cuidados(episodioId));
  return res.data;
}

export async function createBabyCareRecord(episodioId: number, dto: CreateRegistroCuidadoDTO): Promise<RegistroCuidado> {
  const res = await axiosInstance.post<RegistroCuidado>(API_ENDPOINTS.bebes.cuidados(episodioId), dto);
  return res.data;
}

export async function updateBabyCareRecord(episodioId: number, id: number, dto: UpdateRegistroCuidadoDTO): Promise<RegistroCuidado> {
  const res = await axiosInstance.put<RegistroCuidado>(API_ENDPOINTS.bebes.cuidadoById(episodioId, id), dto);
  return res.data;
}

export async function deleteBabyCareRecord(episodioId: number, id: number): Promise<void> {
  await axiosInstance.delete(API_ENDPOINTS.bebes.cuidadoById(episodioId, id));
}

// ─── Ubicación y Brazalete ─────────────────────────────────────────────────────

export async function getBabyLocation(bebeId: number, minutosNoSignal = 10): Promise<UbicacionBebe> {
  const res = await axiosInstance.get<UbicacionBebe>(API_ENDPOINTS.bebes.ubicacion(bebeId), {
    params: { minutosNoSignal },
  });
  return res.data;
}

export async function getActiveBraceletAssignmentByPatient(pacienteId: number): Promise<AsignacionBrazalete | null> {
  try {
    const res = await axiosInstance.get<AsignacionBrazalete>(
      API_ENDPOINTS.ble.asignacionActivaPaciente(pacienteId)
    );
    return res.data;
  } catch (err: unknown) {
    const status = (err as { response?: { status?: number } })?.response?.status;
    if (status === 404) return null;
    throw err;
  }
}

// GET /api/ble/brazaletes — inventario paginado con filtros opcionales
export async function getBracelets(
  page = 1,
  pageSize = 10,
  params?: { estado?: EstadoBrazalete; bateriaBaja?: boolean; sinSenalDesde?: string }
): Promise<PaginatedBrazaletes> {
  const res = await axiosInstance.get<PaginatedBrazaletes>(API_ENDPOINTS.ble.brazaletes, {
    params: { pagina: page, tamanio: pageSize, ...params },
  });
  return res.data;
}

// GET /api/ble/brazaletes — solo Disponibles para selector de asignación
export async function getAvailableBracelets(): Promise<Brazalete[]> {
  const res = await axiosInstance.get<PaginatedBrazaletes>(API_ENDPOINTS.ble.brazaletes, {
    params: { estado: EstadoBrazalete.Disponible, tamanio: 100 },
  });
  return res.data.datos;
}

// POST /api/ble/brazaletes
export async function createBracelet(dto: CrearBrazaleteDTO): Promise<Brazalete> {
  const res = await axiosInstance.post<Brazalete>(API_ENDPOINTS.ble.brazaletes, dto);
  return res.data;
}

// PUT /api/ble/brazaletes/{id} — actualiza descripcion, nivelBateria
export async function updateBracelet(id: number, dto: ActualizarBrazaleteDTO): Promise<Brazalete> {
  const res = await axiosInstance.put<Brazalete>(API_ENDPOINTS.ble.brazaleteById(id), dto);
  return res.data;
}

// PATCH /api/ble/brazaletes/{id}/status — no permite estado Activo=1
export async function updateBraceletStatus(id: number, dto: CambiarEstadoBrazaleteDTO): Promise<Brazalete> {
  const res = await axiosInstance.patch<Brazalete>(API_ENDPOINTS.ble.brazaleteStatus(id), dto);
  return res.data;
}

export async function getBraceletAssignmentsByEpisode(episodioId: number): Promise<AsignacionBrazalete[]> {
  const res = await axiosInstance.get<AsignacionBrazalete[]>(
    API_ENDPOINTS.ble.asignacionesEpisodio(episodioId)
  );
  return res.data;
}

export async function assignBraceletToBaby(bebeId: number, dto: AsignarBrazaleteABebeDTO): Promise<AsignacionBrazalete> {
  const res = await axiosInstance.post<AsignarBrazaleteABebeResponse>(
    API_ENDPOINTS.bebes.asignarBrazalete(bebeId), dto
  );
  return res.data.asignacionActiva;
}

export async function unassignBraceletFromBaby(bebeId: number, dto: DesasignarBrazaleteABebeDTO): Promise<AsignacionBrazalete> {
  const res = await axiosInstance.post<DesasignarBrazaleteABebeResponse>(
    API_ENDPOINTS.bebes.desasignarBrazalete(bebeId), dto
  );
  return res.data.asignacionCerrada;
}

export async function getBraceletTrackingEvents(brazaleteId: number): Promise<EventoRastreo[]> {
  const res = await axiosInstance.get<PaginatedEventosRastreo>(
    API_ENDPOINTS.ble.eventosBrazalete(brazaleteId),
    { params: { tamanio: 50 } }
  );
  return res.data.datos;
}

export async function getTrackingEventsByBracelet(
  brazaleteId: number,
  params: { pagina: number; tamanio: number; desde?: string | null; hasta?: string | null }
): Promise<PaginatedEventosRastreo> {
  const res = await axiosInstance.get<PaginatedEventosRastreo>(
    API_ENDPOINTS.ble.eventosBrazalete(brazaleteId),
    { params: { pagina: params.pagina, tamanio: params.tamanio, desde: params.desde ?? undefined, hasta: params.hasta ?? undefined } }
  );
  return res.data;
}

// ─── Historial de movimientos por episodio ────────────────────────────────────

export async function getMovementHistoryForBabyEpisode(
  episodioId: number,
  options: {
    pagina: number;
    tamanio: number;
    desde?: string | null;
    hasta?: string | null;
    tipoEvento?: TipoEventoRastreo | null;
    zonaId?: number | null;
  }
): Promise<PaginatedEventosRastreo> {
  const assignments = await getBraceletAssignmentsByEpisode(episodioId);
  if (assignments.length === 0) {
    return { datos: [], totalRegistros: 0, totalPaginas: 1, paginaActual: options.pagina, tamanoPagina: options.tamanio };
  }

  const now = new Date().toISOString();

  const eventArrays = await Promise.all(
    assignments.map(async (a) => {
      const desdeEffective = options.desde && options.desde > a.fechaAsignacion
        ? options.desde
        : a.fechaAsignacion;
      const hastaBase = a.fechaDesasignacion ?? now;
      const hastaEffective = options.hasta && options.hasta < hastaBase
        ? options.hasta
        : hastaBase;
      if (desdeEffective > hastaEffective) return [] as EventoRastreo[];
      try {
        const res = await axiosInstance.get<PaginatedEventosRastreo>(
          API_ENDPOINTS.ble.eventosBrazalete(a.brazaleteId),
          { params: { pagina: 1, tamanio: 500, desde: desdeEffective, hasta: hastaEffective } }
        );
        return res.data.datos;
      } catch {
        return [] as EventoRastreo[];
      }
    })
  );

  let all = eventArrays.flat();
  if (options.tipoEvento != null) all = all.filter(ev => ev.tipoEvento === options.tipoEvento);
  if (options.zonaId != null) all = all.filter(ev => ev.zonaId === options.zonaId);
  all.sort((a, b) => new Date(b.fechaEvento).getTime() - new Date(a.fechaEvento).getTime());

  const totalRegistros = all.length;
  const totalPaginas = Math.max(1, Math.ceil(totalRegistros / options.tamanio));
  const start = (options.pagina - 1) * options.tamanio;
  return {
    datos: all.slice(start, start + options.tamanio),
    totalRegistros,
    totalPaginas,
    paginaActual: options.pagina,
    tamanoPagina: options.tamanio,
  };
}

// ─── Alertas BLE ───────────────────────────────────────────────────────────────

export async function getAlerts(params?: {
  page?: number;
  pageSize?: number;
  status?: EstadoAlertaBLE;
  severity?: SeveridadAlerta;
  babyId?: number;
  braceletId?: number;
  type?: TipoAlertaBLE;
  dateFrom?: string | null;
  dateTo?: string | null;
}): Promise<PaginatedAlertas> {
  const res = await axiosInstance.get<PaginatedAlertas>(API_ENDPOINTS.alerts.base, {
    params: {
      pagina: params?.page,
      tamanio: params?.pageSize,
      estado: params?.status,
      pacienteId: params?.babyId,
      brazaleteId: params?.braceletId,
    },
  });
  return res.data;
}

export async function acknowledgeAlert(id: number): Promise<AlertaBrazalete> {
  const res = await axiosInstance.post<AlertaBrazalete>(API_ENDPOINTS.alerts.acknowledge(id));
  return res.data;
}

export async function closeAlert(id: number, dto: CloseAlertDTO): Promise<AlertaBrazalete> {
  const res = await axiosInstance.post<AlertaBrazalete>(API_ENDPOINTS.alerts.close(id), dto);
  return res.data;
}

