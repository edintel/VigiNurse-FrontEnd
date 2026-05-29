"use client";
import { useEffect, useRef, useState } from "react";
import { deleteHospitalFloorPlan } from "@/features/administration/hospitalFloorPlans/services/hospitalFloorPlanService";
import type { PlanoHospital } from "@/features/administration/hospitalFloorPlans/types";
import { toast } from "@/lib/toast";

interface Props {
  open: boolean;
  plano: PlanoHospital | null;
  onClose: () => void;
  onDeleted: (planoId: number) => void;
}

// Modal para confirmar eliminación de un plano hospitalario. Muestra un mensaje de advertencia y maneja la llamada a la API para eliminar el plano, mostrando errores si ocurren.
export function DeleteFloorPlanModal({ open, plano, onClose, onDeleted }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      dialogRef.current?.showModal();
      setApiError(null);
    } else {
      dialogRef.current?.close();
    }
  }, [open]);

  async function handleConfirm() {
    if (!plano) return;
    setLoading(true);
    setApiError(null);
    try {
      await deleteHospitalFloorPlan(plano.id);
      toast.success(`Plano "${plano.nombre}" eliminado.`);
      onDeleted(plano.id);
      onClose();
    } catch (err: unknown) {
      const data = (err as { response?: { data?: { mensaje?: string } } })?.response?.data;
      setApiError(data?.mensaje ?? "Error al eliminar el plano.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <dialog
      ref={dialogRef}
      className="modal"
      onCancel={(e) => { e.preventDefault(); if (!loading) onClose(); }}
    >
      <div className="modal-box max-w-sm">
        <div className="flex justify-center mb-4">
          <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
              <path d="M10 11v6M14 11v6" />
              <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
            </svg>
          </div>
        </div>

        <h3 className="text-lg font-bold text-center text-[#1A2B5E]">
          ¿Eliminar plano?
        </h3>
        <p className="text-sm text-slate-500 text-center mt-2">
          Se eliminará el plano{" "}
          <span className="font-semibold text-slate-700">"{plano?.nombre}"</span>
          {" "}y todas las áreas quedarán sin posición asignada. Esta acción no se puede deshacer.
        </p>

        {apiError && (
          <div className="mt-3 text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2 border border-red-200">
            {apiError}
          </div>
        )}

        <div className="modal-action justify-center gap-3 mt-4">
          <button
            className="btn btn-ghost btn-sm"
            onClick={onClose}
            disabled={loading}
          >
            Cancelar
          </button>
          <button
            className="btn btn-sm btn-error text-white"
            onClick={handleConfirm}
            disabled={loading}
          >
            {loading && <span className="loading loading-spinner loading-xs" />}
            Sí, eliminar
          </button>
        </div>
      </div>
      <form method="dialog" className="modal-backdrop">
        <button type="button" onClick={() => { if (!loading) onClose(); }}>close</button>
      </form>
    </dialog>
  );
}
