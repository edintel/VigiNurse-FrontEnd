"use client";
import { useEffect, useRef, useState } from "react";
import { toast } from "@/lib/toast";
import { createSensor, updateSensor } from "@/features/baby-monitoring/services/zoneService";
import {
  TipoSensor,
  EstadoSensor,
  TIPO_SENSOR_LABELS,
  ESTADO_SENSOR_LABELS,
} from "@/features/baby-monitoring/types/zones";
import type { Sensor, CrearSensorDTO, ActualizarSensorDTO } from "@/features/baby-monitoring/types/zones";
import { CallyDatePicker } from "@/shared/ui/CallyDatePicker";

interface SensorModalProps {
  open: boolean;
  sensor?: Sensor | null;
  defaultZonaId?: number;
  onClose: () => void;
  onSaved: (sensor: Sensor) => void;
}

export function SensorModal({ open, sensor, defaultZonaId, onClose, onSaved }: SensorModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const isEditing = sensor != null;

  const [codigo, setCodigo] = useState("");
  const [nombre, setNombre] = useState("");
  const [tipo, setTipo] = useState<TipoSensor>(TipoSensor.BleAnchor);
  const [direccionMac, setDireccionMac] = useState("");
  const [ubicacionDescripcion, setUbicacionDescripcion] = useState("");
  const [zonaId, setZonaId] = useState<number | undefined>(defaultZonaId);
  const [estado, setEstado] = useState<EstadoSensor>(EstadoSensor.Activo);
  const [fechaInstalacion, setFechaInstalacion] = useState("");
  const [horaInstalacion, setHoraInstalacion] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      dialogRef.current?.showModal();
      if (sensor) {
        setCodigo(sensor.codigo);
        setNombre(sensor.nombre);
        setTipo(sensor.tipo);
        setDireccionMac(sensor.direccionMac);
        setUbicacionDescripcion(sensor.ubicacionDescripcion ?? "");
        setZonaId(sensor.zonaId);
        setEstado(sensor.estado);
        setFechaInstalacion(sensor.fechaInstalacion.slice(0, 10));
        setHoraInstalacion(sensor.fechaInstalacion.slice(11, 16));
      } else {
        setCodigo("");
        setNombre("");
        setTipo(TipoSensor.BleAnchor);
        setDireccionMac("");
        setUbicacionDescripcion("");
        setZonaId(defaultZonaId);
        setEstado(EstadoSensor.Activo);
        const now = new Date();
        setFechaInstalacion(now.toISOString().slice(0, 10));
        setHoraInstalacion(now.toTimeString().slice(0, 5));
      }
    } else {
      dialogRef.current?.close();
    }
  }, [open, sensor, defaultZonaId]);

  const isValid =
    nombre.trim() !== "" &&
    (isEditing || (codigo.trim() !== "" && direccionMac.trim() !== "" && fechaInstalacion !== "" && horaInstalacion !== ""));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isValid) return;
    setSubmitting(true);
    try {
      let saved: Sensor;
      if (isEditing) {
        const dto: ActualizarSensorDTO = {
          nombre: nombre.trim(),
          tipo,
          ubicacionDescripcion: ubicacionDescripcion.trim() || null,
          estado,
        };
        saved = await updateSensor(sensor.id, dto);
        toast.success(`Sensor "${saved.nombre}" actualizado.`);
      } else {
        const dto: CrearSensorDTO = {
          codigo: codigo.trim(),
          nombre: nombre.trim(),
          tipo,
          direccionMac: direccionMac.trim(),
          ubicacionDescripcion: ubicacionDescripcion.trim() || null,
          zonaId: zonaId!,
          fechaInstalacion: new Date(`${fechaInstalacion}T${horaInstalacion || "00:00"}`).toISOString(),
        };
        saved = await createSensor(dto);
        toast.success(`Sensor "${saved.nombre}" creado.`);
      }
      onSaved(saved);
      onClose();
    } catch (err: unknown) {
      const data = (err as { response?: { data?: { mensaje?: string; message?: string } } })?.response?.data;
      toast.error(data?.mensaje ?? data?.message ?? "No se pudo guardar el sensor.");
    } finally {
      setSubmitting(false);
    }
  }

  const tipoValues = Object.values(TipoSensor).filter((v) => typeof v === "number") as TipoSensor[];
  const estadoValues = Object.values(EstadoSensor).filter((v) => typeof v === "number") as EstadoSensor[];

  return (
    <dialog
      ref={dialogRef}
      className="modal"
      onCancel={(e) => { e.preventDefault(); if (!submitting) onClose(); }}
    >
      <div className="modal-box max-w-lg p-0 overflow-hidden rounded-xl">
        <div className="px-6 py-4 border-b border-[#E2E8F0]">
          <h3 className="text-base font-bold text-[#0f172a]">
            {isEditing ? "Editar sensor" : "Nuevo sensor BLE"}
          </h3>
        </div>
        <form onSubmit={(e) => void handleSubmit(e)} className="px-6 py-5 space-y-4">
          {/* Código y MAC (solo crear) */}
          {!isEditing && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-semibold text-[#334155] mb-1.5">
                  Código <span className="text-red-500">*</span>
                </label>
                <input
                  className="input input-bordered w-full text-sm font-mono"
                  value={codigo}
                  onChange={(e) => setCodigo(e.target.value)}
                  placeholder="Ej. SENS-001"
                  disabled={submitting}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-[#334155] mb-1.5">
                  Dirección MAC <span className="text-red-500">*</span>
                </label>
                <input
                  className="input input-bordered w-full text-sm font-mono"
                  value={direccionMac}
                  onChange={(e) => setDireccionMac(e.target.value)}
                  placeholder="AA:BB:CC:DD:EE:FF"
                  disabled={submitting}
                />
              </div>
            </div>
          )}

          {/* Nombre y Tipo */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-semibold text-[#334155] mb-1.5">
                Nombre <span className="text-red-500">*</span>
              </label>
              <input
                className="input input-bordered w-full text-sm"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Ej. Anchor Norte"
                disabled={submitting}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-[#334155] mb-1.5">
                Tipo <span className="text-red-500">*</span>
              </label>
              <select
                className="select select-bordered w-full text-sm"
                value={tipo}
                onChange={(e) => setTipo(Number(e.target.value) as TipoSensor)}
                disabled={submitting}
              >
                {tipoValues.map((t) => (
                  <option key={t} value={t}>{TIPO_SENSOR_LABELS[t]}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Fecha y hora de instalación (solo crear) */}
          {!isEditing && (
            <div className="grid grid-cols-2 gap-3 items-end">
              <CallyDatePicker
                id="sensor-fecha-instalacion"
                label="Fecha de instalación"
                value={fechaInstalacion}
                onChange={setFechaInstalacion}
                labelClassName="font-semibold !text-[#0f172a]"
                required
                max={new Date().toISOString().slice(0, 10)}
              />
              <div className="flex flex-col w-full gap-1.5">
                <label className="text-sm font-semibold text-[#0f172a]">
                  Hora <span className="text-red-500">*</span>
                </label>
                <input
                  type="time"
                  className="input input-bordered h-12 w-full border-[#B0B0B0] text-[#1A2B5E] text-sm focus:border-[#09268E] focus:outline-none"                  
                  value={horaInstalacion}
                  onChange={(e) => setHoraInstalacion(e.target.value)}
                  disabled={submitting}
                  required
                />
              </div>
            </div>
          )}

          {/* Estado (solo editar) */}
          {isEditing && (
            <div>
              <label className="block text-sm font-semibold text-[#334155] mb-1.5">Estado</label>
              <select
                className="select select-bordered w-full text-sm"
                value={estado}
                onChange={(e) => setEstado(Number(e.target.value) as EstadoSensor)}
                disabled={submitting}
              >
                {estadoValues.map((s) => (
                  <option key={s} value={s}>{ESTADO_SENSOR_LABELS[s]}</option>
                ))}
              </select>
            </div>
          )}

          {/* Descripción de ubicación */}
          <div>
            <label className="block text-sm font-semibold text-[#334155] mb-1.5">
              Descripción de ubicación
            </label>
            <input
              className="input input-bordered w-full text-sm"
              value={ubicacionDescripcion}
              onChange={(e) => setUbicacionDescripcion(e.target.value)}
              placeholder="Ej. Pasillo 2, pared derecha"
              disabled={submitting}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" className="btn btn-sm btn-ghost" onClick={onClose} disabled={submitting}>
              Cancelar
            </button>
            <button
              type="submit"
              className="btn btn-sm text-white"
              style={!isValid || submitting
                ? { backgroundColor: "#cbd5e1", borderColor: "#cbd5e1", color: "#94a3b8", cursor: "not-allowed" }
                : { backgroundColor: "#09268E", borderColor: "#09268E" }}
              disabled={!isValid || submitting}
            >
              {submitting && <span className="loading loading-spinner loading-xs" />}
              {isEditing ? "Guardar cambios" : "Crear sensor"}
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
