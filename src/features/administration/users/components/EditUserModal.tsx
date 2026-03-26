"use client";
import { useEffect, useRef } from "react";
import { SearchableSelect } from "@/shared/ui/SearchableSelect";
import { RoleMultiSelect } from "@/features/administration/users/components/RoleMultiSelect";
import { useEditUserForm } from "@/features/administration/users/hooks/useEditUserForm";
import type { User } from "@/features/administration/users/types";
interface EditUserModalProps {
  open: boolean;
  user: User | null;
  onClose: () => void;
  onUpdated: (user: User) => void;
}
// Componente para mostrar un campo de solo lectura.
function ReadOnlyField({ label, value }: { label: string; value: string }) {
  return (
    <div className="form-control w-full">
      <label className="label pb-1">
        <span className="label-text text-sm font-medium text-slate-400">
          {label}
        </span>
      </label>
      <input
        type="text"
        value={value}
        readOnly
        className="input input-bordered w-full bg-slate-100 text-slate-400 cursor-not-allowed"
      />
    </div>
  );
}
// Componente principal del modal para editar un usuario.
export function EditUserModal({
  open,
  user,
  onClose,
  onUpdated,
}: EditUserModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const f = useEditUserForm(user, onUpdated, onClose);
  useEffect(() => {
    if (open && user) {
      f.initForUser();
      dialogRef.current?.showModal();
      void f.fetchRoles();
      void f.fetchSpecialties();
    } else {
      dialogRef.current?.close();
    }
  }, [open, user]);
  useEffect(() => {
    f.resolveRoleIds();
  }, [f.availableRoles, user]);
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

        <h3 className="text-lg font-bold text-[#1A2B5E] mb-1">
          Editar usuario
        </h3>
        {user && <p className="text-sm text-slate-400 mb-4">{user.email}</p>}

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
            <ReadOnlyField label="Nombre" value={user?.nombre ?? ""} />
            <ReadOnlyField label="Apellidos" value={user?.apellidos ?? ""} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <ReadOnlyField
              label="Cédula"
              value={user?.cedula?.trim() || "Sin cédula"}
            />
            <ReadOnlyField
              label="Correo electrónico"
              value={user?.email ?? ""}
            />
          </div>

          <RoleMultiSelect
            selectedRoles={f.selectedRoles}
            filteredRoles={f.filteredRoles}
            selectedIds={f.selectedRoleIds}
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
            error={f.roleError ?? undefined}
            disabled={f.loading}
          />

          <SearchableSelect
            id="edit-especialidad"
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
            onClear={f.handleClearSpecialty}
            clearLabel="Quitar especialidad"
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
              {f.loading ? "Guardando..." : "Guardar cambios"}
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
