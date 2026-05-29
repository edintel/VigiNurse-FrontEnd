"use client";
import React, { useEffect, useRef, useState } from "react";
import { toast } from "@/lib/toast";
import { updateTemplate } from "../../services/templatesService";
import type { PlantillaTurno } from "../../types";

interface Props {
  open: boolean;
  plantilla: PlantillaTurno | null;
  onClose: () => void;
  onDeactivated: (updated: PlantillaTurno) => void;
}

function extractApiError(err: unknown, fallback: string): string {
  if (err && typeof err === "object" && "response" in err) {
    const r = (err as { response?: { data?: { mensaje?: string } } }).response;
    if (r?.data?.mensaje) return r.data.mensaje;
  }
  return fallback;
}

// Componente para confirmar la desactivación de una plantilla. 
// No se elimina, solo se marca como inactiva para que no se use en nuevos cycles o turnos.
export function TemplateDeleteModal({ open, plantilla, onClose, onDeactivated }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) dialogRef.current?.showModal();
    else dialogRef.current?.close();
  }, [open]);

  async function handleDeactivate() {
    if (!plantilla) return;
    setSaving(true);
    try {
      const updated = await updateTemplate(plantilla.id, { activo: false });
      toast.success("Plantilla desactivada.");
      onDeactivated(updated);
      onClose();
    } catch (err) {
      toast.error(extractApiError(err, "No se pudo desactivar la plantilla."));
    } finally {
      setSaving(false);
    }
  }

  return (
    <dialog ref={dialogRef} className="modal" onClose={onClose}>
      <div className="modal-box max-w-sm p-0 rounded-xl overflow-hidden">
        <div className="px-7 py-5 border-b border-[#f1f5f9]">
          <h3 className="text-base font-bold text-[#0f172a]">Desactivar plantilla</h3>
        </div>
        <div className="px-7 py-5 space-y-3">
          <div className="flex items-start gap-3 rounded-lg bg-amber-50 border border-amber-200 p-3">
            <svg xmlns="http://www.w3.org/2000/svg" className="size-5 text-amber-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126Z" />
            </svg>
            <p className="text-sm text-amber-800">
              ¿Desactivar la plantilla <strong>{plantilla?.nombre}</strong>? No se eliminará, pero dejará de estar disponible para nuevos cycles y turnos.
            </p>
          </div>
        </div>
        <div className="px-7 py-4 border-t border-[#f1f5f9] bg-[#f8fafc] flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="btn btn-sm btn-ghost text-slate-600"
          >Cancelar</button>
          <button
            type="button"
            onClick={() => void handleDeactivate()}
            disabled={saving}
            className="btn btn-sm text-white border-none"
            style={{ background: "#b45309" }}
          >
            {saving && <span className="loading loading-spinner loading-xs" />}
            Desactivar
          </button>
        </div>
      </div>
      <form method="dialog" className="modal-backdrop"><button>close</button></form>
    </dialog>
  );
}
