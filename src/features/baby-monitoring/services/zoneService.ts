import axiosInstance from "@/lib/axios";
import { API_ENDPOINTS } from "@/config/api";
import type {
  Zona,
  PaginatedZonas,
  CrearZonaDTO,
  ActualizarZonaDTO,
  Sensor,
  CrearSensorDTO,
  ActualizarSensorDTO,
  ZonaPermitidaBebe,
  CrearZonaPermitidaBebeDTO,
} from "@/features/baby-monitoring/types/zones";
import { TipoZona, EstadoZona, TipoSensor, EstadoSensor } from "@/features/baby-monitoring/types/zones";

// ─── Zonas ────────────────────────────────────────────────────────────────────

export async function getZones(params?: {
  pagina?: number;
  tamanio?: number;
  tipo?: TipoZona;
  estado?: EstadoZona;
  includeSensores?: boolean;
}): Promise<PaginatedZonas> {
  const res = await axiosInstance.get<PaginatedZonas>(API_ENDPOINTS.zonas.list, { params });
  return res.data;
}

export async function getZoneById(id: number, includeSensores = true): Promise<Zona> {
  const res = await axiosInstance.get<Zona>(API_ENDPOINTS.zonas.byId(id), {
    params: { includeSensores },
  });
  return res.data;
}

export async function createZone(dto: CrearZonaDTO): Promise<Zona> {
  const res = await axiosInstance.post<Zona>(API_ENDPOINTS.zonas.list, dto);
  return res.data;
}

export async function updateZone(id: number, dto: ActualizarZonaDTO): Promise<Zona> {
  const res = await axiosInstance.put<Zona>(API_ENDPOINTS.zonas.byId(id), dto);
  return res.data;
}

export async function deleteZone(id: number): Promise<void> {
  await axiosInstance.delete(API_ENDPOINTS.zonas.byId(id));
}

// ─── Sensores ─────────────────────────────────────────────────────────────────

export async function getSensors(params?: {
  zonaId?: number;
  estado?: EstadoSensor;
  tipo?: TipoSensor;
}): Promise<Sensor[]> {
  const res = await axiosInstance.get<Sensor[]>(API_ENDPOINTS.ble.sensores, { params });
  return res.data;
}

export async function getSensorById(id: number): Promise<Sensor> {
  const res = await axiosInstance.get<Sensor>(API_ENDPOINTS.ble.sensorById(id));
  return res.data;
}

export async function createSensor(dto: CrearSensorDTO): Promise<Sensor> {
  const res = await axiosInstance.post<Sensor>(API_ENDPOINTS.ble.sensores, dto);
  return res.data;
}

export async function updateSensor(id: number, dto: ActualizarSensorDTO): Promise<Sensor> {
  const res = await axiosInstance.put<Sensor>(API_ENDPOINTS.ble.sensorById(id), dto);
  return res.data;
}

// ─── Zonas permitidas por bebé ────────────────────────────────────────────────

export async function getAllowedZonesByEpisode(
  episodioId: number,
  soloActivas = false,
): Promise<ZonaPermitidaBebe[]> {
  const res = await axiosInstance.get<ZonaPermitidaBebe[]>(
    API_ENDPOINTS.zonasPermitidas.byEpisodio(episodioId),
    { params: { soloActivas } },
  );
  return res.data;
}

export async function createAllowedZoneForBaby(
  dto: CrearZonaPermitidaBebeDTO,
): Promise<ZonaPermitidaBebe> {
  const res = await axiosInstance.post<ZonaPermitidaBebe>(
    API_ENDPOINTS.zonasPermitidas.create,
    dto,
  );
  return res.data;
}

export async function revokeAllowedZone(id: number): Promise<ZonaPermitidaBebe> {
  const res = await axiosInstance.post<ZonaPermitidaBebe>(
    API_ENDPOINTS.zonasPermitidas.revocar(id),
  );
  return res.data;
}

// Re-export enums for convenience
export { TipoZona, EstadoZona, TipoSensor, EstadoSensor };
