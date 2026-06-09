"use client";
import { useEffect, useRef, useState } from "react";
import { retireAsset } from "@/features/assets-managment/inventory/services/assetService";
import type { Activo } from "@/features/assets-managment/inventory/types";
import { toast } from "@/lib/toast";

interface RetireAssetModalProps {
  open: boolean;
  activo: Activo | null;
  onClose: () => void;
  onRetirado: (id: number) => void;
}

// Modal de confirmación para retirar un activo del inventario.
export function RetireAssetModal({
  open,
  activo,
  onClose,
  onRetirado,
}: RetireAssetModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [motivoRetiro, setMotivoRetiro] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && activo) {
      setMotivoRetiro("");
      setError(null);
      setApiError(null);
      dialogRef.current?.showModal();
    } else {
      dialogRef.current?.close();
    }
  }, [open, activo]);

  async function handleConfirm() {
    if (!activo) return;
    if (!motivoRetiro.trim()) {
      setError("El motivo de retiro es obligatorio.");
      return;
    }
    setLoading(true);
    setApiError(null);
    try {
      await retireAsset(activo.id, { motivoRetiro: motivoRetiro.trim() });
      toast.success(`Activo "${activo.numeroSerie}" retirado exitosamente.`);
      onRetirado(activo.id);
      onClose();
    } catch (err: unknown) {
      const data = (
        err as { response?: { data?: { message?: string; mensaje?: string } } }
      )?.response?.data;
      const msg =
        data?.mensaje ??
        data?.message ??
        "No se pudo retirar el activo. Intente nuevamente.";
      setApiError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <dialog ref={dialogRef} className="modal" onClose={onClose}>
      <div className="modal-box bg-white w-full max-w-sm overflow-hidden p-0">
        {/* Franja roja superior */}
        <div className="bg-red-600 px-6 pt-6 pb-5 flex flex-col items-center gap-3 text-center">
          <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="2"
              stroke="currentColor"
              className="size-6 text-white"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z"
              />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Retirar activo</h3>
            <p className="text-sm text-red-100 mt-1">
              <span className="font-semibold text-white">
                {activo?.numeroSerie}
              </span>{" "}
              será marcado como Retirado.
            </p>
          </div>
        </div>

        {/* Aviso de acción irreversible */}
        <div className="mx-6 mt-5 flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2.5">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="size-4 text-red-500 shrink-0 mt-0.5"
          >
            <path
              fillRule="evenodd"
              d="M9.401 3.003c1.155-2 4.043-2 5.197 0l7.355 12.748c1.154 2-.29 4.5-2.599 4.5H4.645c-2.309 0-3.752-2.5-2.598-4.5L9.4 3.003ZM12 8.25a.75.75 0 0 1 .75.75v3.75a.75.75 0 0 1-1.5 0V9a.75.75 0 0 1 .75-.75Zm0 8.25a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Z"
              clipRule="evenodd"
            />
          </svg>
          <p className="text-xs text-red-700 font-medium leading-snug">
            Esta acción <span className="font-bold">no se puede deshacer</span>.
            Una vez retirado, el activo no podrá ser reincorporado.
          </p>
        </div>

        {/* Formulario */}
        <div className="px-6 pt-4 pb-6 flex flex-col gap-4">
          {apiError && (
            <div role="alert" className="alert alert-error text-sm py-2.5">
              <span>{apiError}</span>
            </div>
          )}

          <div className="flex flex-col gap-1">
            <label
              className="text-sm font-medium text-[#1A2B5E]"
              htmlFor="motivo-retiro"
            >
              Motivo de retiro <span className="text-red-500">*</span>
            </label>
            <textarea
              id="motivo-retiro"
              className={`textarea textarea-bordered w-full bg-white border-[#B0B0B0] text-[#1A2B5E] focus:border-red-500 focus:outline-none resize-none${error ? " border-red-400" : ""}`}
              rows={3}
              placeholder="Ej. Equipo dañado, vida útil agotada..."
              value={motivoRetiro}
              onChange={(e) => {
                setMotivoRetiro(e.target.value);
                setError(null);
              }}
            />
            {error && (
              <span className="text-xs text-red-500 mt-0.5">{error}</span>
            )}
          </div>

          <div className="flex justify-end gap-2">
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
              className="btn text-white bg-red-600 border-red-600 hover:bg-red-700 hover:border-red-700"
              onClick={handleConfirm}
              disabled={loading}
            >
              {loading && (
                <span className="loading loading-spinner loading-sm" />
              )}
              {loading ? "Retirando..." : "Confirmar retiro"}
            </button>
          </div>
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
