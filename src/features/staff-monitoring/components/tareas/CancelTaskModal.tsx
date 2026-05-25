"use client";
import React, { useEffect, useRef, useState } from "react";
import { toast } from "@/lib/toast";
import { updateTareaEstado } from "../../services/taskService";
import { EstadoTarea } from "../../types";
import type { Tarea } from "../../types";
import { extractApiError } from "./taskHelpers";

interface Props {
  open: boolean;
  tarea: Tarea | null;
  onClose: () => void;
  onSuccess: () => void;
}

// Modal para confirmar la cancelación de una tarea. Solo se muestra si la tarea no está finalizada o cancelada.
export function CancelTaskModal({ open, tarea, onClose, onSuccess }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) dialogRef.current?.showModal();
    else dialogRef.current?.close();
  }, [open]);

  async function handleConfirm() {
    if (!tarea) return;
    setSaving(true);
    try {
      await updateTareaEstado(tarea.id, { estado: EstadoTarea.Cancelada });
      toast.success("Tarea cancelada.");
      onSuccess();
      onClose();
    } catch (err) {
      toast.error(extractApiError(err, "No se pudo cancelar la tarea."));
    } finally {
      setSaving(false);
    }
  }

  return (
    <dialog ref={dialogRef} className="modal" onClose={onClose}>
      <div className="modal-box max-w-sm p-0 rounded-xl overflow-hidden">
        <div className="px-6 py-5 flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="size-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 0 0 5.636 5.636m12.728 12.728A9 9 0 0 1 5.636 5.636m12.728 12.728L5.636 5.636" />
            </svg>
          </div>
          <div className="text-center">
            <h3 className="text-base font-bold text-[#0f172a]">Cancelar tarea</h3>
            {tarea && (
              <p className="text-xs text-slate-500 mt-1 max-w-[260px]">
                {tarea.nombreTipoTarea} — {tarea.descripcion.slice(0, 60)}{tarea.descripcion.length > 60 ? "…" : ""}
              </p>
            )}
            <p className="text-sm text-slate-600 mt-2">¿Deseas cancelar esta tarea? Esta acción no se puede deshacer.</p>
          </div>
        </div>
        <div className="px-6 pb-5 flex justify-center gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="btn btn-sm btn-ghost text-slate-600"
          >
            Volver
          </button>
          <button
            type="button"
            onClick={() => void handleConfirm()}
            disabled={saving}
            className="btn btn-sm text-white border-none"
            style={{ background: "#b91c1c" }}
          >
            {saving && <span className="loading loading-spinner loading-xs" />}
            Sí, cancelar
          </button>
        </div>
      </div>
      <form method="dialog" className="modal-backdrop">
        <button>close</button>
      </form>
    </dialog>
  );
}
