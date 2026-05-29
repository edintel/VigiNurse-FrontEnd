"use client";
import React, { useEffect, useRef, useState } from "react";
import { toast } from "@/lib/toast";
import { getGroupMembers, addMember, removeMember } from "../../services/groupsService";
import { getMedicalStaff } from "../../services/medicalStaffService";
import type { GrupoPersonal, MiembroGrupo } from "../../types";

interface Props {
  open: boolean;
  grupo: GrupoPersonal | null;
  onClose: () => void;
}

function extractApiError(err: unknown, fallback: string): string {
  if (err && typeof err === "object" && "response" in err) {
    const r = (err as { response?: { data?: { mensaje?: string } } }).response;
    if (r?.data?.mensaje) return r.data.mensaje;
  }
  return fallback;
}

function Initials({ nombre, apellidos }: { nombre: string; apellidos: string }) {
  const i = (((nombre ?? "")[0] ?? "") + ((apellidos ?? "")[0] ?? "")).toUpperCase();
  return (
    <div className="w-8 h-8 rounded-full bg-[#09268E]/10 text-[#09268E] flex items-center justify-center text-xs font-bold shrink-0">
      {i}
    </div>
  );
}

async function enrichMiembros(raw: MiembroGrupo[]): Promise<MiembroGrupo[]> {
  const needsEnrich = raw.some((m) => !m.nombre && !m.apellidos);
  if (!needsEnrich) return raw;
  try {
    const personal = await getMedicalStaff(1, 500);
    const byId = Object.fromEntries(personal.datos.map((p) => [p.id, p]));
    return raw.map((m) => ({
      ...m,
      nombre: m.nombre || byId[m.usuarioId]?.nombre || "",
      apellidos: m.apellidos || byId[m.usuarioId]?.apellidos || "",
      especialidad: m.especialidad || byId[m.usuarioId]?.nombreEspecialidad || undefined,
    }));
  } catch {
    return raw;
  }
}

