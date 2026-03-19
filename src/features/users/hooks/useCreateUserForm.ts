"use client";
import { useMemo, useState } from "react";
import {
  createUser,
  getRoles,
  getSpecialties,
} from "@/features/users/services/userManagementService";
import {
  type CreateUserDTO,
  type Role,
  type Specialty,
} from "@/features/users/types";
import { getHospitals } from "@/features/hospitals/services/hospitalService";
import type { Hospital } from "@/features/hospitals/types";
import { toast } from "@/lib/toast";
const EMPTY_FORM: CreateUserDTO = {
  nombre: "",
  apellidos: "",
  cedula: "",
  email: "",
  password: "",
  rolesIds: [],
  especialidadId: null,
  hospitalId: null,
};
type FormErrors = Partial<Record<keyof CreateUserDTO, string>>;

// Hook para manejar la logica del formulario de creacion de usuario.
export function useCreateUserForm(
  isSuperAdmin: boolean,
  onCreated: (user: import("@/features/users/types").User) => void,
  onClose: () => void,
) {
  const [form, setForm] = useState<CreateUserDTO>(EMPTY_FORM);
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [availableRoles, setAvailableRoles] = useState<Role[]>([]);
  const [rolesLoading, setRolesLoading] = useState(false);
  const [rolesError, setRolesError] = useState<string | null>(null);
  const [roleSearch, setRoleSearch] = useState("");
  const [showRoleDropdown, setShowRoleDropdown] = useState(false);
  const [availableSpecialties, setAvailableSpecialties] = useState<Specialty[]>(
    [],
  );
  const [specialtiesLoading, setSpecialtiesLoading] = useState(false);
  const [specialtiesError, setSpecialtiesError] = useState<string | null>(null);
  const [specialtySearch, setSpecialtySearch] = useState("");
  const [showSpecialtyDropdown, setShowSpecialtyDropdown] = useState(false);
  const [availableHospitals, setAvailableHospitals] = useState<Hospital[]>([]);
  const [hospitalsLoading, setHospitalsLoading] = useState(false);
  const [hospitalsError, setHospitalsError] = useState<string | null>(null);
  const [hospitalSearch, setHospitalSearch] = useState("");
  const [showHospitalDropdown, setShowHospitalDropdown] = useState(false);
  const filteredRoles = useMemo(
    () =>
      availableRoles.filter((r) =>
        r.nombre.toLowerCase().includes(roleSearch.trim().toLowerCase()),
      ),
    [availableRoles, roleSearch],
  );
  const filteredSpecialties = useMemo(
    () =>
      availableSpecialties.filter((s) =>
        s.nombre.toLowerCase().includes(specialtySearch.trim().toLowerCase()),
      ),
    [availableSpecialties, specialtySearch],
  );
  const filteredHospitals = useMemo(
    () =>
      availableHospitals.filter((h) =>
        h.nombre.toLowerCase().includes(hospitalSearch.trim().toLowerCase()),
      ),
    [availableHospitals, hospitalSearch],
  );
  const selectedRoles = useMemo(
    () => availableRoles.filter((r) => form.rolesIds.includes(r.id)),
    [availableRoles, form.rolesIds],
  );
  const selectedSpecialtyId =
    form.especialidadId !== null && form.especialidadId > 0
      ? form.especialidadId
      : null;
  const selectedHospital = useMemo(
    () => availableHospitals.find((h) => h.id === form.hospitalId) ?? null,
    [availableHospitals, form.hospitalId],
  );
  // Obtiene datos de roles.
  async function fetchRoles() {
    setRolesLoading(true);
    setRolesError(null);
    try {
      setAvailableRoles(await getRoles());
    } catch {
      setAvailableRoles([]);
      setRolesError("No se pudieron cargar los roles. Intente nuevamente.");
    } finally {
      setRolesLoading(false);
    }
  }
  // Obtiene datos de especialidades.
  async function fetchSpecialties() {
    setSpecialtiesLoading(true);
    setSpecialtiesError(null);
    try {
      setAvailableSpecialties(await getSpecialties());
    } catch {
      setAvailableSpecialties([]);
      setSpecialtiesError(
        "No se pudieron cargar las especialidades. Intente nuevamente.",
      );
    } finally {
      setSpecialtiesLoading(false);
    }
  }
  // Obtiene datos de hospitales.
  async function fetchHospitals() {
    setHospitalsLoading(true);
    setHospitalsError(null);
    try {
      const result = await getHospitals(1, 200);
      setAvailableHospitals(result.datos);
    } catch {
      setAvailableHospitals([]);
      setHospitalsError(
        "No se pudieron cargar los hospitales. Intente nuevamente.",
      );
    } finally {
      setHospitalsLoading(false);
    }
  }
  // Ejecuta la logica de restablecimiento.
  function reset() {
    setForm(EMPTY_FORM);
    setErrors({});
    setApiError(null);
    setRoleSearch("");
    setSpecialtySearch("");
    setHospitalSearch("");
    setShowRoleDropdown(false);
    setShowSpecialtyDropdown(false);
    setShowHospitalDropdown(false);
  }
  // Maneja cambio.
  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target;
    if (!["nombre", "apellidos", "cedula", "email", "password"].includes(name))
      return;
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: undefined }));
    setApiError(null);
  }
  // Maneja el toggle de seleccion de rol.
  function handleRoleToggle(role: Role) {
    setForm((prev) => {
      const already = prev.rolesIds.includes(role.id);
      return {
        ...prev,
        rolesIds: already
          ? prev.rolesIds.filter((id) => id !== role.id)
          : [...prev.rolesIds, role.id],
      };
    });
    setErrors((prev) => ({ ...prev, rolesIds: undefined }));
    setApiError(null);
  }
  // Maneja eliminacion de rol.
  function handleRemoveRole(id: number) {
    setForm((prev) => ({
      ...prev,
      rolesIds: prev.rolesIds.filter((r) => r !== id),
    }));
  }
  // Maneja la seleccion de especialidad.
  function handleSpecialtySelect(specialty: Specialty) {
    setSpecialtySearch(specialty.nombre);
    setForm((prev) => ({ ...prev, especialidadId: specialty.id }));
    setErrors((prev) => ({ ...prev, especialidadId: undefined }));
    setApiError(null);
    setShowSpecialtyDropdown(false);
  }
  // Maneja cambio de busqueda de especialidad.
  function handleSpecialtySearchChange(e: React.ChangeEvent<HTMLInputElement>) {
    setSpecialtySearch(e.target.value);
    setShowSpecialtyDropdown(true);
    setForm((prev) => ({ ...prev, especialidadId: 0 }));
    setErrors((prev) => ({ ...prev, especialidadId: undefined }));
    setApiError(null);
  }
  // Maneja la seleccion de hospital.
  function handleHospitalSelect(hospital: Hospital) {
    setHospitalSearch(hospital.nombre);
    setForm((prev) => ({ ...prev, hospitalId: hospital.id }));
    setErrors((prev) => ({ ...prev, hospitalId: undefined }));
    setApiError(null);
    setShowHospitalDropdown(false);
  }
  // Maneja cambio de busqueda de hospital.
  function handleHospitalSearchChange(e: React.ChangeEvent<HTMLInputElement>) {
    setHospitalSearch(e.target.value);
    setShowHospitalDropdown(true);
    setForm((prev) => ({ ...prev, hospitalId: null }));
    setErrors((prev) => ({ ...prev, hospitalId: undefined }));
    setApiError(null);
  }
  // Valida condiciones del flujo.
  function validate(): boolean {
    const next: FormErrors = {};
    if (!form.nombre.trim()) next.nombre = "El nombre es obligatorio.";
    if (!form.apellidos.trim())
      next.apellidos = "Los apellidos son obligatorios.";
    if (!form.email.trim()) next.email = "El email es obligatorio.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      next.email = "El email no es válido.";
    if (!form.password.trim())
      next.password = "La contraseña temporal es obligatoria.";
    if (form.rolesIds.length === 0)
      next.rolesIds = "Debe seleccionar al menos un rol.";
    if (isSuperAdmin && form.hospitalId === null)
      next.hospitalId = "Debe seleccionar un hospital para el SuperAdmin.";
    setErrors(next);
    return Object.keys(next).length === 0;
  }
  // Maneja envio.
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    setApiError(null);
    try {
      const payload: CreateUserDTO = {
        ...form,
        hospitalId: isSuperAdmin ? form.hospitalId : null,
      };
      const user = await createUser(payload);
      toast.success(
        `Usuario ${form.nombre} ${form.apellidos} creado exitosamente.`,
      );
      onCreated(user);
      onClose();
    } catch (err: unknown) {
      const responseData = (
        err as {
          response?: {
            data?: {
              message?: string;
              mensaje?: string;
            };
          };
        }
      )?.response?.data;
      const msg =
        responseData?.mensaje ??
        responseData?.message ??
        "No se pudo crear el usuario. Intente nuevamente.";
      setApiError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }
  return {
    form,
    errors,
    loading,
    apiError,
    availableRoles,
    rolesLoading,
    rolesError,
    roleSearch,
    showRoleDropdown,
    filteredRoles,
    selectedRoles,
    setRoleSearch,
    setShowRoleDropdown,
    fetchRoles,
    handleRoleToggle,
    handleRemoveRole,
    specialtiesLoading,
    specialtiesError,
    specialtySearch,
    showSpecialtyDropdown,
    filteredSpecialties,
    selectedSpecialtyId,
    setShowSpecialtyDropdown,
    fetchSpecialties,
    handleSpecialtySelect,
    handleSpecialtySearchChange,
    hospitalsLoading,
    hospitalsError,
    hospitalSearch,
    showHospitalDropdown,
    filteredHospitals,
    selectedHospital,
    setShowHospitalDropdown,
    fetchHospitals,
    handleHospitalSelect,
    handleHospitalSearchChange,
    handleChange,
    handleSubmit,
    reset,
  };
}
