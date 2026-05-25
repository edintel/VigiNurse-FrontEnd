"use client";
import { useEffect, useRef, useState } from "react";
import { InputField } from "@/shared/ui/InputField";
import { createEspecialidad } from "@/features/administration/especialidades/services/especialidadService";
import type { Especialidad } from "@/features/administration/especialidades/types";
import { toast } from "@/lib/toast";
interface CreateEspecialidadModalProps {
  open: boolean;
  onClose: () => void;
  onCreated: (especialidad: Especialidad) => void;
}
const EMPTY_FORM = { nombre: "", descripcion: "" };
const EMPTY_ERRORS = {
  nombre: null as string | null,
  descripcion: null as string | null,
};
// Componente modal para crear una nueva especialidad.
export function CreateEspecialidadModal({
  open,
  onClose,
  onCreated,
}: CreateEspecialidadModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState(EMPTY_ERRORS);
  const [apiError, setApiError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    if (open) {
      dialogRef.current?.showModal();
    } else {
      dialogRef.current?.close();
      setForm(EMPTY_FORM);
      setErrors(EMPTY_ERRORS);
      setApiError(null);
    }
  }, [open]);
  // Valida condiciones del flujo.
  function validate(): boolean {
    const next = {
      nombre: null as string | null,
      descripcion: null as string | null,
    };
    if (!form.nombre.trim()) next.nombre = "El nombre es obligatorio.";
    if (!form.descripcion.trim())
      next.descripcion = "La descripción es obligatoria.";
    setErrors(next);
    return !next.nombre && !next.descripcion;
  }
  // Maneja envio.
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    setApiError(null);
    try {
      const especialidad = await createEspecialidad({
        nombre: form.nombre.trim(),
        descripcion: form.descripcion.trim(),
      });
      toast.success(
        `Especialidad "${especialidad.nombre}" creada exitosamente.`,
      );
      onCreated(especialidad);
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
        "No se pudo crear la especialidad. Intente nuevamente.";
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

        <h3 className="text-lg font-bold text-[#1A2B5E] mb-4">
          Nueva especialidad
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

        <form
          onSubmit={handleSubmit}
          noValidate
          className="flex flex-col gap-4"
        >
          <InputField
            label="Nombre"
            id="create-esp-nombre"
            name="nombre"
            value={form.nombre}
            onChange={(e) => {
              setForm((f) => ({ ...f, nombre: e.target.value }));
              setErrors((prev) => ({ ...prev, nombre: null }));
            }}
            placeholder="Ej. Cardiología"
            error={errors.nombre ?? undefined}
            required
          />

          <InputField
            label="Descripción"
            id="create-esp-descripcion"
            name="descripcion"
            value={form.descripcion}
            onChange={(e) => {
              setForm((f) => ({ ...f, descripcion: e.target.value }));
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
              {loading ? "Creando..." : "Crear especialidad"}
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
