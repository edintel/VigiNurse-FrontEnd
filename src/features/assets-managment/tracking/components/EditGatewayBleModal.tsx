"use client";
import { useEffect, useRef, useState } from "react";
import { updateGatewayBle } from "@/features/assets-managment/tracking/services/gatewayBleService";
import {
  getAsignacionesGatewayArea,
  createAsignacionGatewayArea,
  desasignarGatewayArea,
} from "@/features/assets-managment/tracking/services/asignacionGatewayAreaService";
import { getAreas } from "@/features/administration/areas/services/areaService";
import {
  EstadoGatewayBle,
  type GatewayBle,
} from "@/features/assets-managment/tracking/types";
import { toast } from "@/lib/toast";

interface AreaOption {
  id: number;
  nombre: string;
}

interface EditGatewayBleModalProps {
  open: boolean;
  gateway: GatewayBle | null;
  onClose: () => void;
  onUpdated: (gateway: GatewayBle) => void;
}

const labelCls = "text-sm font-medium text-[#1A2B5E]";
const inputCls =
  "input input-bordered w-full bg-white border-[#B0B0B0] text-[#1A2B5E] focus:border-[#09268E] focus:outline-none";
const selectCls =
  "select select-bordered w-full bg-white border-[#B0B0B0] text-[#1A2B5E] focus:border-[#09268E] focus:outline-none cursor-pointer";

