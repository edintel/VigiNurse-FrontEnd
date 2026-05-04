"use client";
import React, { useEffect, useRef, useState } from "react";
import { toast } from "@/lib/toast";
import { createTipoTarea, updateTipoTarea } from "../../services/taskTypesService";
import type { TipoTarea } from "../../types";
import { extractApiError } from "./taskHelpers";

interface Props {
  open: boolean;
  tipo: TipoTarea | null;
  onClose: () => void;
  onSaved: (tipo: TipoTarea) => void;
}

const labelCls = "block text-xs font-semibold text-slate-600 mb-1";
const inputCls =
  "w-full rounded-lg border border-[#e2e8f0] bg-white px-3 py-2 text-sm text-[#0f172a] focus:outline-none focus:ring-2 focus:ring-[#09268E]/30 focus:border-[#09268E] transition";

// Modal para crear o editar tipos de tarea. Si se recibe un tipo, se asume que es edición, sino creación. 
// Al guardar, llama a onSaved con el tipo creado/actualizado.
export function TiposTareaFormModal({ open, tipo, onClose, onSaved }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setNombre(tipo?.nombre ?? "");
      setDescripcion(tipo?.descripcion ?? "");
      dialogRef.current?.showModal();
    } else {
      dialogRef.current?.close();
    }
  }, [open, tipo]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!nombre.trim()) {
      toast.error("El nombre es requerido.");
      return;
    }
    setSaving(true);
    try {
      const saved = tipo
        ? await updateTipoTarea(tipo.id, { nombre: nombre.trim(), descripcion: descripcion.trim() || null })
        : await createTipoTarea({ nombre: nombre.trim(), descripcion: descripcion.trim() || null });
      onSaved(saved);
      onClose();
    } catch (err) {
      toast.error(extractApiError(err, "Error al guardar el tipo de tarea."));
    } finally {
      setSaving(false);
    }
  }

  return (
    <dialog ref={dialogRef} className="modal" onClose={onClose}>
      <div className="modal-box max-w-md p-0 rounded-xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="px-7 py-5 border-b border-[#f1f5f9] flex items-start justify-between">
          <div>
            <h3 className="text-base font-bold text-[#0f172a]">
              {tipo ? "Editar tipo de tarea" : "Nuevo tipo de tarea"}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {tipo ? "Modifica los datos del tipo." : "Define el nombre y descripción."}
            </p>
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

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          <div className="px-7 py-5 flex-1 overflow-y-auto space-y-4">
            <div>
              <label className={labelCls}>Nombre *</label>
              <input
                className={inputCls}
                placeholder="Ej. Administración de medicamentos"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
              />
            </div>
            <div>
              <label className={labelCls}>Descripción (opcional)</label>
              <textarea
                className={inputCls + " resize-none"}
                rows={3}
                placeholder="Descripción del tipo de tarea..."
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
              />
            </div>
          </div>

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
              type="submit"
              disabled={saving}
              className="btn btn-sm text-white border-none"
              style={{ background: "#09268E" }}
            >
              {saving && <span className="loading loading-spinner loading-xs" />}
              {tipo ? "Guardar cambios" : "Crear tipo"}
            </button>
          </div>
        </form>
      </div>
      <form method="dialog" className="modal-backdrop">
        <button>close</button>
      </form>
    </dialog>
  );
}
