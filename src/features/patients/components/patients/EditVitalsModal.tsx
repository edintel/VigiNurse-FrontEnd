"use client";
import { useEffect, useRef, useState } from "react";
import { InputField } from "@/shared/ui/InputField";
import { updatePatient } from "@/features/patients/services/patientService";
import { toast } from "@/lib/toast";
import type { Paciente, UpdatePacienteDTO } from "@/features/patients/types";

interface EditVitalsModalProps {
  open: boolean;
  paciente: Paciente;
  onClose: () => void;
  onUpdated: (paciente: Paciente) => void;
}

// Modal para editar el peso y la altura del paciente.
export function EditVitalsModal({
  open,
  paciente,
  onClose,
  onUpdated,
}: EditVitalsModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  const [peso, setPeso] = useState("");
  const [altura, setAltura] = useState("");
  const [telefono, setTelefono] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      dialogRef.current?.showModal();
      setPeso(String(paciente.peso));
      setAltura(String(paciente.altura));
      setTelefono(paciente.telefono ?? "");
      setErrors({});
      setApiError(null);
    } else {
      dialogRef.current?.close();
    }
  }, [open, paciente.peso, paciente.altura, paciente.telefono]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    const pesoNum = parseFloat(peso);
    const alturaNum = parseFloat(altura);

    if (!peso || isNaN(pesoNum) || pesoNum <= 0)
      newErrors.peso = "Ingrese un peso válido (kg).";
    if (!altura || isNaN(alturaNum) || alturaNum <= 0)
      newErrors.altura = "Ingrese una altura válida (cm).";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    setApiError(null);
    try {
      const dto: UpdatePacienteDTO = {
        nombre: paciente.nombre,
        apellidos: paciente.apellidos,
        tipoSangre: paciente.tipoSangre,
        peso: pesoNum,
        altura: alturaNum,
        telefono: telefono.trim(),
      };
      const updated = await updatePatient(paciente.id, dto);
      toast.success("Datos del paciente actualizados.");
      onUpdated(updated);
      onClose();
    } catch (err: unknown) {
      const data = (
        err as { response?: { data?: { message?: string; mensaje?: string } } }
      )?.response?.data;
      const msg =
        data?.mensaje ??
        data?.message ??
        "No se pudieron actualizar los datos. Intente nuevamente.";
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
          Editar datos del paciente
        </h3>

        {apiError && (
          <div role="alert" className="alert alert-error text-sm py-3 mb-4">
            <span>{apiError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
            <InputField
              id="edit-vitals-peso"
              label="Peso (kg)"
              type="number"
              min="1"
              max="500"
              step="0.1"
              value={peso}
              onChange={(e) => {
                setPeso(e.target.value);
                setErrors((p) => ({ ...p, peso: "" }));
              }}
              error={errors.peso}
              required
            />
            <InputField
              id="edit-vitals-altura"
              label="Altura (cm)"
              type="number"
              min="50"
              max="300"
              step="1"
              value={altura}
              onChange={(e) => {
                setAltura(e.target.value);
                setErrors((p) => ({ ...p, altura: "" }));
              }}
              error={errors.altura}
              required
            />
          </div>
          <InputField
            id="edit-vitals-telefono"
            label="Teléfono"
            type="tel"
            value={telefono}
            onChange={(e) => setTelefono(e.target.value)}
            placeholder="Ej. +506 8888-8888"
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
              className="btn text-white"
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
