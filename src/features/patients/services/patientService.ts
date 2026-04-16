import axiosInstance from "@/lib/axios";
import { API_ENDPOINTS } from "@/config/api";
import type {
  Paciente,
  PaginatedPacientes,
  CreatePacienteDTO,
  CreateContactoDTO,
  UpdatePacienteDTO,
  UpdateContactoDTO,
  ContactoPaciente,
  PacienteFilters,
  Alergia,
  CreateAlergiaDTO,
  UpdateAlergiaDTO,
} from "@/features/patients/types";

// Obtiene pacientes paginados con filtros opcionales.
export async function getPatients(
  page = 1,
  pageSize = 10,
  filters: PacienteFilters = {},
): Promise<PaginatedPacientes> {
  const params: Record<string, unknown> = { pagina: page, tamanio: pageSize };
  if (filters.nombre) params.nombre = filters.nombre;
  if (filters.cedula) params.cedula = filters.cedula;
  const res = await axiosInstance.get<PaginatedPacientes>(
    API_ENDPOINTS.pacientes.list,
    { params },
  );
  return res.data;
}

// Obtiene un paciente por ID.
export async function getPatientById(id: number): Promise<Paciente> {
  const res = await axiosInstance.get<Paciente>(
    API_ENDPOINTS.pacientes.byId(id),
  );
  return res.data;
}

// Crea un nuevo paciente.
export async function createPatient(dto: CreatePacienteDTO): Promise<Paciente> {
  const res = await axiosInstance.post<Paciente>(
    API_ENDPOINTS.pacientes.list,
    dto,
  );
  return res.data;
}

// Agrega un contacto a un paciente.
export async function createPatientContact(
  id: number,
  dto: CreateContactoDTO,
): Promise<ContactoPaciente> {
  const res = await axiosInstance.post<ContactoPaciente>(
    API_ENDPOINTS.pacientes.contactos(id),
    dto,
  );
  return res.data;
}

// Obtiene los contactos de un paciente.
export async function getPatientContacts(
  id: number,
): Promise<ContactoPaciente[]> {
  const res = await axiosInstance.get<ContactoPaciente[]>(
    API_ENDPOINTS.pacientes.contactos(id),
  );
  return res.data;
}

// Actualiza los datos editables de un paciente.
export async function updatePatient(
  id: number,
  dto: UpdatePacienteDTO,
): Promise<Paciente> {
  const res = await axiosInstance.put<Paciente>(
    API_ENDPOINTS.pacientes.byId(id),
    dto,
  );
  return res.data;
}

// ─── Alergias ─────────────────────────────────────────────────────────────────

// Obtiene las alergias de un paciente.
export async function getPatientAllergies(id: number): Promise<Alergia[]> {
  const res = await axiosInstance.get<Alergia[]>(
    API_ENDPOINTS.pacientes.alergias(id),
  );
  return res.data;
}

// Registra una nueva alergia para un paciente.
export async function createAllergy(
  pacienteId: number,
  dto: CreateAlergiaDTO,
): Promise<Alergia> {
  const res = await axiosInstance.post<Alergia>(
    API_ENDPOINTS.pacientes.alergias(pacienteId),
    dto,
  );
  return res.data;
}

// Actualiza una alergia existente de un paciente.
export async function updateAllergy(
  pacienteId: number,
  alergiaId: number,
  dto: UpdateAlergiaDTO,
): Promise<Alergia> {
  const res = await axiosInstance.put<Alergia>(
    API_ENDPOINTS.pacientes.alergiaById(pacienteId, alergiaId),
    dto,
  );
  return res.data;
}

// Elimina una alergia de un paciente.
export async function deleteAllergy(
  pacienteId: number,
  alergiaId: number,
): Promise<void> {
  await axiosInstance.delete(
    API_ENDPOINTS.pacientes.alergiaById(pacienteId, alergiaId),
  );
}

// Crea una cuenta de usuario para un paciente (acceso al portal del paciente).
export async function createPatientAccount(cedula: string, email: string): Promise<void> {
  await axiosInstance.post(API_ENDPOINTS.pacientes.cuenta, { cedula, email });
}

// Actualiza el contacto de emergencia de un paciente.
export async function updatePatientContact(
  pacienteId: number,
  contactoId: number,
  dto: UpdateContactoDTO,
): Promise<ContactoPaciente> {
  const res = await axiosInstance.put<ContactoPaciente>(
    API_ENDPOINTS.pacientes.contactoById(pacienteId, contactoId),
    dto,
  );
  return res.data;
}
