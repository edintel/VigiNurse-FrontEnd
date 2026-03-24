"use client";
import React, { useEffect, useState, useCallback } from "react";
import {
  getUsers,
  getRoles,
  getSpecialties,
} from "@/features/administration/users/services/userManagementService";
import { CreateUserModal } from "@/features/administration/users/components/CreateUserModal";
import { EditUserModal } from "@/features/administration/users/components/EditUserModal";
import { DeactivateConfirmModal } from "@/features/administration/users/components/DeactivateConfirmModal";
import { PaginationFooter } from "@/shared/ui/PaginationFooter";
import {
  FilterPanel,
  FilterLabel,
  filterInputCls,
} from "@/shared/ui/FilterPanel";
import { formatDate } from "@/features/administration/users/utils/helpers";
import { User, Role, Specialty, UserFilters } from "@/features/administration/users/types";
const USERS_PAGE_SIZE = 10;
const EMPTY_FILTERS: UserFilters = {
  nombre: "",
  apellidos: "",
  cedula: "",
  email: "",
  rol: "",
  especialidadId: undefined,
  bloqueado: undefined,
};
// Componente principal de la página de gestión de usuarios. Incluye listado, filtros, paginación y modales para crear/editar/bloquear usuarios.
export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [totalRegistros, setTotalRegistros] = useState(0);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [paginaActual, setPaginaActual] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<UserFilters>(EMPTY_FILTERS);
  const [appliedFilters, setAppliedFilters] =
    useState<UserFilters>(EMPTY_FILTERS);
  const [roles, setRoles] = useState<Role[]>([]);
  const [specialties, setSpecialties] = useState<Specialty[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [blockUser, setBlockUser] = useState<User | null>(null);
  const fetchUsers = useCallback(async (page: number, f: UserFilters) => {
    setLoading(true);
    setError(null);
    try {
      const result = await getUsers(page, USERS_PAGE_SIZE, f);
      setUsers(result.datos);
      setTotalRegistros(result.totalRegistros);
      setTotalPaginas(result.totalPaginas);
      setPaginaActual(result.paginaActual);
    } catch {
      setError("No se pudieron cargar los usuarios. Intente nuevamente.");
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    void fetchUsers(1, EMPTY_FILTERS);
    getRoles()
      .then(setRoles)
      .catch(() => setRoles([]));
    getSpecialties()
      .then(setSpecialties)
      .catch(() => setSpecialties([]));
  }, [fetchUsers]);
  // Maneja aplicacion de filtros.
  function handleApplyFilters(e: React.FormEvent) {
    e.preventDefault();
    setAppliedFilters(filters);
    void fetchUsers(1, filters);
  }
  // Maneja la limpieza de filtros.
  function handleClearFilters() {
    setFilters(EMPTY_FILTERS);
    setAppliedFilters(EMPTY_FILTERS);
    void fetchUsers(1, EMPTY_FILTERS);
  }
  // Maneja el cambio de página.
  function handlePageChange(page: number) {
    void fetchUsers(page, appliedFilters);
  }
  // Maneja la creación de un nuevo usuario.
  function handleUserCreated(user: User) {
    setUsers((prev) => [user, ...prev]);
    setTotalRegistros((n) => n + 1);
  }
  // Maneja la actualización de un usuario existente.
  function handleUserUpdated(updated: User) {
    setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
  }
  // Maneja la confirmación de bloqueo/desbloqueo de un usuario.
  function handleBlockConfirmed() {
    void fetchUsers(paginaActual, appliedFilters);
  }
  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button
          type="button"
          className="btn text-white"
          style={{ backgroundColor: "#09268E", borderColor: "#09268E" }}
          onClick={() => setShowCreate(true)}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth="2.5"
            stroke="currentColor"
            className="size-[1.2em]"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 4.5v15m7.5-7.5h-15"
            />
          </svg>
          Nuevo usuario
        </button>
      </div>

      <FilterPanel onApply={handleApplyFilters} onClear={handleClearFilters}>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="flex flex-col gap-1">
            <FilterLabel>Nombre</FilterLabel>
            <input
              type="text"
              className={filterInputCls}
              placeholder="Buscar nombre..."
              value={filters.nombre ?? ""}
              onChange={(e) =>
                setFilters((f) => ({ ...f, nombre: e.target.value }))
              }
            />
          </div>

          <div className="flex flex-col gap-1">
            <FilterLabel>Apellidos</FilterLabel>
            <input
              type="text"
              className={filterInputCls}
              placeholder="Buscar apellidos..."
              value={filters.apellidos ?? ""}
              onChange={(e) =>
                setFilters((f) => ({ ...f, apellidos: e.target.value }))
              }
            />
          </div>

          <div className="flex flex-col gap-1">
            <FilterLabel>Cédula</FilterLabel>
            <input
              type="text"
              className={filterInputCls}
              placeholder="Buscar cédula..."
              value={filters.cedula ?? ""}
              onChange={(e) =>
                setFilters((f) => ({ ...f, cedula: e.target.value }))
              }
            />
          </div>

          <div className="flex flex-col gap-1">
            <FilterLabel>Email</FilterLabel>
            <input
              type="text"
              className={filterInputCls}
              placeholder="Buscar email..."
              value={filters.email ?? ""}
              onChange={(e) =>
                setFilters((f) => ({ ...f, email: e.target.value }))
              }
            />
          </div>
        </div>

        <div className="flex gap-4 items-end">
          <div className="flex flex-col gap-1 flex-1">
            <FilterLabel>Rol</FilterLabel>
            <select
              className={filterInputCls}
              value={filters.rol ?? ""}
              onChange={(e) =>
                setFilters((f) => ({ ...f, rol: e.target.value || undefined }))
              }
            >
              <option value="">Todos</option>
              {roles.map((r) => (
                <option key={r.id} value={r.nombre}>
                  {r.nombre}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1 flex-1">
            <FilterLabel>Especialidad</FilterLabel>
            <select
              className={filterInputCls}
              value={filters.especialidadId ?? ""}
              onChange={(e) =>
                setFilters((f) => ({
                  ...f,
                  especialidadId: e.target.value
                    ? Number(e.target.value)
                    : undefined,
                }))
              }
            >
              <option value="">Todas</option>
              {specialties.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.nombre}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1 w-36 flex-none">
            <FilterLabel>Estado</FilterLabel>
            <select
              className={filterInputCls}
              value={
                filters.bloqueado === undefined
                  ? ""
                  : filters.bloqueado
                    ? "bloqueado"
                    : "activo"
              }
              onChange={(e) =>
                setFilters((f) => ({
                  ...f,
                  bloqueado:
                    e.target.value === ""
                      ? undefined
                      : e.target.value === "bloqueado",
                }))
              }
            >
              <option value="">Todos</option>
              <option value="activo">Activo</option>
              <option value="bloqueado">Bloqueado</option>
            </select>
          </div>
        </div>
      </FilterPanel>

      <div className="bg-white rounded-xl shadow-sm border border-[#E2E8F0] overflow-hidden">
        {error && (
          <div role="alert" className="alert alert-error m-4 text-sm py-3">
            <span>{error}</span>
            <button
              className="btn btn-xs btn-ghost"
              onClick={() => fetchUsers(paginaActual, appliedFilters)}
            >
              Reintentar
            </button>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="table table-zebra w-full [&_td]:py-2.5 [&_th]:py-2.5">
            <thead>
              <tr className="bg-[#F8FAFC] text-[#1A2B5E]">
                <th className="text-xs font-semibold uppercase tracking-wide">
                  Nombre
                </th>
                <th className="text-xs font-semibold uppercase tracking-wide">
                  Cédula
                </th>
                <th className="text-xs font-semibold uppercase tracking-wide">
                  Email
                </th>
                <th className="text-xs font-semibold uppercase tracking-wide">
                  Rol
                </th>
                <th className="text-xs font-semibold uppercase tracking-wide">
                  Especialidad
                </th>
                <th className="text-xs font-semibold uppercase tracking-wide">
                  Estado
                </th>
                <th className="text-xs font-semibold uppercase tracking-wide">
                  Creado
                </th>
                <th className="text-xs font-semibold uppercase tracking-wide text-right">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} className="text-center py-12">
                    <span className="loading loading-spinner loading-md text-[#09268E]" />
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="text-center py-12 text-base-content/40 text-sm"
                  >
                    No se encontraron usuarios.
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id} className="hover:bg-base-200">
                    <td>
                      <span className="font-semibold text-[#1A2B5E]">
                        {user.nombre} {user.apellidos}
                      </span>
                    </td>
                    <td className="text-base-content/70">
                      {user.cedula ?? (
                        <span className="text-base-content/30">—</span>
                      )}
                    </td>
                    <td className="text-base-content/70">{user.email}</td>
                    <td>
                      {user.roles.length > 0 ? (
                        <span className="badge badge-soft badge-primary">
                          {user.roles[0]}
                        </span>
                      ) : (
                        <span className="text-base-content/30">—</span>
                      )}
                    </td>
                    <td className="text-base-content/70">
                      {user.nombreEspecialidad ?? (
                        <span className="text-base-content/30">—</span>
                      )}
                    </td>
                    <td>
                      <span
                        className={`badge badge-soft ${user.bloqueado ? "badge-error" : "badge-success"}`}
                      >
                        {user.bloqueado ? "Bloqueado" : "Activo"}
                      </span>
                    </td>
                    <td className="text-base-content/60">
                      {formatDate(user.fechaCreacion)}
                    </td>
                    <td>
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          className="btn btn-square btn-sm btn-ghost text-[#09268E]"
                          title="Editar usuario"
                          onClick={() => setEditUser(user)}
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth="2.5"
                            stroke="currentColor"
                            className="size-4"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Z"
                            />
                          </svg>
                        </button>
                        <button
                          type="button"
                          className={`btn btn-square btn-sm btn-ghost ${user.bloqueado ? "text-success" : "text-warning"}`}
                          title={
                            user.bloqueado
                              ? "Desbloquear usuario"
                              : "Bloquear usuario"
                          }
                          onClick={() => setBlockUser(user)}
                        >
                          {user.bloqueado ? (
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              fill="none"
                              viewBox="0 0 24 24"
                              strokeWidth="2.5"
                              stroke="currentColor"
                              className="size-4"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M13.5 10.5V6.75a4.5 4.5 0 1 1 9 0v3.75M3.75 21.75h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H3.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z"
                              />
                            </svg>
                          ) : (
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              fill="none"
                              viewBox="0 0 24 24"
                              strokeWidth="2.5"
                              stroke="currentColor"
                              className="size-4"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z"
                              />
                            </svg>
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <PaginationFooter
          current={paginaActual}
          total={totalPaginas}
          totalRecords={totalRegistros}
          showing={users.length}
          onPageChange={handlePageChange}
        />
      </div>

      <CreateUserModal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        onCreated={handleUserCreated}
      />
      <EditUserModal
        open={editUser !== null}
        user={editUser}
        onClose={() => setEditUser(null)}
        onUpdated={handleUserUpdated}
      />
      <DeactivateConfirmModal
        open={blockUser !== null}
        user={blockUser}
        onClose={() => setBlockUser(null)}
        onConfirmed={handleBlockConfirmed}
      />
    </div>
  );
}
