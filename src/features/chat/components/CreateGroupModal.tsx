"use client";
import { useEffect, useRef, useState } from "react";
import { getMedicalStaff } from "@/features/staff-monitoring/services/medicalStaffService";
import { createGroupConversation } from "@/features/chat/services/chatService";
import type { PersonalMedico } from "@/features/staff-monitoring/types";
import type { ConversationSummary } from "@/features/chat/types";

interface CreateGroupModalProps {
  open: boolean;
  currentUserId: number;
  onClose: () => void;
  onCreated: (conv: ConversationSummary) => void;
}

// Modal para crear una nueva conversación grupal. Permite buscar y seleccionar usuarios, 
// asignar un nombre al grupo y crear la conversación.
export function CreateGroupModal({
  open,
  currentUserId,
  onClose,
  onCreated,
}: CreateGroupModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [groupName, setGroupName] = useState("");
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<PersonalMedico[]>([]);
  const [searching, setSearching] = useState(false);
  const [selected, setSelected] = useState<PersonalMedico[]>([]);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (open) {
      dialogRef.current?.showModal();
      setGroupName("");
      setSearch("");
      setResults([]);
      setSelected([]);
      setError(null);
    } else {
      dialogRef.current?.close();
    }
  }, [open]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!search.trim()) {
      setResults([]);
      return;
    }
    debounceRef.current = setTimeout(() => {
      setSearching(true);
      getMedicalStaff(1, 20, { nombre: search.trim() })
        .then((res) => {
          const selectedIds = new Set(selected.map((s) => s.id));
          setResults(
            res.datos.filter(
              (u) => u.id !== currentUserId && !selectedIds.has(u.id),
            ),
          );
        })
        .catch(() => {})
        .finally(() => setSearching(false));
    }, 350);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [search, currentUserId, selected]);

  function addUser(user: PersonalMedico) {
    setSelected((prev) => {
      if (prev.some((u) => u.id === user.id)) return prev;
      return [...prev, user];
    });
    setSearch("");
    setResults([]);
  }

  function removeUser(id: number) {
    setSelected((prev) => prev.filter((u) => u.id !== id));
  }

  async function handleCreate() {
    if (!groupName.trim()) {
      setError("El nombre del grupo es obligatorio.");
      return;
    }
    if (selected.length === 0) {
      setError("Selecciona al menos un participante.");
      return;
    }
    setCreating(true);
    setError(null);
    try {
      const conv = await createGroupConversation(
        groupName.trim(),
        selected.map((u) => u.id),
      );
      onCreated(conv);
    } catch {
      setError("No se pudo crear el grupo.");
    } finally {
      setCreating(false);
    }
  }

  return (
    <dialog ref={dialogRef} className="modal" onClose={onClose}>
      <div className="modal-box max-w-md p-0 overflow-hidden rounded-2xl">
        <div className="h-1" style={{ background: "linear-gradient(90deg, #1A2B5E, #09268E)" }} />

        <div className="px-5 pt-4 pb-3 border-b border-[#f1f5f9] flex items-center justify-between">
          <h3 className="text-sm font-bold text-[#0f172a]">Crear grupo</h3>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition cursor-pointer"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="px-5 py-4 space-y-4">
          {/* Group name */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5">
              Nombre del grupo
            </label>
            <input
              type="text"
              placeholder="Ej: Equipo de Urgencias"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              autoFocus
              className="w-full px-3 py-2 text-sm rounded-lg bg-[#f8fafc] border border-[#e2e8f0] focus:border-[#09268E]/50 focus:bg-white outline-none transition"
            />
          </div>

          {/* Selected chips */}
          {selected.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {selected.map((u) => (
                <span
                  key={u.id}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium bg-[#09268E]/10 text-[#09268E]"
                >
                  {u.nombre} {u.apellidos}
                  <button
                    type="button"
                    onClick={() => removeUser(u.id)}
                    className="ml-0.5 w-3.5 h-3.5 flex items-center justify-center rounded-full hover:bg-[#09268E]/20 transition cursor-pointer"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="size-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                    </svg>
                  </button>
                </span>
              ))}
            </div>
          )}

          {/* Search users */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5">
              Agregar participantes
            </label>
            <div className="relative">
              <svg xmlns="http://www.w3.org/2000/svg" className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-slate-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
              </svg>
              <input
                type="text"
                placeholder="Buscar por nombre..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-2 text-sm rounded-lg bg-[#f8fafc] border border-[#e2e8f0] focus:border-[#09268E]/50 focus:bg-white outline-none transition"
              />
            </div>

            {search.trim() && (
              <div className="mt-1.5 max-h-44 overflow-y-auto rounded-lg border border-[#e2e8f0] bg-white divide-y divide-[#f1f5f9]">
                {searching ? (
                  <div className="flex items-center justify-center py-4">
                    <span className="loading loading-spinner loading-sm text-[#09268E]" />
                  </div>
                ) : results.length === 0 ? (
                  <div className="py-4 text-center text-xs text-slate-400">
                    Sin resultados
                  </div>
                ) : (
                  results.map((user) => (
                    <button
                      key={user.id}
                      type="button"
                      onClick={() => addUser(user)}
                      className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-[#f8fafc] transition cursor-pointer text-left"
                    >
                      <div className="w-7 h-7 rounded-full bg-[#09268E]/10 text-[#09268E] flex items-center justify-center text-xs font-bold shrink-0">
                        {user.nombre[0]}{user.apellidos[0]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-[#0f172a] truncate">
                          {user.nombre} {user.apellidos}
                        </p>
                        <p className="text-[10px] text-slate-400 truncate">{user.email}</p>
                      </div>
                      <svg xmlns="http://www.w3.org/2000/svg" className="size-3.5 text-[#09268E] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                      </svg>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>

          {error && (
            <p className="text-xs text-red-500">{error}</p>
          )}
        </div>

        <div className="px-5 py-4 bg-[#f8fafc] border-t border-[#f1f5f9] flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={creating}
            className="px-4 py-2 rounded-lg text-sm font-semibold bg-white border border-[#e2e8f0] text-slate-700 hover:bg-slate-50 transition cursor-pointer disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={() => void handleCreate()}
            disabled={creating}
            className="px-4 py-2 rounded-lg text-sm font-semibold bg-[#09268E] text-white hover:bg-[#1A2B5E] transition cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
          >
            {creating && <span className="loading loading-spinner loading-xs" />}
            Crear grupo
          </button>
        </div>
      </div>
      <form method="dialog" className="modal-backdrop">
        <button type="submit" onClick={onClose}>close</button>
      </form>
    </dialog>
  );
}
