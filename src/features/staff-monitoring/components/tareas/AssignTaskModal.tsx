"use client";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "@/lib/toast";
import { SearchableSelect } from "@/shared/ui/SearchableSelect";
import { getRoles } from "@/features/administration/users/services/userManagementService";
import type { Role } from "@/features/administration/users/types";
import { createAsignacionTarea, updateAsignacionTarea } from "../../services/assignmentService";
import { getSugerenciasPersonal } from "../../services/workloadService";
import { getPersonalMedico } from "../../services/personalMedicoService";
import type { Tarea, AsignacionTarea, SugerenciaPersonal, PersonalMedico } from "../../types";
import {
  NivelCargaBadge,
  DisponibilidadBadge,
  extractApiError,
} from "./taskHelpers";

interface Props {
  open: boolean;
  tarea: Tarea | null;
  asignacion: AsignacionTarea | null;
  mode: "assign" | "reassign";
  onClose: () => void;
  onSuccess: () => void;
}

type SelectorMode = "suggest" | "search";

const inputCls =
  "w-full rounded-lg border border-[#e2e8f0] bg-white px-3 py-2 text-sm text-[#0f172a] focus:outline-none focus:ring-2 focus:ring-[#09268E]/30 focus:border-[#09268E] transition";

const ALLOWED_ROLE_FILTERS = new Set(["doctor", "enfermero", "tecnico"]);

function normalizeRoleName(name: string) {
  return name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}


