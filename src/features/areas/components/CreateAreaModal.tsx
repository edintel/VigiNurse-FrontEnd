"use client";
import { useEffect, useRef, useState } from "react";
import { InputField } from "@/shared/ui/InputField";
import { createArea } from "@/features/areas/services/areaService";
import type { Area } from "@/features/areas/types";
import { toast } from "@/lib/toast";

interface CreateAreaModalProps {
  open: boolean;
  onClose: () => void;
  onCreated: (area: Area) => void;
}

// Modal para crear una nueva área del hospital.
export function CreateAreaModal({
  open,
  onClose,
  onCreated,
}: CreateAreaModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [nombre, setNombre] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      dialogRef.current?.showModal();
    } else {
      dialogRef.current?.close();
      setNombre("");
      setError(null);
      setApiError(null);
    }
  }, [open]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!nombre.trim()) {
      setError("El nombre es obligatorio.");
      return;
    }
    setLoading(true);
    setApiError(null);
    try {
      const area = await createArea({ nombre: nombre.trim() });
      toast.success(`Área "${area.nombre}" creada exitosamente.`);
      onCreated(area);
      onClose();
    } catch (err: unknown) {
      const data = (
        err as { response?: { data?: { message?: string; mensaje?: string } } }
      )?.response?.data;
      const msg =
        data?.mensaje ??
        data?.message ??
        "No se pudo crear el área. Intente nuevamente.";
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

        <h3 className="text-lg font-bold text-[#1A2B5E] mb-4">Agregar área</h3>

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
            label="Nombre del área"
            id="create-area-nombre"
            name="nombre"
            value={nombre}
            onChange={(e) => {
              setNombre(e.target.value);
              setError(null);
            }}
            placeholder="Ej. Urgencias"
            error={error ?? undefined}
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
              className="btn btn-primary"
              style={{ backgroundColor: "#09268E", borderColor: "#09268E" }}
              disabled={loading}
            >
              {loading && (
                <span className="loading loading-spinner loading-sm" />
              )}
              {loading ? "Creando..." : "Crear área"}
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
