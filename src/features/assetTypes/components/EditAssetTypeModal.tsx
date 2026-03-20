"use client";
import { useEffect, useRef, useState } from "react";
import { InputField } from "@/shared/ui/InputField";
import { updateTipoActivo } from "@/features/assetTypes/services/assetTypeService";
import type { TipoActivo } from "@/features/assetTypes/types";
import { toast } from "@/lib/toast";

interface EditTipoActivoModalProps {
  open: boolean;
  tipoActivo: TipoActivo | null;
  onClose: () => void;
  onUpdated: (tipoActivo: TipoActivo) => void;
}

// Modal para editar un tipo de activo existente.
export function EditTipoActivoModal({
  open,
  tipoActivo,
  onClose,
  onUpdated,
}: EditTipoActivoModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [errors, setErrors] = useState<{
    nombre?: string;
    descripcion?: string;
  }>({});
  const [apiError, setApiError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && tipoActivo) {
      setNombre(tipoActivo.nombre);
      setDescripcion(tipoActivo.descripcion);
      setErrors({});
      setApiError(null);
      dialogRef.current?.showModal();
    } else {
      dialogRef.current?.close();
    }
  }, [open, tipoActivo]);

  function validate() {
    const next: { nombre?: string; descripcion?: string } = {};
    if (!nombre.trim()) next.nombre = "El nombre es obligatorio.";
    if (!descripcion.trim())
      next.descripcion = "La descripción es obligatoria.";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!tipoActivo || !validate()) return;
    setLoading(true);
    setApiError(null);
    try {
      const updated = await updateTipoActivo(tipoActivo.id, {
        nombre: nombre.trim(),
        descripcion: descripcion.trim(),
      });
      toast.success(
        `Tipo de activo "${updated.nombre}" actualizado exitosamente.`,
      );
      onUpdated(updated);
      onClose();
    } catch (err: unknown) {
      const data = (
        err as { response?: { data?: { message?: string; mensaje?: string } } }
      )?.response?.data;
      const msg =
        data?.mensaje ??
        data?.message ??
        "No se pudo actualizar el tipo de activo. Intente nuevamente.";
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

        <h3 className="text-lg font-bold text-[#1A2B5E] mb-1">
          Editar tipo de activo
        </h3>
        {tipoActivo && (
          <p className="text-sm text-slate-400 mb-4">ID: {tipoActivo.id}</p>
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
            id="edit-tipo-activo-nombre"
            name="nombre"
            value={nombre}
            onChange={(e) => {
              setNombre(e.target.value);
              setErrors((prev) => ({ ...prev, nombre: undefined }));
            }}
            placeholder="Ej. Monitor"
            error={errors.nombre}
            required
          />
          <InputField
            label="Descripción"
            id="edit-tipo-activo-descripcion"
            name="descripcion"
            value={descripcion}
            onChange={(e) => {
              setDescripcion(e.target.value);
              setErrors((prev) => ({ ...prev, descripcion: undefined }));
            }}
            placeholder="Ej. Monitor de signos vitales"
            error={errors.descripcion}
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
