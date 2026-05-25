"use client";
import { useEffect, useRef, useState } from "react";
import { createTagBle } from "@/features/assets-managment/tracking/services/tagBleService";
import type { TagBle } from "@/features/assets-managment/tracking/types";
import { toast } from "@/lib/toast";

interface CreateTagBleModalProps {
  open: boolean;
  onClose: () => void;
  onCreated: (tag: TagBle) => void;
}

const labelCls = "text-sm font-medium text-[#1A2B5E]";
const inputCls =
  "input input-bordered w-full bg-white border-[#B0B0B0] text-[#1A2B5E] focus:border-[#09268E] focus:outline-none";
const errorCls = "text-xs text-red-500 mt-0.5";

export function CreateTagBleModal({
  open,
  onClose,
  onCreated,
}: CreateTagBleModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [codigo, setCodigo] = useState("");
  const [direccionMac, setDireccionMac] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [apiError, setApiError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      setCodigo("");
      setDireccionMac("");
      setDescripcion("");
      setErrors({});
      setApiError(null);
      dialogRef.current?.showModal();
    } else {
      dialogRef.current?.close();
    }
  }, [open]);

  function validate(): boolean {
    const next: Record<string, string> = {};
    if (!codigo.trim()) next.codigo = "El código es obligatorio.";
    if (!direccionMac.trim())
      next.direccionMac = "La dirección MAC es obligatoria.";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    setApiError(null);
    try {
      const tag = await createTagBle({
        codigo: codigo.trim(),
        direccionMac: direccionMac.trim().toUpperCase(),
        descripcion: descripcion.trim() || undefined,
      });
      toast.success(`Sensor "${tag.codigo}" registrado exitosamente.`);
      onCreated(tag);
      onClose();
    } catch (err: unknown) {
      const data = (
        err as { response?: { data?: { message?: string; mensaje?: string } } }
      )?.response?.data;
      const msg =
        data?.mensaje ??
        data?.message ??
        "No se pudo registrar el sensor. Intente nuevamente.";
      setApiError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <dialog ref={dialogRef} className="modal" onClose={onClose}>
      <div className="modal-box bg-white w-full max-w-md overflow-hidden p-0">
        {/* Header */}
        <div
          className="px-6 pt-6 pb-5 flex items-center gap-3"
          style={{ background: "linear-gradient(135deg, #1A2B5E 0%, #09268E 100%)" }}
        >
          <div className="w-10 h-10 rounded-lg bg-white/15 flex items-center justify-center flex-shrink-0">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 2a7 7 0 0 1 7 7c0 5-7 13-7 13S5 14 5 9a7 7 0 0 1 7-7z" />
              <circle cx="12" cy="9" r="2.5" />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-bold text-white leading-tight">
              Registrar nuevo tag
            </h3>
            <p className="text-sm text-blue-200 mt-0.5">
              Complete los datos del tag Bluetooth
            </p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} noValidate>
          <div className="px-6 pt-5 pb-6 flex flex-col gap-4">
            {apiError && (
              <div role="alert" className="alert alert-error text-sm py-2.5">
                <span>{apiError}</span>
              </div>
            )}

            {/* Código */}
            <div className="flex flex-col gap-1">
              <label className={labelCls} htmlFor="tag-codigo">
                Código <span className="text-red-500">*</span>
              </label>
              <input
                id="tag-codigo"
                type="text"
                className={`${inputCls}${errors.codigo ? " border-red-400" : ""}`}
                placeholder="Ej. TAG-001"
                value={codigo}
                onChange={(e) => {
                  setCodigo(e.target.value);
                  setErrors((p) => ({ ...p, codigo: "" }));
                }}
              />
              {errors.codigo && (
                <span className={errorCls}>{errors.codigo}</span>
              )}
            </div>

            {/* Dirección MAC */}
            <div className="flex flex-col gap-1">
              <label className={labelCls} htmlFor="tag-mac">
                Dirección MAC <span className="text-red-500">*</span>
              </label>
              <input
                id="tag-mac"
                type="text"
                className={`${inputCls} font-mono${errors.direccionMac ? " border-red-400" : ""}`}
                placeholder="AA:BB:CC:DD:EE:FF"
                value={direccionMac}
                onChange={(e) => {
                  setDireccionMac(e.target.value);
                  setErrors((p) => ({ ...p, direccionMac: "" }));
                }}
              />
              {errors.direccionMac && (
                <span className={errorCls}>{errors.direccionMac}</span>
              )}
            </div>

            {/* Descripción */}
            <div className="flex flex-col gap-1">
              <label className={labelCls} htmlFor="tag-descripcion">
                Descripción{" "}
                <span className="text-slate-400 font-normal">(opcional)</span>
              </label>
              <textarea
                id="tag-descripcion"
                className="textarea textarea-bordered w-full bg-white border-[#B0B0B0] text-[#1A2B5E] focus:border-[#09268E] focus:outline-none resize-none"
                rows={2}
                placeholder="Descripción o ubicación habitual del sensor..."
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
              />
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                className="btn btn-ghost"
                onClick={onClose}
                disabled={loading}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="btn text-white"
                style={{ backgroundColor: "#09268E", borderColor: "#09268E" }}
                disabled={loading}
              >
                {loading && (
                  <span className="loading loading-spinner loading-sm" />
                )}
                {loading ? "Registrando..." : "Registrar tag"}
              </button>
            </div>
          </div>
        </form>
      </div>
      <form method="dialog" className="modal-backdrop">
        <button type="submit" onClick={onClose}>
          close
        </button>
      </form>
    </dialog>
  );
}
