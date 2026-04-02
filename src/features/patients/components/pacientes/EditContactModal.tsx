"use client";
import { useEffect, useRef, useState } from "react";
import { InputField } from "@/shared/ui/InputField";
import {
  createContactoPaciente,
  updateContactoPaciente,
} from "@/features/patients/services/patientService";
import { toast } from "@/lib/toast";
import type { ContactoPaciente, UpdateContactoDTO } from "@/features/patients/types";

interface EditContactModalProps {
  open: boolean;
  pacienteId: number;
  contacto: ContactoPaciente | null;
  onClose: () => void;
  onSaved: (contacto: ContactoPaciente) => void;
}

// Modal para crear o editar el contacto de emergencia de un paciente.
export function EditContactModal({
  open,
  pacienteId,
  contacto,
  onClose,
  onSaved,
}: EditContactModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const isEdit = contacto !== null;

  const [nombre, setNombre] = useState("");
  const [apellidos, setApellidos] = useState("");
  const [relacion, setRelacion] = useState("");
  const [telefono, setTelefono] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      dialogRef.current?.showModal();
      setNombre(contacto?.nombre ?? "");
      setApellidos(contacto?.apellidos ?? "");
      setRelacion(contacto?.relacion ?? "");
      setTelefono(contacto?.telefono ?? "");
      setErrors({});
      setApiError(null);
    } else {
      dialogRef.current?.close();
    }
  }, [open, contacto]);

  function validate(): Record<string, string> {
    const e: Record<string, string> = {};
    if (!nombre.trim()) e.nombre = "El nombre es obligatorio.";
    if (!apellidos.trim()) e.apellidos = "Los apellidos son obligatorios.";
    if (!relacion.trim()) e.relacion = "La relación es obligatoria.";
    if (!telefono.trim()) e.telefono = "El teléfono es obligatorio.";
    return e;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const newErrors = validate();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    setApiError(null);
    const dto: UpdateContactoDTO = {
      nombre: nombre.trim(),
      apellidos: apellidos.trim(),
      relacion: relacion.trim(),
      telefono: telefono.trim(),
    };

    try {
      let saved: ContactoPaciente;
      if (isEdit) {
        saved = await updateContactoPaciente(pacienteId, contacto!.id, dto);
      } else {
        saved = await createContactoPaciente(pacienteId, dto);
      }
      toast.success(
        isEdit
          ? "Contacto actualizado exitosamente."
          : "Contacto registrado exitosamente.",
      );
      onSaved(saved);
      onClose();
    } catch (err: unknown) {
      const data = (
        err as { response?: { data?: { message?: string; mensaje?: string } } }
      )?.response?.data;
      const msg =
        data?.mensaje ??
        data?.message ??
        "No se pudo guardar el contacto. Intente nuevamente.";
      setApiError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <dialog ref={dialogRef} className="modal" onClose={onClose}>
      <div className="modal-box bg-[#EEEEEE] w-full max-w-lg">
        <button
          type="button"
          className="absolute right-3 top-3 text-gray-500 hover:text-[#1A2B5E] transition-colors"
          onClick={onClose}
        >
          ✕
        </button>

        <h3 className="text-lg font-bold text-[#1A2B5E] mb-4">
          {isEdit ? "Editar contacto de emergencia" : "Agregar contacto de emergencia"}
        </h3>

        {apiError && (
          <div role="alert" className="alert alert-error text-sm py-3 mb-4">
            <span>{apiError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
            <InputField
              id="edit-contact-nombre"
              label="Nombre"
              value={nombre}
              onChange={(e) => {
                setNombre(e.target.value);
                setErrors((p) => ({ ...p, nombre: "" }));
              }}
              error={errors.nombre}
              required
            />
            <InputField
              id="edit-contact-apellidos"
              label="Apellidos"
              value={apellidos}
              onChange={(e) => {
                setApellidos(e.target.value);
                setErrors((p) => ({ ...p, apellidos: "" }));
              }}
              error={errors.apellidos}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <InputField
              id="edit-contact-relacion"
              label="Relación"
              placeholder="Ej: Madre, Hijo, Cónyuge..."
              value={relacion}
              onChange={(e) => {
                setRelacion(e.target.value);
                setErrors((p) => ({ ...p, relacion: "" }));
              }}
              error={errors.relacion}
              required
            />
            <InputField
              id="edit-contact-telefono"
              label="Teléfono"
              type="tel"
              value={telefono}
              onChange={(e) => {
                setTelefono(e.target.value);
                setErrors((p) => ({ ...p, telefono: "" }));
              }}
              error={errors.telefono}
              required
            />
          </div>

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
              className="btn text-white"
              style={{ backgroundColor: "#09268E", borderColor: "#09268E" }}
              disabled={loading}
            >
              {loading && (
                <span className="loading loading-spinner loading-sm" />
              )}
              {loading ? "Guardando..." : "Guardar contacto"}
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
