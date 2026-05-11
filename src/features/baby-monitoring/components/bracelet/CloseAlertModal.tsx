"use client";
import { useEffect, useRef, useState } from "react";
import { toast } from "@/lib/toast";
import { closeAlert } from "@/features/baby-monitoring/services/babyService";
import type { AlertaBrazalete, CloseAlertDTO } from "@/features/baby-monitoring/types";

interface CloseAlertModalProps {
  open: boolean;
  alertId: number;
  onClose: () => void;
  onClosed: (alert: AlertaBrazalete) => void;
}

export function CloseAlertModal({ open, alertId, onClose, onClosed }: CloseAlertModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [closeReason, setCloseReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) { dialogRef.current?.showModal(); setCloseReason(""); }
    else dialogRef.current?.close();
  }, [open]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const dto: CloseAlertDTO = { closeReason: closeReason.trim() || null };
      const updated = await closeAlert(alertId, dto);
      toast.success("Alerta cerrada correctamente.");
      onClosed(updated);
      onClose();
    } catch (err: unknown) {
      const data = (err as { response?: { data?: { mensaje?: string; message?: string } } })?.response?.data;
      toast.error(data?.mensaje ?? data?.message ?? "No se pudo cerrar la alerta.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <dialog ref={dialogRef} className="modal" onCancel={(e) => { e.preventDefault(); if (!submitting) onClose(); }}>
      <div className="modal-box max-w-md p-0 overflow-hidden rounded-xl">
        <div className="px-6 py-4 border-b border-[#E2E8F0]">
          <h3 className="text-base font-bold text-[#0f172a]">Cerrar alerta</h3>
        </div>
        <form onSubmit={(e) => void handleSubmit(e)} className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-sm font-semibold text-[#334155] mb-1.5">
              Motivo de cierre <span className="text-xs font-normal text-slate-400">(opcional)</span>
            </label>
            <textarea
              className="textarea textarea-bordered w-full text-sm rounded-lg resize-none"
              rows={3}
              placeholder="Describe el motivo del cierre..."
              value={closeReason}
              onChange={(e) => setCloseReason(e.target.value)}
              disabled={submitting}
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" className="btn btn-sm btn-ghost" onClick={onClose} disabled={submitting}>Cancelar</button>
            <button
              type="submit"
              className="btn btn-sm text-white"
              style={submitting
                ? { backgroundColor: "#cbd5e1", borderColor: "#cbd5e1", color: "#94a3b8", cursor: "not-allowed" }
                : { backgroundColor: "#09268E", borderColor: "#09268E" }}
              disabled={submitting}
            >
              {submitting && <span className="loading loading-spinner loading-xs" />}
              Cerrar alerta
            </button>
          </div>
        </form>
      </div>
      <form method="dialog" className="modal-backdrop">
        <button type="button" onClick={() => { if (!submitting) onClose(); }}>close</button>
      </form>
    </dialog>
  );
}
