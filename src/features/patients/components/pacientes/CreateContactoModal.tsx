"use client";
import { useEffect, useRef, useState } from "react";
import { createContactoPaciente } from "@/features/patients/services/patientService";
import { InputField } from "@/shared/ui/InputField";
import type { CreateContactoDTO } from "@/features/patients/types";
import { toast } from "@/lib/toast";

interface CreateContactoModalProps {
  open: boolean;
  pacienteId: number;
  onClose: () => void;
}

// Componente modal para crear un nuevo contacto de emergencia para un paciente
export function CreateContactoModal({
  open,
  pacienteId,
  onClose,
}: CreateContactoModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  const [nombre, setNombre] = useState("");
  const [apellidos, setApellidos] = useState("");
  const [relacion, setRelacion] = useState("");
  const [telefono, setTelefono] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      dialogRef.current?.showModal();
      setNombre("");
      setApellidos("");
      setRelacion("");
      setTelefono("");
      setErrors({});
    } else {
      dialogRef.current?.close();
    }
  }, [open]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const newErrors: Record<string, string> = {};
    if (!nombre.trim()) newErrors.nombre = "El nombre es obligatorio.";
    if (!apellidos.trim()) newErrors.apellidos = "Los apellidos son obligatorios.";
    if (!relacion.trim()) newErrors.relacion = "La relación es obligatoria.";
    if (!telefono.trim()) newErrors.telefono = "El teléfono es obligatorio.";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    try {
      const dto: CreateContactoDTO = {
        nombre: nombre.trim(),
        apellidos: apellidos.trim(),
        relacion: relacion.trim(),
        telefono: telefono.trim(),
      };
      await createContactoPaciente(pacienteId, dto);
      toast.success("Contacto de emergencia agregado exitosamente.");
      onClose();
    } catch (err: unknown) {
      const data = (
        err as { response?: { data?: { message?: string; mensaje?: string } } }
      )?.response?.data;
      const msg =
        data?.mensaje ??
        data?.message ??
        "No se pudo agregar el contacto. Intente nuevamente.";
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

        <h3 className="text-lg font-bold text-[#1A2B5E] mb-1">
          Contacto de emergencia
        </h3>
        <p className="text-sm text-slate-500 mb-4">
          Complete los datos del contacto de emergencia del paciente.
        </p>

        <form onSubmit={(e) => void handleSubmit(e)} noValidate className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
            <InputField
              label="Nombre"
              id="contacto-nombre"
              value={nombre}
              onChange={(e) => {
                setNombre(e.target.value);
                setErrors((p) => ({ ...p, nombre: "" }));
              }}
              placeholder="Ej. Ana"
              error={errors.nombre}
              required
            />
            <InputField
              label="Apellidos"
              id="contacto-apellidos"
              value={apellidos}
              onChange={(e) => {
                setApellidos(e.target.value);
                setErrors((p) => ({ ...p, apellidos: "" }));
              }}
              placeholder="Ej. González"
              error={errors.apellidos}
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <InputField
              label="Relación"
              id="contacto-relacion"
              value={relacion}
              onChange={(e) => {
                setRelacion(e.target.value);
                setErrors((p) => ({ ...p, relacion: "" }));
              }}
              placeholder="Ej. Madre, Esposo..."
              error={errors.relacion}
              required
            />
            <InputField
              label="Teléfono"
              id="contacto-telefono"
              value={telefono}
              onChange={(e) => {
                setTelefono(e.target.value);
                setErrors((p) => ({ ...p, telefono: "" }));
              }}
              placeholder="Ej. 8888-8888"
              error={errors.telefono}
              required
            />
          </div>

          <div className="modal-action mt-1">
            <button
              type="button"
              className="btn btn-ghost btn-sm font-semibold text-slate-500"
              onClick={onClose}
              disabled={loading}
            >
              Omitir
            </button>
            <button
              type="submit"
              className="btn text-white"
              style={{ backgroundColor: "#09268E", borderColor: "#09268E" }}
              disabled={loading}
            >
              {loading && <span className="loading loading-spinner loading-sm" />}
              {loading ? "Guardando..." : "Guardar contacto"}
            </button>
          </div>
        </form>
      </div>
      <form method="dialog" className="modal-backdrop">
        <button type="submit" onClick={onClose}>close</button>
      </form>
    </dialog>
  );
}
