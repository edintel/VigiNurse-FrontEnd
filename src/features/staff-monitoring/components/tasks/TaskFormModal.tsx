"use client";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "@/lib/toast";
import { SearchableSelect } from "@/shared/ui/SearchableSelect";
import { getRoles } from "@/features/administration/users/services/userManagementService";
import type { Role } from "@/features/administration/users/types";
import { createTask } from "../../services/taskService";
import { createTaskAssignment } from "../../services/assignmentService";
import { getStaffSuggestions } from "../../services/workloadService";
import { getMedicalStaff } from "../../services/medicalStaffService";
import type {
  TipoTarea,
  Area,
  SugerenciaPersonal,
  PersonalMedico,
  PrioridadTarea,
} from "../../types";
import { WorkloadLevelBadge, DisponibilidadBadge, extractApiError } from "./taskHelpers";

interface Props {
  open: boolean;
  tiposTarea: TipoTarea[];
  areas: Area[];
  onClose: () => void;
  onSuccess: () => void;
}

type SelectorMode = "suggest" | "search";

const PRIORIDADES = [
  { label: "Baja", value: 0 },
  { label: "Media", value: 1 },
  { label: "Alta", value: 2 },
];

const labelCls = "block text-xs font-semibold text-slate-600 mb-1";
const inputCls =
  "w-full rounded-lg border border-[#e2e8f0] bg-white px-3 py-2 text-sm text-[#0f172a] focus:outline-none focus:ring-2 focus:ring-[#09268E]/30 focus:border-[#09268E] transition";

const ALLOWED_ROLE_FILTERS = new Set(["doctor", "enfermero", "tecnico"]);

