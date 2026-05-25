"use client";
import { useEffect, useRef, useState } from "react";
import { toast } from "@/lib/toast";
import {
  createGatewayBle,
  updateGatewayBle,
} from "@/features/administration/areasYZonas/services/gatewayBleService";
import {
  EstadoGatewayBle,
  type GatewayBle,
  type CreateGatewayBleDTO,
} from "@/features/administration/areasYZonas/types";

interface GatewayFormModalProps {
  open: boolean;
  gateway?: GatewayBle | null;
  onClose: () => void;
  onSaved: (gw: GatewayBle) => void;
}

const labelCls = "text-sm font-medium text-[#1A2B5E]";
const inputCls = "input input-bordered w-full bg-white border-[#B0B0B0] text-[#1A2B5E] focus:border-[#09268E] focus:outline-none";
const selectCls = "select select-bordered w-full bg-white border-[#B0B0B0] text-[#1A2B5E] focus:border-[#09268E] focus:outline-none cursor-pointer";
const errorCls = "text-xs text-red-500 mt-0.5";

export function GatewayFormModal({ open, gateway, onClose, onSaved }: GatewayFormModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const isEdit = !!gateway;

  const [nombre, setNombre] = useState("");
  const [direccionMac, setDireccionMac] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [estado, setEstado] = useState<EstadoGatewayBle>(EstadoGatewayBle.Activo);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [apiError, setApiError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      setNombre(gateway?.nombre ?? "");
      setDireccionMac(gateway?.direccionMac ?? "");
      setDescripcion(gateway?.descripcion ?? "");
      setEstado(gateway?.estado ?? EstadoGatewayBle.Activo);
      setErrors({});
      setApiError(null);
      dialogRef.current?.showModal();
    } else {
      dialogRef.current?.close();
    }
  }, [open, gateway]);

  function validate(): boolean {
    const next: Record<string, string> = {};
    if (!nombre.trim()) next.nombre = "El nombre es obligatorio.";
    if (!isEdit && !direccionMac.trim()) next.direccionMac = "La dirección MAC es obligatoria.";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    setApiError(null);
    try {
      let gw: GatewayBle;
      if (isEdit && gateway) {
        gw = await updateGatewayBle(gateway.id, {
          nombre: nombre.trim(),
          descripcion: descripcion.trim() || undefined,
          estado,
        });
        toast.success(`Gateway "${gw.nombre}" actualizado.`);
      } else {
        const dto: CreateGatewayBleDTO = {
          nombre: nombre.trim(),
          direccionMac: direccionMac.trim().toUpperCase(),
          descripcion: descripcion.trim() || undefined,
        };
        gw = await createGatewayBle(dto);
        toast.success(`Gateway "${gw.nombre}" registrado.`);
      }
      onSaved(gw);
      onClose();
    } catch (err: unknown) {
      const data = (err as { response?: { data?: { mensaje?: string; message?: string } } })?.response?.data;
      const msg = data?.mensaje ?? data?.message ?? "No se pudo guardar el gateway.";
      setApiError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <dialog ref={dialogRef} className="modal" onClose={onClose}>
      <div className="modal-box bg-white w-full max-w-md overflow-hidden p-0">
        <div
          className="px-6 pt-6 pb-5 flex items-center gap-3"
          style={{ background: "linear-gradient(135deg, #1A2B5E 0%, #09268E 100%)" }}
        >
          <div className="w-10 h-10 rounded-lg bg-white/15 flex items-center justify-center flex-shrink-0">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="3" width="20" height="14" rx="2" />
              <path d="M8 21h8M12 17v4M7 8h.01M11 8h.01M15 8h.01M7 12h10" />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-bold text-white leading-tight">
              {isEdit ? "Editar gateway BLE" : "Registrar nuevo gateway BLE"}
            </h3>
            <p className="text-sm text-blue-200 mt-0.5">
              {isEdit ? "Modifica los datos del receptor" : "Complete los datos del receptor Bluetooth"}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          <div className="px-6 pt-5 pb-6 flex flex-col gap-4">
            {apiError && (
              <div role="alert" className="alert alert-error text-sm py-2.5">
                <span>{apiError}</span>
              </div>
            )}

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
                onChange={(e) => { setNombre(e.target.value); setErrors((p) => ({ ...p, nombre: "" })); }}
              />
              {errors.nombre && <span className={errorCls}>{errors.nombre}</span>}
            </div>

            {!isEdit && (
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
                  onChange={(e) => { setDireccionMac(e.target.value); setErrors((p) => ({ ...p, direccionMac: "" })); }}
                />
                {errors.direccionMac && <span className={errorCls}>{errors.direccionMac}</span>}
              </div>
            )}

            {isEdit && (
              <div className="flex flex-col gap-1">
                <label className={labelCls} htmlFor="gw-estado">Estado</label>
                <select
                  id="gw-estado"
                  className={selectCls}
                  value={estado}
                  onChange={(e) => setEstado(parseInt(e.target.value, 10) as EstadoGatewayBle)}
                >
                  <option value={EstadoGatewayBle.Activo}>En línea</option>
                  <option value={EstadoGatewayBle.Inactivo}>Inactivo</option>
                  <option value={EstadoGatewayBle.Offline}>Offline</option>
                </select>
              </div>
            )}

            <div className="flex flex-col gap-1">
              <label className={labelCls} htmlFor="gw-descripcion">
                Descripción <span className="text-slate-400 font-normal">(opcional)</span>
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
              <button type="button" className="btn btn-ghost" onClick={onClose} disabled={loading}>
                Cancelar
              </button>
              <button
                type="submit"
                className="btn text-white"
                style={{ backgroundColor: "#09268E", borderColor: "#09268E" }}
                disabled={loading}
              >
                {loading && <span className="loading loading-spinner loading-sm" />}
                {loading ? "Guardando..." : isEdit ? "Guardar cambios" : "Registrar gateway"}
              </button>
            </div>
          </div>
        </form>
      </div>
      <form method="dialog" className="modal-backdrop">
        <button type="submit" onClick={onClose}>close</button>
      </form>
    </dialog>
  );
}
