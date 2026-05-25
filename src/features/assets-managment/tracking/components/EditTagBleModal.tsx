"use client";
import { useEffect, useRef, useState } from "react";
import { updateTagBle } from "@/features/assets-managment/tracking/services/tagBleService";
import {
  EstadoTagBle,
  type TagBle,
} from "@/features/assets-managment/tracking/types";
import { toast } from "@/lib/toast";

interface EditTagBleModalProps {
  open: boolean;
  tag: TagBle | null;
  onClose: () => void;
  onUpdated: (tag: TagBle) => void;
}

const labelCls = "text-sm font-medium text-[#1A2B5E]";
const inputCls =
  "input input-bordered w-full bg-white border-[#B0B0B0] text-[#1A2B5E] focus:border-[#09268E] focus:outline-none";

export function EditTagBleModal({
  open,
  tag,
  onClose,
  onUpdated,
}: EditTagBleModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [codigo, setCodigo] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [estado, setEstado] = useState<EstadoTagBle>(EstadoTagBle.Activo);
  const [codigoError, setCodigoError] = useState("");
  const [apiError, setApiError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && tag) {
      setCodigo(tag.codigo);
      setDescripcion(tag.descripcion ?? "");
      setEstado(tag.estado);
      setCodigoError("");
      setApiError(null);
      dialogRef.current?.showModal();
    } else {
      dialogRef.current?.close();
    }
  }, [open, tag]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!tag) return;
    if (!codigo.trim()) {
      setCodigoError("El código es obligatorio.");
      return;
    }
    setLoading(true);
    setApiError(null);
    try {
      const updated = await updateTagBle(tag.id, {
        codigo: codigo.trim(),
        descripcion: descripcion.trim() || undefined,
        estado,
      });
      toast.success(`Sensor "${updated.codigo}" actualizado exitosamente.`);
      onUpdated(updated);
      onClose();
    } catch (err: unknown) {
      const data = (
        err as { response?: { data?: { message?: string; mensaje?: string } } }
      )?.response?.data;
      const msg =
        data?.mensaje ??
        data?.message ??
        "No se pudo actualizar el sensor. Intente nuevamente.";
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
              <path d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Z" />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-bold text-white leading-tight">
              Editar tag
            </h3>
            <p className="text-sm text-blue-200 mt-0.5 font-mono">
              {tag?.direccionMac}
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

            {/* MAC (read-only) */}
            <div className="flex flex-col gap-1">
              <span className={labelCls}>Dirección MAC</span>
              <div className="input input-bordered bg-[#F8FAFC] border-[#E2E8F0] text-slate-500 font-mono flex items-center">
                {tag?.direccionMac}
              </div>
              <span className="text-xs text-slate-400">
                La dirección MAC no puede modificarse.
              </span>
            </div>

            {/* Código */}
            <div className="flex flex-col gap-1">
              <label className={labelCls} htmlFor="edit-tag-codigo">
                Código <span className="text-red-500">*</span>
              </label>
              <input
                id="edit-tag-codigo"
                type="text"
                className={`${inputCls}${codigoError ? " border-red-400" : ""}`}
                placeholder="Ej. TAG-001"
                value={codigo}
                onChange={(e) => {
                  setCodigo(e.target.value);
                  setCodigoError("");
                }}
              />
              {codigoError && (
                <span className="text-xs text-red-500 mt-0.5">
                  {codigoError}
                </span>
              )}
            </div>

            {/* Estado */}
            <div className="flex flex-col gap-1">
              <label className={labelCls} htmlFor="edit-tag-estado">
                Estado
              </label>
              <select
                id="edit-tag-estado"
                className="select select-bordered w-full bg-white border-[#B0B0B0] text-[#1A2B5E] focus:border-[#09268E] focus:outline-none cursor-pointer"
                value={estado}
                onChange={(e) =>
                  setEstado(parseInt(e.target.value, 10) as EstadoTagBle)
                }
              >
                <option value={EstadoTagBle.Activo}>Activo</option>
                <option value={EstadoTagBle.Inactivo}>Inactivo</option>
                <option value={EstadoTagBle.Perdido}>Perdido</option>
              </select>
            </div>

            {/* Descripción */}
            <div className="flex flex-col gap-1">
              <label className={labelCls} htmlFor="edit-tag-descripcion">
                Descripción{" "}
                <span className="text-slate-400 font-normal">(opcional)</span>
              </label>
              <textarea
                id="edit-tag-descripcion"
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
                {loading ? "Guardando..." : "Guardar cambios"}
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