// Componente para asignar o reasignar una tarea a un personal médico. 
// Permite recibir sugerencias basadas en el área de la tarea o buscar por nombre, con opción de filtrar por rol. 
// Muestra información relevante del personal sugerido o encontrado, como su disponibilidad y nivel de carga actual.
export function AssignTaskModal({ open, tarea, asignacion, mode, onClose, onSuccess }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [selectorMode, setSelectorMode] = useState<SelectorMode>("suggest");
  const [roles, setRoles] = useState<Role[]>([]);
  const [rolesLoading, setRolesLoading] = useState(false);
  const [rolesError, setRolesError] = useState<string | null>(null);
  const [roleSelectedId, setRoleSelectedId] = useState<number | null>(null);
  const [roleSearch, setRoleSearch] = useState("");
  const [showRoleDropdown, setShowRoleDropdown] = useState(false);
  const [suggestions, setSuggestions] = useState<SugerenciaPersonal[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [selectedUser, setSelectedUser] = useState<{ id: number; nombre: string } | null>(null);
  const [userSearch, setUserSearch] = useState("");
  const [searchResults, setSearchResults] = useState<PersonalMedico[]>([]);
  const [searching, setSearching] = useState(false);
  const [saving, setSaving] = useState(false);

  const selectedRole = useMemo(
    () => roles.find((role) => role.id === roleSelectedId) ?? null,
    [roles, roleSelectedId],
  );

  const filteredRoles = useMemo(() => {
    const query = roleSearch.trim().toLowerCase();
    if (!query || roleSelectedId !== null) return roles;
    return roles.filter((role) =>
      `${role.nombre} ${role.descripcion}`.toLowerCase().includes(query),
    );
  }, [roles, roleSearch, roleSelectedId]);

  const fetchRoles = useCallback(async () => {
    setRolesLoading(true);
    setRolesError(null);
    try {
      const list = await getRoles();
      setRoles(list.filter((role) => ALLOWED_ROLE_FILTERS.has(normalizeRoleName(role.nombre))));
    } catch {
      setRolesError("No se pudieron cargar los roles.");
      setRoles([]);
    } finally {
      setRolesLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open) {
      setSelectorMode("suggest");
      setRoleSelectedId(null);
      setRoleSearch("");
      setShowRoleDropdown(false);
      setSuggestions([]);
      setSelectedUser(null);
      setUserSearch("");
      setSearchResults([]);
      void fetchRoles();
      dialogRef.current?.showModal();
    } else {
      dialogRef.current?.close();
    }
  }, [open, fetchRoles]);

 
  useEffect(() => {
    if (!open || selectorMode !== "suggest" || !tarea) return;
    setLoadingSuggestions(true);
    getSugerenciasPersonal({ areaId: tarea.areaId, rolId: roleSelectedId ?? undefined })
      .then(setSuggestions)
      .catch(() => setSuggestions([]))
      .finally(() => setLoadingSuggestions(false));
  }, [open, selectorMode, tarea, roleSelectedId]);

  
  useEffect(() => {
    if (selectorMode !== "search" || !userSearch.trim()) {
      setSearchResults([]);
      return;
    }
    const t = setTimeout(() => {
      setSearching(true);
      getPersonalMedico(1, 50, { nombre: userSearch, rol: selectedRole?.nombre })
        .then((r) => {
          const filtered = tarea?.areaId != null
            ? r.datos.filter((p) => p.areaId === tarea.areaId)
            : r.datos;
          setSearchResults(filtered);
        })
        .catch(() => setSearchResults([]))
        .finally(() => setSearching(false));
    }, 300);
    return () => clearTimeout(t);
  }, [selectorMode, userSearch, selectedRole?.nombre, tarea]);

  function handleSelectSuggestion(s: SugerenciaPersonal) {
    setSelectedUser({ id: s.usuarioId, nombre: s.nombreCompleto });
  }

  function handleSelectSearchResult(p: PersonalMedico) {
    setSelectedUser({ id: p.id, nombre: `${p.nombre} ${p.apellidos}` });
  }

  async function handleSubmit() {
    if (!tarea || !selectedUser) return;
    setSaving(true);
    try {
      if (mode === "assign") {
        await createAsignacionTarea({ tareaId: tarea.id, usuarioId: selectedUser.id });
        toast.success(`Tarea asignada a ${selectedUser.nombre}.`);
      } else {
        if (!asignacion) {
          toast.error("No se encontró la asignación actual.");
          return;
        }
        await updateAsignacionTarea(asignacion.id, { usuarioId: selectedUser.id });
        toast.success(`Tarea reasignada a ${selectedUser.nombre}.`);
      }
      onSuccess();
      onClose();
    } catch (err) {
      toast.error(
        extractApiError(
          err,
          mode === "assign" ? "No se pudo asignar la tarea." : "No se pudo reasignar la tarea.",
        ),
      );
    } finally {
      setSaving(false);
    }
  }

  const title = mode === "assign" ? "Asignar tarea" : "Reasignar tarea";
  const btnLabel = mode === "assign" ? "Asignar" : "Reasignar";

  return (
    <dialog ref={dialogRef} className="modal" onClose={onClose}>
      <div className="modal-box max-w-xl p-0 rounded-xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-7 py-5 border-b border-[#f1f5f9] flex items-start justify-between">
          <div>
            <h3 className="text-base font-bold text-[#0f172a]">{title}</h3>
            {tarea && (
              <p className="text-xs text-slate-500 mt-0.5">
                {tarea.nombreTipoTarea} · {tarea.nombreArea}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="btn btn-sm btn-ghost btn-circle text-slate-400 hover:text-slate-700"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="px-7 py-5 flex-1 overflow-y-auto space-y-5">
          {/* Task description */}
          {tarea && (
            <div className="rounded-lg bg-[#f8fafc] border border-[#e2e8f0] px-4 py-3">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-[0.5px] mb-1">Tarea</p>
              <p className="text-sm text-[#0f172a] line-clamp-2">{tarea.descripcion}</p>
            </div>
          )}

          {/* Current assignee for reassign */}
          {mode === "reassign" && asignacion && (
            <div className="rounded-lg bg-amber-50 border border-amber-200 px-4 py-3">
              <p className="text-xs font-semibold text-amber-600 uppercase tracking-[0.5px] mb-1">
                Responsable actual
              </p>
              <p className="text-sm font-medium text-[#0f172a]">{asignacion.nombreUsuario}</p>
            </div>
          )}

          {/* Mode selector */}
          <div>
            <p className="text-xs font-semibold text-slate-600 mb-2">
              ¿Cómo deseas seleccionar al responsable?
            </p>
            <div className="flex gap-2">
              {(["suggest", "search"] as SelectorMode[]).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => {
                    setSelectorMode(m);
                    setSelectedUser(null);
                    setUserSearch("");
                    setSearchResults([]);
                  }}
                  className={`flex-1 py-2 px-3 rounded-lg border text-sm font-medium transition ${
                    selectorMode === m
                      ? "border-[#09268E] bg-[#09268E]/5 text-[#09268E]"
                      : "border-[#e2e8f0] text-slate-500 hover:border-slate-300"
                  }`}
                >
                  {m === "suggest" ? "Recibir sugerencias" : "Buscar usuario"}
                </button>
              ))}
            </div>
          </div>

          {/* Suggest mode */}
          {selectorMode === "suggest" && (
            <div className="space-y-3">
              <SearchableSelect
                id="assign-task-role-filter"
                label="Filtrar por rol"
                options={filteredRoles.map((role) => ({
                  id: role.id,
                  label: role.nombre,
                  sublabel: role.descripcion,
                }))}
                loading={rolesLoading}
                selectedId={roleSelectedId}
                searchValue={roleSearch}
                onSearchChange={(e) => {
                  setRoleSearch(e.target.value);
                  setRoleSelectedId(null);
                  setShowRoleDropdown(true);
                  setSelectedUser(null);
                }}
                onSelect={(opt) => {
                  setRoleSelectedId(opt.id);
                  setRoleSearch(opt.label);
                  setShowRoleDropdown(false);
                  setSelectedUser(null);
                }}
                showDropdown={showRoleDropdown}
                onFocus={() => setShowRoleDropdown(true)}
                onBlur={() => setTimeout(() => setShowRoleDropdown(false), 120)}
                placeholder="Todos los roles"
                loadingText="Cargando roles..."
                emptyText="No se encontraron roles."
                fetchError={rolesError ?? undefined}
                onRetry={fetchRoles}
                onClear={() => {
                  setRoleSelectedId(null);
                  setRoleSearch("");
                  setSelectedUser(null);
                }}
                clearLabel="Todos"
                disabled={saving}
                inputClassName="!bg-white !border-[#e2e8f0] !text-[#0f172a] !placeholder:text-slate-400"
              />

              {loadingSuggestions ? (
                <div className="flex justify-center py-6">
                  <span className="loading loading-spinner loading-md text-[#09268E]" />
                </div>
              ) : suggestions.length === 0 ? (
                <p className="text-center text-sm text-slate-400 py-4">
                  No se encontraron sugerencias para esta área.
                </p>
              ) : (
                <div className="space-y-2 max-h-[240px] overflow-y-auto pr-1">
                  {suggestions.map((s, i) => {
                    const isSelected = selectedUser?.id === s.usuarioId;
                    return (
                      <button
                        key={s.usuarioId}
                        type="button"
                        onClick={() => handleSelectSuggestion(s)}
                        className={`w-full text-left rounded-lg border px-4 py-3 transition ${
                          isSelected
                            ? "border-[#09268E] bg-[#09268E]/5"
                            : i === 0
                            ? "border-emerald-300 bg-emerald-50 hover:border-emerald-400"
                            : "border-[#e2e8f0] hover:border-slate-300 bg-white"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="text-sm font-semibold text-[#0f172a] truncate">
                                {s.nombreCompleto}
                              </span>
                              {i === 0 && !isSelected && (
                                <span className="shrink-0 text-[10px] font-bold text-emerald-700 bg-emerald-100 rounded-full px-1.5 py-0.5">
                                  Recomendado
                                </span>
                              )}
                              {isSelected && (
                                <svg xmlns="http://www.w3.org/2000/svg" className="size-4 text-[#09268E] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                                </svg>
                              )}
                            </div>
                            <p className="text-[11px] text-slate-500 mt-0.5 truncate">
                              {s.rol}{s.especialidad ? ` · ${s.especialidad}` : ""}
                            </p>
                          </div>
                          <div className="flex flex-col items-end gap-1 shrink-0">
                            <DisponibilidadBadge estado={s.estado} descripcion={s.estadoDescripcion} />
                            <NivelCargaBadge nivel={s.nivelCarga} descripcion={s.nivelCargaDescripcion} />
                          </div>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-1">
                          {s.totalTareasActivas} tarea{s.totalTareasActivas !== 1 ? "s" : ""} activa{s.totalTareasActivas !== 1 ? "s" : ""}
                        </p>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Search mode */}
          {selectorMode === "search" && (
            <div className="space-y-3">
              {tarea?.areaId != null && (
                <p className="text-[11px] text-slate-400 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
                  Los resultados están filtrados por el área de la tarea y el rol seleccionado.
                </p>
              )}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Buscar por nombre
                </label>
                <div className="relative">
                  <input
                    className={inputCls}
                    placeholder="Escribe el nombre del usuario..."
                    value={userSearch}
                    onChange={(e) => { setUserSearch(e.target.value); setSelectedUser(null); }}
                  />
                  {searching && (
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 loading loading-spinner loading-xs text-slate-400" />
                  )}
                </div>
              </div>

              {searchResults.length > 0 && (
                <div className="space-y-1.5 max-h-[200px] overflow-y-auto pr-1">
                  {searchResults.map((p) => {
                    const isSelected = selectedUser?.id === p.id;
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => handleSelectSearchResult(p)}
                        className={`w-full text-left rounded-lg border px-4 py-2.5 transition ${
                          isSelected
                            ? "border-[#09268E] bg-[#09268E]/5"
                            : "border-[#e2e8f0] hover:border-slate-300 bg-white"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="text-sm font-semibold text-[#0f172a]">
                              {p.nombre} {p.apellidos}
                            </span>
                            <p className="text-[11px] text-slate-500">
                              {p.roles[0] ?? "—"}{p.nombreEspecialidad ? ` · ${p.nombreEspecialidad}` : ""}
                            </p>
                          </div>
                          {isSelected && (
                            <svg xmlns="http://www.w3.org/2000/svg" className="size-4 text-[#09268E]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                            </svg>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}

              {userSearch.trim() && !searching && searchResults.length === 0 && (
                <p className="text-center text-sm text-slate-400 py-2">
                  No se encontraron usuarios con ese nombre.
                </p>
              )}
            </div>
          )}

          {/* Selected user confirmation */}
          {selectedUser && (
            <div className="rounded-lg border border-[#09268E] bg-[#09268E]/5 px-4 py-3 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-semibold text-[#09268E] uppercase tracking-[0.5px] mb-0.5">
                  Responsable seleccionado
                </p>
                <p className="text-sm font-semibold text-[#0f172a]">{selectedUser.nombre}</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedUser(null)}
                className="text-slate-400 hover:text-slate-600 transition"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-7 py-4 border-t border-[#f1f5f9] bg-[#f8fafc] flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="btn btn-sm btn-ghost text-slate-600"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={() => void handleSubmit()}
            disabled={saving || !selectedUser}
            className="btn btn-sm text-white border-none disabled:opacity-50"
            style={{ background: "#09268E" }}
          >
            {saving && <span className="loading loading-spinner loading-xs" />}
            {btnLabel}
          </button>
        </div>
      </div>
      <form method="dialog" className="modal-backdrop">
        <button>close</button>
      </form>
    </dialog>
  );
}