// Modal para mostrar los detalles de un grupo, incluyendo su lista de miembros y la opción de agregar o quitar miembros.
export function GroupDetailModal({ open, grupo, onClose }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [miembros, setMiembros] = useState<MiembroGrupo[]>([]);
  const [loadingMiembros, setLoadingMiembros] = useState(false);

  // Buscador de personal para agregar
  const [addOpen, setAddOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState<{ id: number; nombre: string; apellidos: string }[]>([]);
  const [searching, setSearching] = useState(false);
  const [addingId, setAddingId] = useState<number | null>(null);
  const [removingId, setRemovingId] = useState<number | null>(null);
  const [confirmRemove, setConfirmRemove] = useState<MiembroGrupo | null>(null);

  useEffect(() => {
    if (open && grupo) {
      dialogRef.current?.showModal();
      setLoadingMiembros(true);
      getGroupMembers(grupo.id)
        .then((raw) => enrichMiembros(raw))
        .then(setMiembros)
        .catch(() => toast.error("No se pudieron cargar los miembros."))
        .finally(() => setLoadingMiembros(false));
    } else {
      dialogRef.current?.close();
      setMiembros([]);
      setAddOpen(false);
      setSearch("");
      setConfirmRemove(null);
    }
  }, [open, grupo]);

  useEffect(() => {
    if (!search.trim()) { setSearchResults([]); return; }
    const t = setTimeout(async () => {
      setSearching(true);
      try {
        const result = await getMedicalStaff(1, 10, { nombre: search });
        setSearchResults(result.datos.map((p) => ({ id: p.id, nombre: p.nombre, apellidos: p.apellidos })));
      } catch {
        setSearchResults([]);
      } finally {
        setSearching(false);
      }
    }, 300);
    return () => clearTimeout(t);
  }, [search]);

  async function handleAdd(personal: { id: number; nombre: string; apellidos: string }) {
    if (!grupo) return;
    setAddingId(personal.id);
    try {
      await addMember(grupo.id, {
        usuarioId: personal.id,
        fechaIngreso: new Date().toISOString().slice(0, 10),
      });
      const updated = await enrichMiembros(await getGroupMembers(grupo.id));
      setMiembros(updated);
      toast.success(`${personal.nombre} ${personal.apellidos} agregado al grupo.`);
      setAddOpen(false);
      setSearch("");
    } catch (err) {
      toast.error(extractApiError(err, "No se pudo agregar el miembro."));
    } finally {
      setAddingId(null);
    }
  }

  async function handleRemove(m: MiembroGrupo) {
    if (!grupo) return;
    setRemovingId(m.usuarioId);
    try {
      await removeMember(grupo.id, m.usuarioId);
      setMiembros((prev) => prev.filter((x) => x.usuarioId !== m.usuarioId));
      toast.success("Miembro dado de baja del grupo.");
      setConfirmRemove(null);
    } catch (err) {
      toast.error(extractApiError(err, "No se pudo dar de baja al miembro."));
    } finally {
      setRemovingId(null);
    }
  }

  return (
    <dialog ref={dialogRef} className="modal" onClose={onClose}>
      <div className="modal-box max-w-lg p-0 rounded-xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div
          className="px-7 py-5 border-b border-[#f1f5f9] flex items-center justify-between"
          style={{ borderTop: `4px solid ${grupo?.color ?? "#09268E"}` }}
        >
          <div className="flex items-center gap-3">
            <span className="w-4 h-4 rounded-full shrink-0" style={{ backgroundColor: grupo?.color ?? "#09268E" }} />
            <div>
              <h3 className="text-base font-bold text-[#0f172a]">{grupo?.nombre}</h3>
              <p className="text-xs text-slate-500">{miembros.length} miembro{miembros.length !== 1 ? "s" : ""}</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="btn btn-sm btn-ghost btn-circle text-slate-400">✕</button>
        </div>

        <div className="flex-1 overflow-y-auto px-7 py-5 space-y-4">
          {/* Confirm remove overlay */}
          {confirmRemove && (
            <div className="rounded-lg bg-red-50 border border-red-200 p-4 space-y-3">
              <p className="text-sm text-red-700 font-medium">
                ¿Registrar salida de <strong>{confirmRemove.nombre} {confirmRemove.apellidos}</strong>?
              </p>
              <div className="flex gap-2">
                <button className="btn btn-xs btn-ghost text-slate-600" onClick={() => setConfirmRemove(null)}>Cancelar</button>
                <button
                  className="btn btn-xs btn-error text-white border-none"
                  disabled={removingId === confirmRemove.usuarioId}
                  onClick={() => void handleRemove(confirmRemove)}
                >
                  {removingId === confirmRemove.usuarioId && <span className="loading loading-spinner loading-xs" />}
                  Confirmar salida
                </button>
              </div>
            </div>
          )}

          {/* Miembros */}
          {loadingMiembros ? (
            <div className="flex justify-center py-6">
              <span className="loading loading-spinner loading-md text-[#09268E]" />
            </div>
          ) : miembros.length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-sm">El grupo no tiene miembros aún.</div>
          ) : (
            <div className="space-y-2">
              {miembros.map((m) => (
                <div key={m.usuarioId} className="flex items-center gap-3 p-3 rounded-lg border border-[#f1f5f9] hover:bg-[#f8fafc] transition-colors group">
                  <Initials nombre={m.nombre} apellidos={m.apellidos} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-[#0f172a] truncate">{m.nombre} {m.apellidos}</p>
                    <p className="text-xs text-slate-400">
                      {m.especialidad ? `${m.especialidad} · ` : ""}
                      Desde {new Date(m.fechaIngreso).toLocaleDateString("es-ES", { day: "2-digit", month: "short", year: "numeric" })}
                    </p>
                  </div>
                  <button
                    type="button"
                    title="Registrar salida"
                    onClick={() => setConfirmRemove(m)}
                    className="inline-flex items-center justify-center w-7 h-7 rounded-md text-red-400 hover:bg-red-50"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3 0 3-3m0 0-3-3m3 3H9" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Agregar miembro */}
          {!addOpen ? (
            <button
              type="button"
              onClick={() => setAddOpen(true)}
              className="w-full flex items-center justify-center gap-2 rounded-lg border-2 border-dashed border-[#e2e8f0] py-3 text-sm text-slate-500 hover:border-[#09268E] hover:text-[#09268E] transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              Agregar miembro
            </button>
          ) : (
            <div className="rounded-lg border border-[#e2e8f0] bg-[#f8fafc] p-4 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-[#1A2B5E]">Buscar personal</p>
                <button type="button" onClick={() => { setAddOpen(false); setSearch(""); }} className="text-slate-400 hover:text-slate-600 text-xs">Cancelar</button>
              </div>
              <input
                className="w-full rounded-lg border border-[#e2e8f0] bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#09268E]/30 focus:border-[#09268E] transition"
                placeholder="Nombre del profesional..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                autoFocus
              />
              {searching && <div className="flex justify-center py-2"><span className="loading loading-spinner loading-sm text-[#09268E]" /></div>}
              {!searching && searchResults.length > 0 && (
                <div className="space-y-1">
                  {searchResults.map((p) => (
                    <div key={p.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-white transition-colors border border-transparent hover:border-[#e2e8f0]">
                      <Initials nombre={p.nombre} apellidos={p.apellidos} />
                      <span className="flex-1 text-sm text-[#0f172a]">{p.nombre} {p.apellidos}</span>
                      <button
                        type="button"
                        disabled={addingId === p.id}
                        onClick={() => void handleAdd(p)}
                        className="btn btn-xs text-white border-none"
                        style={{ background: "#09268E" }}
                      >
                        {addingId === p.id ? <span className="loading loading-spinner loading-xs" /> : "Agregar"}
                      </button>
                    </div>
                  ))}
                </div>
              )}
              {!searching && search.trim() && searchResults.length === 0 && (
                <p className="text-xs text-slate-400 text-center py-2">Sin resultados.</p>
              )}
            </div>
          )}
        </div>

        <div className="px-7 py-4 border-t border-[#f1f5f9] bg-[#f8fafc] flex justify-end">
          <button type="button" onClick={onClose} className="btn btn-sm btn-ghost text-slate-600">Cerrar</button>
        </div>
      </div>
      <form method="dialog" className="modal-backdrop"><button>close</button></form>
    </dialog>
  );
}
