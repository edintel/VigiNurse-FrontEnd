"use client";
import { useEffect, useRef, useState } from "react";
import { getMedicalStaff } from "@/features/staff-monitoring/services/medicalStaffService";
import { createDirectConversation } from "@/features/chat/services/chatService";
import type { PersonalMedico } from "@/features/staff-monitoring/types";
import type { ConversationSummary } from "@/features/chat/types";

interface NewDirectChatModalProps {
  open: boolean;
  currentUserId: number;
  onClose: () => void;
  onCreated: (conv: ConversationSummary) => void;
}

// Modal para crear un nuevo chat directo con otro usuario. 
// Permite buscar por nombre y muestra resultados en tiempo real con debounce. 
// Al seleccionar un usuario, se crea la conversación y se notifica al padre.
export function NewDirectChatModal({
  open,
  currentUserId,
  onClose,
  onCreated,
}: NewDirectChatModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<PersonalMedico[]>([]);
  const [searching, setSearching] = useState(false);
  const [creating, setCreating] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (open) {
      dialogRef.current?.showModal();
      setSearch("");
      setResults([]);
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
      setError(null);
      getMedicalStaff(1, 20, { nombre: search.trim() })
        .then((res) => {
          setResults(
            res.datos.filter((u) => u.id !== currentUserId),
          );
        })
        .catch(() => setError("Error al buscar usuarios."))
        .finally(() => setSearching(false));
    }, 350);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [search, currentUserId]);

  async function handleSelect(user: PersonalMedico) {
    setCreating(user.id);
    setError(null);
    try {
      const conv = await createDirectConversation(user.id);
      onCreated(conv);
    } catch {
      setError("No se pudo crear la conversación.");
    } finally {
      setCreating(null);
    }
  }

  return (
    <dialog ref={dialogRef} className="modal" onClose={onClose}>
      <div className="modal-box max-w-sm p-0 overflow-hidden rounded-2xl">
        <div className="h-1" style={{ background: "linear-gradient(90deg, #1A2B5E, #09268E)" }} />

        <div className="px-5 pt-4 pb-3 border-b border-[#f1f5f9] flex items-center justify-between">
          <h3 className="text-sm font-bold text-[#0f172a]">Nuevo chat directo</h3>
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

        <div className="px-5 py-4 space-y-3">
          <div className="relative">
            <svg xmlns="http://www.w3.org/2000/svg" className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-slate-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
            </svg>
            <input
              type="text"
              placeholder="Buscar por nombre..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              autoFocus
              className="w-full pl-8 pr-3 py-2 text-sm rounded-lg bg-[#f8fafc] border border-[#e2e8f0] focus:border-[#09268E]/50 focus:bg-white outline-none transition"
            />
          </div>

          {error && (
            <p className="text-xs text-red-500">{error}</p>
          )}

          <div className="max-h-64 overflow-y-auto space-y-0 rounded-lg border border-[#e2e8f0] divide-y divide-[#f1f5f9] bg-white">
            {searching ? (
              <div className="flex items-center justify-center py-6">
                <span className="loading loading-spinner loading-sm text-[#09268E]" />
              </div>
            ) : !search.trim() ? (
              <div className="flex items-center justify-center py-8 text-slate-400 text-xs">
                Escribe un nombre para buscar
              </div>
            ) : results.length === 0 ? (
              <div className="flex items-center justify-center py-8 text-slate-400 text-xs">
                Sin resultados
              </div>
            ) : (
              results.map((user) => (
                <button
                  key={user.id}
                  type="button"
                  disabled={creating === user.id}
                  onClick={() => void handleSelect(user)}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[#f8fafc] transition cursor-pointer disabled:opacity-60 text-left"
                >
                  <div className="w-8 h-8 rounded-full bg-[#09268E]/10 text-[#09268E] flex items-center justify-center text-xs font-bold shrink-0">
                    {user.nombre[0]}{user.apellidos[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[#0f172a] truncate">
                      {user.nombre} {user.apellidos}
                    </p>
                    <p className="text-[11px] text-slate-400 truncate">{user.email}</p>
                  </div>
                  {creating === user.id && (
                    <span className="loading loading-spinner loading-xs text-[#09268E]" />
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      </div>
      <form method="dialog" className="modal-backdrop">
        <button type="submit" onClick={onClose}>close</button>
      </form>
    </dialog>
  );
}
