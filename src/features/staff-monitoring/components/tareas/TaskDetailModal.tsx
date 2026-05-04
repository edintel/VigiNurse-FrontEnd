"use client";
import React, { useEffect, useRef } from "react";
import type { Tarea, AsignacionTarea } from "../../types";
import { EstadoTareaBadge, PrioridadBadge, fmtDateTime } from "./taskHelpers";

interface Props {
  open: boolean;
  tarea: Tarea | null;
  asignacion: AsignacionTarea | null;
  onClose: () => void;
}

function DetailRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-[0.5px]">{label}</span>
      <span className="text-sm text-[#0f172a]">{children}</span>
    </div>
  );
}


// Modal para mostrar el detalle de una tarea. Se muestra al hacer click en una tarea desde la lista.
export function TaskDetailModal({ open, tarea, asignacion, onClose }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    if (open) dialogRef.current?.showModal();
    else dialogRef.current?.close();
  }, [open]);

  return (
    <dialog ref={dialogRef} className="modal" onClose={onClose}>
      <div className="modal-box max-w-lg p-0 rounded-xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-7 py-5 border-b border-[#f1f5f9] flex items-start justify-between">
          <div>
            <h3 className="text-base font-bold text-[#0f172a]">Detalle de tarea</h3>
            {tarea && (
              <p className="text-xs text-slate-500 mt-0.5">ID #{tarea.id}</p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="btn btn-sm btn-ghost btn-circle text-slate-400 hover:text-slate-700"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="px-7 py-5 flex-1 overflow-y-auto space-y-5">
          {tarea && (
            <>
              {/* Basic info */}
              <div className="grid grid-cols-2 gap-4">
                <DetailRow label="Tipo de tarea">{tarea.nombreTipoTarea}</DetailRow>
                <DetailRow label="Estado"><EstadoTareaBadge estado={tarea.estado} /></DetailRow>
                <DetailRow label="Prioridad"><PrioridadBadge prioridad={tarea.prioridad} /></DetailRow>
                <DetailRow label="Área">{tarea.nombreArea}</DetailRow>
                
                {tarea.episodioId && (
                  <DetailRow label="Episodio">#{tarea.episodioId}</DetailRow>
                )}
                <DetailRow label="Creador">{tarea.nombreCreador}</DetailRow>
                <DetailRow label="Fecha creación">{fmtDateTime(tarea.fechaCreacion)}</DetailRow>
                <DetailRow label="Responsable">
                  {asignacion ? asignacion.nombreUsuario : <span className="text-slate-300">Sin asignar</span>}
                </DetailRow>
                {asignacion && (
                  <>
                    <DetailRow label="Asignado por">{asignacion.nombreAsignadoPor}</DetailRow>
                    <DetailRow label="Fecha asignación">{fmtDateTime(asignacion.fechaAsignacion)}</DetailRow>
                  </>
                )}
              </div>

              {/* Description */}
              <div className="rounded-lg bg-[#f8fafc] border border-[#e2e8f0] px-4 py-3">
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-[0.5px] block mb-1">Descripción</span>
                <p className="text-sm text-[#0f172a] whitespace-pre-wrap leading-relaxed">{tarea.descripcion}</p>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-7 py-4 border-t border-[#f1f5f9] bg-[#f8fafc] flex justify-end">
          <button type="button" onClick={onClose} className="btn btn-sm btn-ghost text-slate-600">
            Cerrar
          </button>
        </div>
      </div>
      <form method="dialog" className="modal-backdrop">
        <button>close</button>
      </form>
    </dialog>
  );
}