function normalizeRoleName(name: string) {
  return name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

interface FormState {
  tipoTareaId: number;
  areaId: number;
  prioridad: PrioridadTarea;
  descripcion: string;
  episodioId: string;
}

const EMPTY_FORM: FormState = {
  tipoTareaId: 0,
  areaId: 0,
  prioridad: 1 as PrioridadTarea,
  descripcion: "",
  episodioId: "",
};

// Componente modal para crear una nueva tarea, con opción de asignar responsable desde sugerencias o búsqueda
export function TaskFormModal({ open, tiposTarea, areas, onClose, onSuccess }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
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
      setForm(EMPTY_FORM);
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
    if (!open || !form.areaId || selectorMode !== "suggest") {
      setSuggestions([]);
      return;
    }
    setLoadingSuggestions(true);
    getStaffSuggestions({ areaId: form.areaId, rolId: roleSelectedId ?? undefined })
      .then(setSuggestions)
      .catch(() => setSuggestions([]))
      .finally(() => setLoadingSuggestions(false));
  }, [open, form.areaId, selectorMode, roleSelectedId]);


  useEffect(() => {
    if (selectorMode !== "search" || !userSearch.trim()) {
      setSearchResults([]);
      return;
    }
    const t = setTimeout(() => {
      setSearching(true);
      getMedicalStaff(1, 50, { nombre: userSearch, rol: selectedRole?.nombre })
        .then((r) => {
          const filtered = form.areaId > 0
            ? r.datos.filter((p) => p.areaId === form.areaId)
            : r.datos;
          setSearchResults(filtered);
        })
        .catch(() => setSearchResults([]))
        .finally(() => setSearching(false));
    }, 300);
    return () => clearTimeout(t);
  }, [selectorMode, userSearch, selectedRole?.nombre, form.areaId]);

  function validateForm(): string | null {
    if (!form.tipoTareaId) return "Selecciona un tipo de tarea.";
    if (!form.areaId) return "Selecciona un área.";
    if (!form.descripcion.trim()) return "La descripción es requerida.";
    if (form.episodioId && isNaN(Number(form.episodioId))) return "El ID de episodio debe ser un número.";
    return null;
  }

  async function handleCreate(withAssign: boolean) {
    const validationError = validateForm();
    if (validationError) { toast.error(validationError); return; }
    if (withAssign && !selectedUser) { toast.error("Selecciona un responsable para asignar la tarea."); return; }

    setSaving(true);
    try {
      const tarea = await createTask({
        tipoTareaId: form.tipoTareaId,
        areaId: form.areaId,
        prioridad: form.prioridad,
        descripcion: form.descripcion.trim(),
        episodioId: form.episodioId ? Number(form.episodioId) : null,
      });

      if (withAssign && selectedUser) {
        try {
          await createTaskAssignment({ tareaId: tarea.id, usuarioId: selectedUser.id });
          toast.success(`Tarea creada y asignada a ${selectedUser.nombre}.`);
        } catch {
          toast.warning("Tarea creada pero no se pudo asignar. Asígnala manualmente desde la tabla.");
        }
      } else {
        toast.success("Tarea creada. Puedes asignarla desde la tabla.");
      }

      onSuccess();
      onClose();
    } catch (err) {
      toast.error(extractApiError(err, "No se pudo crear la tarea."));
    } finally {
      setSaving(false);
    }
  }

  const areaSelected = form.areaId > 0;

  return (
    <dialog ref={dialogRef} className="modal" onClose={onClose}>
      <div className="modal-box max-w-2xl p-0 rounded-xl overflow-hidden flex flex-col max-h-[94vh]">
        {/* Header */}
        <div className="px-7 py-5 border-b border-[#f1f5f9] flex items-start justify-between">
          <div>
            <h3 className="text-base font-bold text-[#0f172a]">Nueva tarea</h3>
            <p className="text-xs text-slate-500 mt-0.5">Completa los campos y opcionalmente asigna un responsable.</p>
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
          {/* Row 1: tipo + prioridad */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Tipo de tarea *</label>
              <select
                className={inputCls + " cursor-pointer"}
                value={form.tipoTareaId || ""}
                onChange={(e) => setForm((f) => ({ ...f, tipoTareaId: Number(e.target.value) }))}
              >
                <option value="">Seleccionar tipo...</option>
                {tiposTarea.map((t) => (
                  <option key={t.id} value={t.id}>{t.nombre}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelCls}>Prioridad *</label>
              <div className="flex gap-2">
                {PRIORIDADES.map(({ label, value }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, prioridad: value as PrioridadTarea }))}
                    className={`flex-1 py-2 px-2 rounded-lg border text-xs font-semibold transition ${
                      form.prioridad === value
                        ? value === 0
                          ? "border-emerald-400 bg-emerald-50 text-emerald-700"
                          : value === 1
                          ? "border-amber-400 bg-amber-50 text-amber-700"
                          : "border-rose-400 bg-rose-50 text-rose-700"
                        : "border-[#e2e8f0] text-slate-500 hover:border-slate-300"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Row 2: área */}
          <div>
            <label className={labelCls}>Área *</label>
            <select
              className={inputCls + " cursor-pointer"}
              value={form.areaId || ""}
              onChange={(e) => {
                const newAreaId = Number(e.target.value);
                setForm((f) => ({ ...f, areaId: newAreaId }));
                setSelectedUser(null);
                setSuggestions([]);
              }}
            >
              <option value="">Seleccionar área...</option>
              {areas.map((a) => (
                <option key={a.id} value={a.id}>{a.nombre}</option>
              ))}
            </select>
          </div>

          {/* Row 3: descripción */}
          <div>
            <label className={labelCls}>Descripción *</label>
            <textarea
              className={inputCls + " resize-none"}
              rows={3}
              placeholder="Describe la tarea a realizar..."
              value={form.descripcion}
              onChange={(e) => setForm((f) => ({ ...f, descripcion: e.target.value }))}
            />
          </div>

          {/* Row 4: episodio (optional) */}
          <div>
            <label className={labelCls}>ID de episodio (opcional)</label>
            <input
              type="number"
              className={inputCls}
              placeholder="Ej. 1042"
              value={form.episodioId}
              onChange={(e) => setForm((f) => ({ ...f, episodioId: e.target.value }))}
            />
          </div>

          {/* Divider */}
          <div className="border-t border-[#f1f5f9]" />

          {/* Responsable section */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <h4 className="text-sm font-bold text-[#1A2B5E]">Responsable</h4>
              <span className="text-[10px] text-slate-400 font-medium">(opcional)</span>
            </div>

            {!areaSelected ? (
              <div className="rounded-lg border border-dashed border-[#e2e8f0] px-4 py-4 text-center text-sm text-slate-400">
                Selecciona un área primero para elegir un responsable.
              </div>
            ) : (
              <div className="space-y-4">
                {/* Mode selector */}
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

                {/* Suggest mode */}
                {selectorMode === "suggest" && (
                  <div className="space-y-3">
                    <SearchableSelect
                      id="task-role-filter"
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
                      <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                        {suggestions.map((s, i) => {
                          const isSelected = selectedUser?.id === s.usuarioId;
                          return (
                            <button
                              key={s.usuarioId}
                              type="button"
                              onClick={() => setSelectedUser({ id: s.usuarioId, nombre: s.nombreCompleto })}
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
                                  <WorkloadLevelBadge nivel={s.nivelCarga} descripcion={s.nivelCargaDescripcion} />
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
                    <p className="text-[11px] text-slate-400 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
                      Los resultados están filtrados por el área y el rol seleccionado.
                    </p>
                    <div>
                      <label className={labelCls}>Buscar por nombre</label>
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
                      <div className="space-y-1.5 max-h-[180px] overflow-y-auto pr-1">
                        {searchResults.map((p) => {
                          const isSelected = selectedUser?.id === p.id;
                          return (
                            <button
                              key={p.id}
                              type="button"
                              onClick={() => setSelectedUser({ id: p.id, nombre: `${p.nombre} ${p.apellidos}` })}
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
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-7 py-4 border-t border-[#f1f5f9] bg-[#f8fafc] flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="btn btn-sm btn-ghost text-slate-600"
          >
            Cancelar
          </button>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => void handleCreate(false)}
              disabled={saving}
              className="btn btn-sm btn-ghost text-[#09268E] border border-[#09268E]/30 hover:bg-[#09268E]/5"
            >
              {saving && !selectedUser && <span className="loading loading-spinner loading-xs" />}
              Crear sin asignar
            </button>
            <button
              type="button"
              onClick={() => void handleCreate(true)}
              disabled={saving || !selectedUser}
              className="btn btn-sm text-white border-none disabled:opacity-50"
              style={{ background: "#09268E" }}
            >
              {saving && selectedUser && <span className="loading loading-spinner loading-xs" />}
              Crear y asignar
            </button>
          </div>
        </div>
      </div>
      <form method="dialog" className="modal-backdrop">
        <button>close</button>
      </form>
    </dialog>
  );
}
