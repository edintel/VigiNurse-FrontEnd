"use client";
import { useEffect, useRef, useState } from "react";
import { InputField } from "@/shared/ui/InputField";
import { updateEspecialidad } from "@/features/administration/especialidades/services/especialidadService";
import type { Especialidad } from "@/features/administration/especialidades/types";
import { toast } from "@/lib/toast";
interface EditEspecialidadModalProps {
  open: boolean;
  especialidad: Especialidad | null;
  onClose: () => void;
  onUpdated: (especialidad: Especialidad) => void;
}
const EMPTY_ERRORS = {
  nombre: null as string | null,
  descripcion: null as string | null,
};
// Componente modal para editar una especialidad existente.
export function EditEspecialidadModal({
  open,
  especialidad,
  onClose,
  onUpdated,
}: EditEspecialidadModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [errors, setErrors] = useState(EMPTY_ERRORS);
  const [apiError, setApiError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    if (open && especialidad) {
      setNombre(especialidad.nombre);
      setDescripcion(especialidad.descripcion);
      setErrors(EMPTY_ERRORS);
      setApiError(null);
      dialogRef.current?.showModal();
    } else {
      dialogRef.current?.close();
    }
  }, [open, especialidad]);
  // Valida condiciones del flujo.
  function validate(): boolean {
    const next = {
      nombre: null as string | null,
      descripcion: null as string | null,
    };
    if (!nombre.trim()) next.nombre = "El nombre es obligatorio.";
    if (!descripcion.trim())
      next.descripcion = "La descripción es obligatoria.";
    setErrors(next);
    return !next.nombre && !next.descripcion;
  }
  // Maneja envio.
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!especialidad || !validate()) return;
    setLoading(true);
    setApiError(null);
    try {
      const updated = await updateEspecialidad(especialidad.id, {
        nombre: nombre.trim(),
        descripcion: descripcion.trim(),
      });
      toast.success(
        `Especialidad "${updated.nombre}" actualizada exitosamente.`,
      );
      onUpdated(updated);
      onClose();
    } catch (err: unknown) {
      const data = (
        err as {
          response?: {
            data?: {
              message?: string;
              mensaje?: string;
            };
          };
        }
      )?.response?.data;
      const msg =
        data?.mensaje ??
        data?.message ??
        "No se pudo actualizar la especialidad. Intente nuevamente.";
      setApiError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }
  return (
    <dialog ref={dialogRef} className="modal" onClose={onClose}>
      <div className="modal-box bg-[#FFFFFF] w-full max-w-sm">
        <button
          type="button"
          className="absolute right-3 top-3 text-gray-500 hover:text-[#1A2B5E] transition-colors"
          onClick={onClose}
        >
          ✕
        </button>

        <h3 className="text-lg font-bold text-[#1A2B5E] mb-1">
          Editar especialidad
        </h3>
        {especialidad && (
          <p className="text-sm text-slate-400 mb-4">ID: {especialidad.id}</p>
        )}

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

        <form
          onSubmit={handleSubmit}
          noValidate
          className="flex flex-col gap-4"
        >
          <InputField
            label="Nombre"
            id="edit-esp-nombre"
            name="nombre"
            value={nombre}
            onChange={(e) => {
              setNombre(e.target.value);
              setErrors((prev) => ({ ...prev, nombre: null }));
            }}
            placeholder="Ej. Cardiología"
            error={errors.nombre ?? undefined}
            required
          />

          <InputField
            label="Descripción"
            id="edit-esp-descripcion"
            name="descripcion"
            value={descripcion}
            onChange={(e) => {
              setDescripcion(e.target.value);
              setErrors((prev) => ({ ...prev, descripcion: null }));
            }}
            placeholder="Ej. Especialidad en enfermedades del corazón"
            error={errors.descripcion ?? undefined}
            required
          />

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
              className="btn"
              style={{
                backgroundColor: "#09268E",
                borderColor: "#09268E",
                color: "#fff",
              }}
              disabled={loading}
            >
              {loading && (
                <span className="loading loading-spinner loading-sm" />
              )}
              {loading ? "Guardando..." : "Guardar cambios"}
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