export function EditGatewayBleModal({
  open,
  gateway,
  onClose,
  onUpdated,
}: EditGatewayBleModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [estado, setEstado] = useState<EstadoGatewayBle>(EstadoGatewayBle.Activo);
  const [areaId, setAreaId] = useState<number | null>(null);
  const [areas, setAreas] = useState<AreaOption[]>([]);
  const [currentAssignmentId, setCurrentAssignmentId] = useState<number | null>(null);
  const [nombreError, setNombreError] = useState("");
  const [apiError, setApiError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingArea, setLoadingArea] = useState(false);

  // Carga las áreas disponibles una sola vez al montar.
  useEffect(() => {
    getAreas(1, 200)
      .then((res) => setAreas(res.datos.map((a) => ({ id: a.id, nombre: a.nombre }))))
      .catch(() => {});
  }, []);

  // Al abrir el modal, puebla los campos y busca la asignación de área activa.
  useEffect(() => {
    if (open && gateway) {
      setNombre(gateway.nombre);
      setDescripcion(gateway.descripcion ?? "");
      setEstado(gateway.estado);
      setAreaId(gateway.areaId);
      setCurrentAssignmentId(null);
      setNombreError("");
      setApiError(null);
      dialogRef.current?.showModal();

      // Busca el ID de la asignación activa de este gateway para poder desasignarla si cambia.
      if (gateway.areaId !== null) {
        setLoadingArea(true);
        getAsignacionesGatewayArea(true)
          .then((asignaciones) => {
            const asignacion = asignaciones.find(
              (a) => a.gatewayBleId === gateway.id,
            );
            setCurrentAssignmentId(asignacion?.id ?? null);
          })
          .catch(() => {})
          .finally(() => setLoadingArea(false));
      }
    } else {
      dialogRef.current?.close();
    }
  }, [open, gateway]);

  async function handleAreaChange(
    gatewayId: number,
    previousAreaId: number | null,
    newAreaId: number | null,
  ): Promise<{ areaId: number | null; areaNombre: string | null }> {
    const areaChanged = newAreaId !== previousAreaId;
    if (!areaChanged) {
      const areaOpt = areas.find((a) => a.id === previousAreaId);
      return { areaId: previousAreaId, areaNombre: areaOpt?.nombre ?? null };
    }

    // Desasigna el área anterior si existía.
    if (previousAreaId !== null && currentAssignmentId !== null) {
      await desasignarGatewayArea(currentAssignmentId);
    }

    // Asigna la nueva área si se seleccionó una.
    if (newAreaId !== null) {
      const asignacion = await createAsignacionGatewayArea({
        gatewayBleId: gatewayId,
        areaId: newAreaId,
      });
      const areaOpt = areas.find((a) => a.id === newAreaId);
      return {
        areaId: asignacion.areaId,
        areaNombre: areaOpt?.nombre ?? asignacion.areaNombre,
      };
    }

    return { areaId: null, areaNombre: null };
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!gateway) return;
    if (!nombre.trim()) {
      setNombreError("El nombre es obligatorio.");
      return;
    }
    setLoading(true);
    setApiError(null);
    try {
      const updated = await updateGatewayBle(gateway.id, {
        nombre: nombre.trim(),
        descripcion: descripcion.trim() || undefined,
        estado,
      });

      const { areaId: resolvedAreaId, areaNombre: resolvedAreaNombre } =
        await handleAreaChange(gateway.id, gateway.areaId, areaId);

      updated.areaId = resolvedAreaId;
      updated.areaNombre = resolvedAreaNombre;

      toast.success(`Gateway "${updated.nombre}" actualizado exitosamente.`);
      onUpdated(updated);
      onClose();
    } catch (err: unknown) {
      const data = (
        err as { response?: { data?: { message?: string; mensaje?: string } } }
      )?.response?.data;
      const msg =
        data?.mensaje ??
        data?.message ??
        "No se pudo actualizar el gateway. Intente nuevamente.";
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
              Editar gateway BLE
            </h3>
            <p className="text-sm text-blue-200 mt-0.5 font-mono">
              {gateway?.direccionMac}
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
                {gateway?.direccionMac}
              </div>
              <span className="text-xs text-slate-400">
                La dirección MAC no puede modificarse.
              </span>
            </div>

            {/* Nombre */}
            <div className="flex flex-col gap-1">
              <label className={labelCls} htmlFor="edit-gw-nombre">
                Nombre <span className="text-red-500">*</span>
              </label>
              <input
                id="edit-gw-nombre"
                type="text"
                className={`${inputCls}${nombreError ? " border-red-400" : ""}`}
                placeholder="Ej. Gateway Sala UCI"
                value={nombre}
                onChange={(e) => {
                  setNombre(e.target.value);
                  setNombreError("");
                }}
              />
              {nombreError && (
                <span className="text-xs text-red-500 mt-0.5">{nombreError}</span>
              )}
            </div>

            {/* Estado */}
            <div className="flex flex-col gap-1">
              <label className={labelCls} htmlFor="edit-gw-estado">
                Estado
              </label>
              <select
                id="edit-gw-estado"
                className={selectCls}
                value={estado}
                onChange={(e) =>
                  setEstado(parseInt(e.target.value, 10) as EstadoGatewayBle)
                }
              >
                <option value={EstadoGatewayBle.Activo}>Activo</option>
                <option value={EstadoGatewayBle.Inactivo}>Inactivo</option>
                <option value={EstadoGatewayBle.Offline}>Offline</option>
              </select>
            </div>

            {/* Área */}
            <div className="flex flex-col gap-1">
              <label className={labelCls} htmlFor="edit-gw-area">
                Área
              </label>
              {loadingArea ? (
                <div className="flex items-center gap-2 h-10 px-3 border border-[#E2E8F0] rounded-lg bg-[#F8FAFC]">
                  <span className="loading loading-spinner loading-xs text-[#09268E]" />
                  <span className="text-sm text-slate-400">
                    Cargando asignación...
                  </span>
                </div>
              ) : (
                <select
                  id="edit-gw-area"
                  className={selectCls}
                  value={areaId ?? ""}
                  onChange={(e) =>
                    setAreaId(
                      e.target.value ? parseInt(e.target.value, 10) : null,
                    )
                  }
                >
                  <option value="">Sin área asignada</option>
                  {areas.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.nombre}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Descripción */}
            <div className="flex flex-col gap-1">
              <label className={labelCls} htmlFor="edit-gw-descripcion">
                Descripción{" "}
                <span className="text-slate-400 font-normal">(opcional)</span>
              </label>
              <textarea
                id="edit-gw-descripcion"
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
                disabled={loading || loadingArea}
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
