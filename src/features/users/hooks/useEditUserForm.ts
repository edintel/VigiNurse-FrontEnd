"use client";
import { useMemo, useState } from "react";
import {
  updateUser,
  getRoles,
  getSpecialties,
} from "@/features/users/services/userManagementService";
import { type User, type Role, type Specialty } from "@/features/users/types";
import { toast } from "@/lib/toast";

// Hook para manejar la logica de edicion de usuario.
export function useEditUserForm(
  user: User | null,
  onUpdated: (user: User) => void,
  onClose: () => void,
) {
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [availableRoles, setAvailableRoles] = useState<Role[]>([]);
  const [rolesLoading, setRolesLoading] = useState(false);
  const [rolesError, setRolesError] = useState<string | null>(null);
  const [roleSearch, setRoleSearch] = useState("");
  const [selectedRoleIds, setSelectedRoleIds] = useState<number[]>([]);
  const [showRoleDropdown, setShowRoleDropdown] = useState(false);
  const [roleError, setRoleError] = useState<string | null>(null);
  const [availableSpecialties, setAvailableSpecialties] = useState<Specialty[]>(
    [],
  );
  const [specialtiesLoading, setSpecialtiesLoading] = useState(false);
  const [specialtiesError, setSpecialtiesError] = useState<string | null>(null);
  const [specialtySearch, setSpecialtySearch] = useState("");
  const [selectedSpecialtyId, setSelectedSpecialtyId] = useState<number | null>(
    null,
  );
  const [showSpecialtyDropdown, setShowSpecialtyDropdown] = useState(false);
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
  const selectedRoles = useMemo(
    () => availableRoles.filter((r) => selectedRoleIds.includes(r.id)),
    [availableRoles, selectedRoleIds],
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
  // Ejecuta logica de inicializacion para usuario dado.
  function initForUser() {
    setRoleSearch("");
    setSelectedRoleIds([]);
    setSpecialtySearch(user?.nombreEspecialidad ?? "");
    setSelectedSpecialtyId(user?.especialidadId ?? null);
    setApiError(null);
    setRoleError(null);
    setShowRoleDropdown(false);
    setShowSpecialtyDropdown(false);
  }
  // Ejecuta la logica para resolver los ids de rol seleccionados a partir de los nombres de rol del usuario.
  function resolveRoleIds() {
    if (
      availableRoles.length > 0 &&
      user?.roles &&
      selectedRoleIds.length === 0
    ) {
      const matched = availableRoles
        .filter((r) => user.roles.includes(r.nombre))
        .map((r) => r.id);
      if (matched.length > 0) setSelectedRoleIds(matched);
    }
  }
  // Maneja toggle seleccion rol.
  function handleRoleToggle(role: Role) {
    setSelectedRoleIds((prev) =>
      prev.includes(role.id)
        ? prev.filter((id) => id !== role.id)
        : [...prev, role.id],
    );
    setRoleError(null);
    setApiError(null);
  }
  // Maneja eliminacion rol.
  function handleRemoveRole(id: number) {
    setSelectedRoleIds((prev) => prev.filter((r) => r !== id));
  }
  // Maneja cambio busqueda especialidad.
  function handleSpecialtySearchChange(e: React.ChangeEvent<HTMLInputElement>) {
    setSpecialtySearch(e.target.value);
    setSelectedSpecialtyId(null);
    setApiError(null);
    setShowSpecialtyDropdown(true);
  }
  // Maneja la seleccion de una especialidad.
  function handleSpecialtySelect(specialty: Specialty) {
    setSpecialtySearch(specialty.nombre);
    setSelectedSpecialtyId(specialty.id);
    setApiError(null);
    setShowSpecialtyDropdown(false);
  }
  // Maneja la limpieza de la seleccion de especialidad.
  function handleClearSpecialty() {
    setSpecialtySearch("");
    setSelectedSpecialtyId(null);
    setApiError(null);
  }
  // Valida condiciones del flujo.
  function validate(): boolean {
    if (selectedRoleIds.length === 0) {
      setRoleError("Debe seleccionar al menos un rol.");
      return false;
    }
    return true;
  }
  // Maneja envio.
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !validate()) return;
    setLoading(true);
    setApiError(null);
    try {
      const updated = await updateUser(user.id, {
        nombre: user.nombre,
        apellidos: user.apellidos,
        cedula: user.cedula ?? "",
        email: user.email,
        rolesIds: selectedRoleIds,
        especialidadId: selectedSpecialtyId,
      });
      toast.success(
        `Usuario ${user.nombre} ${user.apellidos} actualizado exitosamente.`,
      );
      onUpdated(updated);
      onClose();
    } catch (err: unknown) {
      const msg = (
        err as {
          response?: {
            data?: {
              message?: string;
              mensaje?: string;
            };
          };
        }
      )?.response?.data;
      const errorMsg =
        msg?.mensaje ??
        msg?.message ??
        "No se pudo actualizar el usuario. Intente nuevamente.";
      setApiError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  }
  return {
    loading,
    apiError,
    availableRoles,
    rolesLoading,
    rolesError,
    roleSearch,
    selectedRoleIds,
    showRoleDropdown,
    roleError,
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
    selectedSpecialtyId,
    showSpecialtyDropdown,
    filteredSpecialties,
    setShowSpecialtyDropdown,
    fetchSpecialties,
    handleSpecialtySearchChange,
    handleSpecialtySelect,
    handleClearSpecialty,
    handleSubmit,
    initForUser,
    resolveRoleIds,
  };
}
