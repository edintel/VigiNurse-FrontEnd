"use client";
import { useEffect, useRef, useState } from "react";
import { InputField } from "@/shared/ui/InputField";
import { createZona } from "@/features/zones/services/zoneService";
import type { Zona } from "@/features/zones/types";
import { toast } from "@/lib/toast";

interface CreateZonaModalProps {
  open: boolean;
  onClose: () => void;
  onCreated: (zona: Zona) => void;
}

// Modal para crear una nueva zona del hospital.
export function CreateZonaModal({
  open,
  onClose,
  onCreated,
}: CreateZonaModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [esSegura, setEsSegura] = useState(false);
  const [sensor, setSensor] = useState("");
  const [errors, setErrors] = useState<{
    nombre?: string;
    descripcion?: string;
    sensor?: string;
  }>({});
  const [apiError, setApiError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      dialogRef.current?.showModal();
    } else {
      dialogRef.current?.close();
      setNombre("");
      setDescripcion("");
      setEsSegura(false);
      setSensor("");
      setErrors({});
      setApiError(null);
    }
  }, [open]);

  function validate() {
    const next: { nombre?: string; descripcion?: string; sensor?: string } = {};
    if (!nombre.trim()) next.nombre = "El nombre es obligatorio.";
    if (!descripcion.trim()) next.descripcion = "La descripción es obligatoria.";
    if (!sensor.trim()) next.sensor = "El sensor es obligatorio.";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    setApiError(null);
    try {
      const zona = await createZona({
        nombre: nombre.trim(),
        descripcion: descripcion.trim(),
        esSegura,
        sensor: sensor.trim(),
      });
      toast.success(`Zona "${zona.nombre}" creada exitosamente.`);
      onCreated(zona);
      onClose();
    } catch (err: unknown) {
      const data = (
        err as { response?: { data?: { message?: string; mensaje?: string } } }
      )?.response?.data;
      const msg =
        data?.mensaje ??
        data?.message ??
        "No se pudo crear la zona. Intente nuevamente.";
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

        <h3 className="text-lg font-bold text-[#1A2B5E] mb-4">
          Agregar zona
        </h3>

        {apiError && (
          <div role="alert" className="alert alert-error text-sm py-3 mb-4">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 shrink-0 stroke-current"
              fill="none"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span>{apiError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
          <InputField
            label="Nombre"
            id="create-zona-nombre"
            name="nombre"
            value={nombre}
            onChange={(e) => {
              setNombre(e.target.value);
              setErrors((prev) => ({ ...prev, nombre: undefined }));
            }}
            placeholder="Ej. Salida Norte"
            error={errors.nombre}
            required
          />
          <InputField
            label="Descripción"
            id="create-zona-descripcion"
            name="descripcion"
            value={descripcion}
            onChange={(e) => {
              setDescripcion(e.target.value);
              setErrors((prev) => ({ ...prev, descripcion: undefined }));
            }}
            placeholder="Ej. Salida a la calle 14"
            error={errors.descripcion}
            required
          />
          <InputField
            label="Sensor"
            id="create-zona-sensor"
            name="sensor"
            value={sensor}
            onChange={(e) => {
              setSensor(e.target.value);
              setErrors((prev) => ({ ...prev, sensor: undefined }));
            }}
            placeholder="Ej. 134232345r32"
            error={errors.sensor}
            required
          />

          <label className="flex items-center gap-3 cursor-pointer select-none">
            <input
              type="checkbox"
              className="checkbox"
              style={{ accentColor: "#09268E" }}
              checked={esSegura}
              onChange={(e) => setEsSegura(e.target.checked)}
            />
            <span className="text-sm font-medium text-[#1A2B5E]">
              Zona segura
            </span>
          </label>

          <div className="modal-action mt-1">
            <button
              type="button"
              className="btn text-white"
              style={{ backgroundColor: "#ff627d", borderColor: "#ff627d" }}
              onClick={onClose}
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              style={{ backgroundColor: "#09268E", borderColor: "#09268E" }}
              disabled={loading}
            >
              {loading && (
                <span className="loading loading-spinner loading-sm" />
              )}
              {loading ? "Creando..." : "Crear"}
            </button>
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
