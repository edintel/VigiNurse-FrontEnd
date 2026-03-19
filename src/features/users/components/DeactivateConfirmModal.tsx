"use client";
import { useEffect, useRef, useState } from "react";
import {
  blockUser,
  unblockUser,
} from "@/features/users/services/userManagementService";
import type { User } from "@/features/users/types";
import { toast } from "@/lib/toast";
interface DeactivateConfirmModalProps {
  open: boolean;
  user: User | null;
  onClose: () => void;
  onConfirmed: () => void;
}
// Componente modal para confirmar bloqueo/desbloqueo de usuario. Se reutiliza para ambas acciones.
export function DeactivateConfirmModal({
  open,
  user,
  onClose,
  onConfirmed,
}: DeactivateConfirmModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const isBlocking = !user?.bloqueado;
  useEffect(() => {
    if (open) {
      setApiError(null);
      dialogRef.current?.showModal();
    } else {
      dialogRef.current?.close();
    }
  }, [open]);
  // Maneja confirmacion.
  async function handleConfirm() {
    if (!user) return;
    setLoading(true);
    setApiError(null);
    try {
      isBlocking ? await blockUser(user.id) : await unblockUser(user.id);
      toast.success(
        isBlocking
          ? `Usuario ${user.nombre} ${user.apellidos} bloqueado exitosamente.`
          : `Usuario ${user.nombre} ${user.apellidos} desbloqueado exitosamente.`,
      );
      onConfirmed();
      onClose();
    } catch (err: unknown) {
      const msg = (
        err as {
          response?: {
            data?: {
              message?: string;
            };
          };
        }
      )?.response?.data?.message;
      const errorMsg =
        msg ?? "No se pudo completar la operación. Intente nuevamente.";
      setApiError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  }
  return (
    <dialog ref={dialogRef} className="modal" onClose={onClose}>
      <div className="modal-box max-w-sm">
        <button
          type="button"
          className="btn btn-sm btn-circle btn-ghost absolute right-3 top-3"
          onClick={onClose}
        >
          ✕
        </button>

        <div className="flex justify-center mb-3">
          <div
            className={`w-14 h-14 rounded-full flex items-center justify-center ${isBlocking ? "bg-warning/10" : "bg-success/10"}`}
          >
            {isBlocking ? (
              <svg
                className="w-7 h-7 text-warning"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
                />
              </svg>
            ) : (
              <svg
                className="w-7 h-7 text-success"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            )}
          </div>
        </div>

        <h3 className="text-lg font-bold text-center text-[#1A2B5E]">
          {isBlocking ? "¿Bloquear usuario?" : "¿Desbloquear usuario?"}
        </h3>

        <p className="text-sm text-slate-500 text-center mt-2 mb-1">
          {isBlocking ? (
            <>
              ¿Desea bloquear a{" "}
              <strong>
                {user?.nombre} {user?.apellidos}
              </strong>
              ? Su acceso al sistema será revocado inmediatamente.
            </>
          ) : (
            <>
              ¿Desea desbloquear a{" "}
              <strong>
                {user?.nombre} {user?.apellidos}
              </strong>
              ? Podrá volver a iniciar sesión.
            </>
          )}
        </p>

        {apiError && (
          <div role="alert" className="alert alert-error text-sm py-2 mt-3">
            <span>{apiError}</span>
          </div>
        )}

        <div className="modal-action justify-center gap-3 mt-4">
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={onClose}
            disabled={loading}
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={loading}
            className={`btn btn-sm ${isBlocking ? "btn-warning" : "btn-success"}`}
          >
            {loading && <span className="loading loading-spinner loading-xs" />}
            {loading
              ? "Procesando..."
              : isBlocking
                ? "Sí, bloquear"
                : "Sí, desbloquear"}
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
