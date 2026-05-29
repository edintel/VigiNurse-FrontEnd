"use client";
import { useEffect, useRef, useState } from "react";
import { createGatewayBle } from "@/features/assets-managment/tracking/services/gatewayBleService";
import { createGatewayAreaAssignment } from "@/features/assets-managment/tracking/services/gatewayAreaAssignmentService";
import { getAreas } from "@/features/administration/areas/services/areaService";
import type { GatewayBle } from "@/features/assets-managment/tracking/types";
import { toast } from "@/lib/toast";

interface AreaOption {
  id: number;
  nombre: string;
}

interface CreateGatewayBleModalProps {
  open: boolean;
  onClose: () => void;
  onCreated: (gateway: GatewayBle) => void;
}

const labelCls = "text-sm font-medium text-[#1A2B5E]";
const inputCls =
  "input input-bordered w-full bg-white border-[#B0B0B0] text-[#1A2B5E] focus:border-[#09268E] focus:outline-none";
const selectCls =
  "select select-bordered w-full bg-white border-[#B0B0B0] text-[#1A2B5E] focus:border-[#09268E] focus:outline-none cursor-pointer";
const errorCls = "text-xs text-red-500 mt-0.5";

export function CreateGatewayBleModal({
  open,
  onClose,
  onCreated,
}: CreateGatewayBleModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [nombre, setNombre] = useState("");
  const [direccionMac, setDireccionMac] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [areaId, setAreaId] = useState<number | null>(null);
  const [areas, setAreas] = useState<AreaOption[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [apiError, setApiError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getAreas(1, 200)
      .then((res) => setAreas(res.datos.map((a) => ({ id: a.id, nombre: a.nombre }))))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (open) {
      setNombre("");
      setDireccionMac("");
      setDescripcion("");
      setAreaId(null);
      setErrors({});
      setApiError(null);
      dialogRef.current?.showModal();
    } else {
      dialogRef.current?.close();
    }
  }, [open]);

  function validate(): boolean {
    const next: Record<string, string> = {};
    if (!nombre.trim()) next.nombre = "El nombre es obligatorio.";
    if (!direccionMac.trim())
      next.direccionMac = "La dirección MAC es obligatoria.";
    if (areaId === null) next.areaId = "El área es obligatoria.";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    setApiError(null);
    try {
      const gateway = await createGatewayBle({
        nombre: nombre.trim(),
        direccionMac: direccionMac.trim().toUpperCase(),
        descripcion: descripcion.trim() || undefined,
      });

      try {
        await createGatewayAreaAssignment({
          gatewayBleId: gateway.id,
          areaId: areaId!,
        });
        const areaOpt = areas.find((a) => a.id === areaId);
        gateway.areaId = areaId;
        gateway.areaNombre = areaOpt?.nombre ?? null;
      } catch {
        toast.error(
          `Gateway creado, pero no se pudo asignar el área. Edítelo para intentarlo de nuevo.`,
        );
      }

      toast.success(`Gateway "${gateway.nombre}" registrado exitosamente.`);
      onCreated(gateway);
      onClose();
    } catch (err: unknown) {
      const data = (
        err as { response?: { data?: { message?: string; mensaje?: string } } }
      )?.response?.data;
      const msg =
        data?.mensaje ??
        data?.message ??
        "No se pudo registrar el gateway. Intente nuevamente.";
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
              <rect x="2" y="3" width="20" height="14" rx="2" />
              <path d="M8 21h8M12 17v4" />
              <path d="M7 8h.01M11 8h.01M15 8h.01M7 12h10" />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-bold text-white leading-tight">
              Registrar nuevo gateway BLE
            </h3>
            <p className="text-sm text-blue-200 mt-0.5">
              Complete los datos del receptor Bluetooth
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

            {/* Nombre */}
            <div className="flex flex-col gap-1">
              <label className={labelCls} htmlFor="gw-nombre">
                Nombre <span className="text-red-500">*</span>
              </label>
              <input
                id="gw-nombre"
                type="text"
                className={`${inputCls}${errors.nombre ? " border-red-400" : ""}`}
                placeholder="Ej. Gateway Sala UCI"
                value={nombre}
                onChange={(e) => {
                  setNombre(e.target.value);
                  setErrors((p) => ({ ...p, nombre: "" }));
                }}
              />
              {errors.nombre && (
                <span className={errorCls}>{errors.nombre}</span>
              )}
            </div>

            {/* Dirección MAC */}
            <div className="flex flex-col gap-1">
              <label className={labelCls} htmlFor="gw-mac">
                Dirección MAC <span className="text-red-500">*</span>
              </label>
              <input
                id="gw-mac"
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

            {/* Área */}
            <div className="flex flex-col gap-1">
              <label className={labelCls} htmlFor="gw-area">
                Área <span className="text-red-500">*</span>
              </label>
              <select
                id="gw-area"
                className={`${selectCls}${errors.areaId ? " border-red-400" : ""}`}
                value={areaId ?? ""}
                onChange={(e) => {
                  setAreaId(e.target.value ? parseInt(e.target.value, 10) : null);
                  setErrors((p) => ({ ...p, areaId: "" }));
                }}
              >
                <option value="">Selecciona un área...</option>
                {areas.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.nombre}
                  </option>
                ))}
              </select>
              {errors.areaId && (
                <span className={errorCls}>{errors.areaId}</span>
              )}
            </div>

            {/* Descripción */}
            <div className="flex flex-col gap-1">
              <label className={labelCls} htmlFor="gw-descripcion">
                Descripción{" "}
                <span className="text-slate-400 font-normal">(opcional)</span>
              </label>
              <textarea
                id="gw-descripcion"
                className="textarea textarea-bordered w-full bg-white border-[#B0B0B0] text-[#1A2B5E] focus:border-[#09268E] focus:outline-none resize-none"
                rows={2}
                placeholder="Descripción o área de cobertura del gateway..."
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
                {loading ? "Registrando..." : "Registrar gateway"}
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
