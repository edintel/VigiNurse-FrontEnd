"use client";
import { useEffect, useRef } from "react";
import { InputField } from "@/shared/ui/InputField";
import { SearchableSelect } from "@/shared/ui/SearchableSelect";
import { RoleMultiSelect } from "@/features/administration/users/components/RoleMultiSelect";
import { useCreateUserForm } from "@/features/administration/users/hooks/useCreateUserForm";
import type { User } from "@/features/administration/users/types";
import { useAppSelector } from "@/store/hooks";
import { selectCurrentRole } from "@/store/slices/authSlice";
interface CreateUserModalProps {
  open: boolean;
  onClose: () => void;
  onCreated: (user: User) => void;
}
// Componente modal para crear un nuevo usuario, con campos para nombre, apellidos, cédula, correo electrónico, contraseña temporal, roles, hospital (si es SUPER_ADMIN) y especialidad. Utiliza el hook useCreateUserForm para manejar el estado del formulario y las operaciones relacionadas.
export function CreateUserModal({
  open,
  onClose,
  onCreated,
}: CreateUserModalProps) {
  const currentRole = useAppSelector(selectCurrentRole);
  const isSuperAdmin = currentRole === "SUPER_ADMIN";
  const dialogRef = useRef<HTMLDialogElement>(null);
  const f = useCreateUserForm(isSuperAdmin, onCreated, onClose);
  useEffect(() => {
    if (open) {
      dialogRef.current?.showModal();
      void f.fetchRoles();
      void f.fetchSpecialties();
      void f.fetchHospitals();
    } else {
      dialogRef.current?.close();
      f.reset();
    }
  }, [open]);
  return (
    <dialog ref={dialogRef} className="modal" onClose={onClose}>
      <div className="modal-box bg-[#EEEEEE] w-full max-w-lg">
        <button
          type="button"
          className="absolute right-3 top-3 text-gray-500 hover:text-[#1A2B5E] transition-colors"
          onClick={onClose}
        >
          ✕
        </button>

        <h3 className="text-lg font-bold text-[#1A2B5E] mb-4">
          Crear nuevo usuario
        </h3>

        {f.apiError && (
          <div role="alert" className="alert alert-error text-sm py-3 mb-4">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 shrink-0 stroke-current"
              fill="none"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span>{f.apiError}</span>
          </div>
        )}

        <form
          onSubmit={f.handleSubmit}
          noValidate
          className="flex flex-col gap-3"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <InputField
              label="Nombre"
              id="create-nombre"
              name="nombre"
              value={f.form.nombre}
              onChange={f.handleChange}
              placeholder="Juan"
              error={f.errors.nombre}
              required
            />
            <InputField
              label="Apellidos"
              id="create-apellidos"
              name="apellidos"
              value={f.form.apellidos}
              onChange={f.handleChange}
              placeholder="Pérez García"
              error={f.errors.apellidos}
              required
            />
          </div>

          <InputField
            label="Cédula"
            id="create-cedula"
            name="cedula"
            value={f.form.cedula}
            onChange={f.handleChange}
            placeholder="1-1234-5678"
            error={f.errors.cedula}
          />

          <InputField
            label="Correo electrónico"
            id="create-email"
            name="email"
            type="email"
            autoComplete="off"
            value={f.form.email}
            onChange={f.handleChange}
            placeholder="usuario@hospital.com"
            error={f.errors.email}
            required
          />

          <InputField
            label="Contraseña temporal"
            id="create-password"
            name="password"
            type="password"
            autoComplete="new-password"
            value={f.form.password}
            onChange={f.handleChange}
            placeholder="••••••••"
            error={f.errors.password}
            required
          />

          <RoleMultiSelect
            selectedRoles={f.selectedRoles}
            filteredRoles={f.filteredRoles}
            selectedIds={f.form.rolesIds}
            loading={f.loading}
            rolesLoading={f.rolesLoading}
            rolesError={f.rolesError}
            searchValue={f.roleSearch}
            showDropdown={f.showRoleDropdown}
            onSearchChange={(v) => {
              f.setRoleSearch(v);
              f.setShowRoleDropdown(true);
            }}
            onFocus={() => f.setShowRoleDropdown(true)}
            onBlur={() => setTimeout(() => f.setShowRoleDropdown(false), 120)}
            onToggle={f.handleRoleToggle}
            onRemove={f.handleRemoveRole}
            onRetry={f.fetchRoles}
            error={f.errors.rolesIds}
            disabled={f.loading}
          />

          {isSuperAdmin && (
            <SearchableSelect
              id="create-hospital"
              label="Hospital"
              required
              options={f.filteredHospitals.map((h) => ({
                id: h.id,
                label: h.nombre,
                sublabel: `ID: ${h.id}`,
              }))}
              loading={f.hospitalsLoading}
              selectedId={f.form.hospitalId}
              searchValue={f.hospitalSearch}
              onSearchChange={f.handleHospitalSearchChange}
              onSelect={(opt) =>
                f.handleHospitalSelect(
                  f.filteredHospitals.find((h) => h.id === opt.id)!,
                )
              }
              showDropdown={f.showHospitalDropdown}
              onFocus={() => f.setShowHospitalDropdown(true)}
              onBlur={() =>
                setTimeout(() => f.setShowHospitalDropdown(false), 120)
              }
              placeholder="Buscar hospital por nombre"
              loadingText="Cargando hospitales..."
              emptyText="No se encontraron hospitales."
              fetchError={f.hospitalsError ?? undefined}
              onRetry={f.fetchHospitals}
              error={f.errors.hospitalId}
              disabled={f.loading}
            />
          )}

          <SearchableSelect
            id="create-especialidad"
            label="Especialidad"
            options={f.filteredSpecialties.map((s) => ({
              id: s.id,
              label: s.nombre,
              sublabel: s.descripcion,
            }))}
            loading={f.specialtiesLoading}
            selectedId={f.selectedSpecialtyId}
            searchValue={f.specialtySearch}
            onSearchChange={f.handleSpecialtySearchChange}
            onSelect={(opt) =>
              f.handleSpecialtySelect(
                f.filteredSpecialties.find((s) => s.id === opt.id)!,
              )
            }
            showDropdown={f.showSpecialtyDropdown}
            onFocus={() => f.setShowSpecialtyDropdown(true)}
            onBlur={() =>
              setTimeout(() => f.setShowSpecialtyDropdown(false), 120)
            }
            placeholder="Buscar especialidad por nombre"
            loadingText="Cargando especialidades..."
            emptyText="No se encontraron especialidades."
            fetchError={f.specialtiesError ?? undefined}
            onRetry={f.fetchSpecialties}
            error={f.errors.especialidadId}
            disabled={f.loading}
          />

          <div className="modal-action mt-2">
            <button
              type="button"
              className="btn text-white"
              style={{ backgroundColor: "#ff627d", borderColor: "#ff627d" }}
              onClick={onClose}
              disabled={f.loading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              style={{ backgroundColor: "#09268E", borderColor: "#09268E" }}
              disabled={f.loading}
            >
              {f.loading && (
                <span className="loading loading-spinner loading-sm" />
              )}
              {f.loading ? "Creando..." : "Crear usuario"}
            </button>
          </div>
        </form>
      </div>

      <form method="dialog" className="modal-backdrop">
        <button type="submit" onClick={onClose}>
          close
        </button>
      </form>
    </dialog>
  );
}
