"use client";
import React, { useEffect, useRef, useState } from "react";
import { toast } from "@/lib/toast";
import { createGroup, updateGroup } from "../../services/groupsService";
import type { GrupoPersonal, CreateGrupoDto } from "../../types";

interface Props {
  open: boolean;
  grupo: GrupoPersonal | null;
  onClose: () => void;
  onSaved: (g: GrupoPersonal) => void;
}

const PALETTE = [
  "#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6",
  "#06b6d4", "#f97316", "#ec4899", "#6366f1", "#14b8a6",
  "#84cc16", "#e11d48",
];

function extractApiError(err: unknown, fallback: string): string {
  if (err && typeof err === "object" && "response" in err) {
    const r = (err as { response?: { data?: { mensaje?: string } } }).response;
    if (r?.data?.mensaje) return r.data.mensaje;
  }
  return fallback;
}

// Modal para crear o editar un grupo de personal, con campos para nombre y color. 
export function GroupFormModal({ open, grupo, onClose, onSaved }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [form, setForm] = useState<CreateGrupoDto>({ nombre: "", color: PALETTE[0] });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setForm(grupo ? { nombre: grupo.nombre, color: grupo.color } : { nombre: "", color: PALETTE[0] });
      dialogRef.current?.showModal();
    } else {
      dialogRef.current?.close();
    }
  }, [open, grupo]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.nombre.trim()) { toast.error("El nombre es requerido."); return; }
    setSaving(true);
    try {
      let saved: GrupoPersonal;
      if (grupo) {
        saved = await updateGroup(grupo.id, form);
      } else {
        saved = await createGroup(form);
      }
      toast.success(grupo ? "Grupo actualizado." : "Grupo creado.");
      onSaved(saved);
      onClose();
    } catch (err) {
      toast.error(extractApiError(err, "Error al guardar el grupo."));
    } finally {
      setSaving(false);
    }
  }

  const labelCls = "block text-xs font-semibold text-slate-600 mb-1";
  const inputCls = "w-full rounded-lg border border-[#e2e8f0] bg-white px-3 py-2 text-sm text-[#0f172a] focus:outline-none focus:ring-2 focus:ring-[#09268E]/30 focus:border-[#09268E] transition";

  return (
    <dialog ref={dialogRef} className="modal" onClose={onClose}>
      <div className="modal-box max-w-sm p-0 rounded-xl overflow-hidden flex flex-col">
        <div className="px-7 py-5 border-b border-[#f1f5f9] flex items-center justify-between">
          <h3 className="text-base font-bold text-[#0f172a]">
            {grupo ? "Editar grupo" : "Nuevo grupo de personal"}
          </h3>
          <button type="button" onClick={onClose} disabled={saving} className="btn btn-sm btn-ghost btn-circle text-slate-400">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col">
          <div className="px-7 py-5 space-y-4">
            <div>
              <label className={labelCls}>Nombre del grupo</label>
              <input
                className={inputCls}
                placeholder="Ej. Grupo A UCI"
                value={form.nombre}
                onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))}
              />
            </div>

            <div>
              <label className={labelCls}>Color identificador</label>
              <div className="flex flex-wrap gap-2 mt-1">
                {PALETTE.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, color: c }))}
                    className="w-7 h-7 rounded-full border-2 transition-transform hover:scale-110"
                    style={{
                      backgroundColor: c,
                      borderColor: form.color === c ? "#0f172a" : "transparent",
                      boxShadow: form.color === c ? `0 0 0 2px white, 0 0 0 4px ${c}` : "none",
                    }}
                  />
                ))}
              </div>
              <div className="flex items-center gap-2 mt-2">
                <span
                  className="w-5 h-5 rounded-full border border-slate-200"
                  style={{ backgroundColor: form.color }}
                />
                <span className="text-xs text-slate-500 font-mono">{form.color}</span>
                <input
                  type="color"
                  value={form.color}
                  onChange={(e) => setForm((f) => ({ ...f, color: e.target.value }))}
                  className="ml-auto w-8 h-7 rounded cursor-pointer border border-[#e2e8f0]"
                />
              </div>
            </div>
          </div>

          <div className="px-7 py-4 border-t border-[#f1f5f9] bg-[#f8fafc] flex items-center justify-end gap-3">
            <button type="button" onClick={onClose} disabled={saving} className="btn btn-sm btn-ghost text-slate-600">Cancelar</button>
            <button type="submit" disabled={saving} className="btn btn-sm text-white border-none" style={{ background: "#09268E" }}>
              {saving && <span className="loading loading-spinner loading-xs" />}
              {grupo ? "Guardar cambios" : "Crear grupo"}
            </button>
          </div>
        </form>
      </div>
      <form method="dialog" className="modal-backdrop"><button>close</button></form>
    </dialog>
  );
}
