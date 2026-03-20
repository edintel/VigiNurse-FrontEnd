"use client";
import { useEffect, useRef, useState } from "react";
import { deleteZona } from "@/features/zones/services/zoneService";
import type { Zona } from "@/features/zones/types";
import { toast } from "@/lib/toast";

interface DeleteZonaModalProps {
  open: boolean;
  zona: Zona | null;
  onClose: () => void;
  onDeleted: (id: number) => void;
}

// Modal de confirmación para eliminar una zona.
export function DeleteZonaModal({
  open,
  zona,
  onClose,
  onDeleted,
}: DeleteZonaModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  useEffect(() => {
    if (open && zona) {
      setApiError(null);
      dialogRef.current?.showModal();
    } else {
      dialogRef.current?.close();
    }
  }, [open, zona]);

  async function handleConfirm() {
    if (!zona) return;
    setLoading(true);
    setApiError(null);
    try {
      await deleteZona(zona.id);
      toast.success(`Zona "${zona.nombre}" eliminada exitosamente.`);
      onDeleted(zona.id);
      onClose();
    } catch (err: unknown) {
      const data = (
        err as { response?: { data?: { message?: string; mensaje?: string } } }
      )?.response?.data;
      const msg =
        data?.mensaje ??
        data?.message ??
        "No se pudo eliminar la zona. Intente nuevamente.";
      setApiError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <dialog ref={dialogRef} className="modal" onClose={onClose}>
      <div className="modal-box bg-[#EEEEEE] w-full max-w-sm">
        <button
          type="button"
          className="absolute right-3 top-3 text-gray-500 hover:text-[#1A2B5E] transition-colors"
          onClick={onClose}
        >
          ✕
        </button>

        <div className="flex flex-col items-center text-center gap-3 pt-2 pb-4">
          <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="2"
              stroke="currentColor"
              className="size-6 text-red-500"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"
              />
            </svg>
          </div>

          <div>
            <h3 className="text-lg font-bold text-[#1A2B5E]">Eliminar zona</h3>
            <p className="text-sm text-slate-500 mt-1">
              ¿Estás seguro de que deseas eliminar{" "}
              <span className="font-semibold text-slate-700">
                {zona?.nombre}
              </span>
              ? Esta acción no se puede deshacer.
            </p>
          </div>
        </div>

        {apiError && (
          <div role="alert" className="alert alert-error text-sm py-3 mb-4">
            <span>{apiError}</span>
          </div>
        )}

        <div className="modal-action mt-0">
          <button
            type="button"
            className="btn btn-ghost"
            onClick={onClose}
            disabled={loading}
          >
            Cancelar
          </button>
          <button
            type="button"
            className="btn text-white"
            style={{ backgroundColor: "#ff627d", borderColor: "#ff627d" }}
            onClick={handleConfirm}
            disabled={loading}
          >
            {loading && <span className="loading loading-spinner loading-sm" />}
            {loading ? "Eliminando..." : "Eliminar"}
          </button>
        </div>
      </div>
      <form method="dialog" className="modal-backdrop">
        <button type="submit" onClick={onClose}>
          close
        </button>
      </form>
    </dialog>
  );
}
