"use client";
import { useEffect, useRef, useState } from "react";
import { InputField } from "@/shared/ui/InputField";
import {
  createAllergy,
  updateAllergy,
} from "@/features/patients/services/patientService";
import { toast } from "@/lib/toast";
import {
  SeveridadAlergia,
  SEVERIDAD_CONFIG,
} from "@/features/patients/types";
import type { Alergia, CreateAlergiaDTO } from "@/features/patients/types";

interface AllergyModalProps {
  open: boolean;
  pacienteId: number;
  alergia: Alergia | null;
  onClose: () => void;
  onSaved: (alergia: Alergia) => void;
}

const SEVERIDAD_OPTIONS = [
  SeveridadAlergia.Leve,
  SeveridadAlergia.Moderada,
  SeveridadAlergia.Grave,
];

// Modal para registrar o editar una alergia del paciente.
export function AllergyModal({
  open,
  pacienteId,
  alergia,
  onClose,
  onSaved,
}: AllergyModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const isEdit = alergia !== null;

  const [alergeno, setAlergeno] = useState("");
  const [severidad, setSeveridad] = useState<SeveridadAlergia>(SeveridadAlergia.Leve);
  const [reaccion, setReaccion] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      dialogRef.current?.showModal();
      setAlergeno(alergia?.alergeno ?? "");
      setSeveridad(alergia?.severidad ?? SeveridadAlergia.Leve);
      setReaccion(alergia?.reaccion ?? "");
      setErrors({});
      setApiError(null);
    } else {
      dialogRef.current?.close();
    }
  }, [open, alergia]);

  function validate(): Record<string, string> {
    const e: Record<string, string> = {};
    if (!alergeno.trim()) e.alergeno = "El alergeno es obligatorio.";
    if (!reaccion.trim()) e.reaccion = "La reacción es obligatoria.";
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
    const dto: CreateAlergiaDTO = {
      alergeno: alergeno.trim(),
      severidad,
      reaccion: reaccion.trim(),
    };

    try {
      let saved: Alergia;
      if (isEdit) {
        saved = await updateAllergy(pacienteId, alergia!.id, dto);
      } else {
        saved = await createAllergy(pacienteId, dto);
      }
      toast.success(
        isEdit ? "Alergia actualizada exitosamente." : "Alergia registrada exitosamente.",
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
        "No se pudo guardar la alergia. Intente nuevamente.";
      setApiError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <dialog ref={dialogRef} className="modal" onClose={onClose}>
      <div className="modal-box bg-[#FFFFFF] w-full max-w-md">
        <button
          type="button"
          className="absolute right-3 top-3 text-gray-500 hover:text-[#1A2B5E] transition-colors"
          onClick={onClose}
        >
          ✕
        </button>

        <h3 className="text-lg font-bold text-[#1A2B5E] mb-4">
          {isEdit ? "Editar alergia" : "Registrar alergia"}
        </h3>

        {apiError && (
          <div role="alert" className="alert alert-error text-sm py-3 mb-4">
            <span>{apiError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
          {/* Alergeno */}
          <InputField
            id="alergia-alergeno"
            label="Alergeno"
            placeholder="Ej: Penicilina, Polen, Mariscos..."
            value={alergeno}
            onChange={(e) => {
              setAlergeno(e.target.value);
              setErrors((p) => ({ ...p, alergeno: "" }));
            }}
            error={errors.alergeno}
            required
          />

          {/* Severidad */}
          <div className="form-control w-full">
            <label htmlFor="alergia-severidad" className="label pb-0.5">
              <span className="label-text text-xs font-semibold text-[#1A2B5E]">
                Severidad <span className="text-red-500">*</span>
              </span>
            </label>
            <select
              id="alergia-severidad"
              className="select select-bordered w-full bg-[#FFFFFF] border-[#B0B0B0] text-[#1A2B5E] focus:border-[#09268E]"
              value={severidad}
              onChange={(e) =>
                setSeveridad(Number(e.target.value) as SeveridadAlergia)
              }
            >
              {SEVERIDAD_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {SEVERIDAD_CONFIG[s].label}
                </option>
              ))}
            </select>
          </div>

          {/* Reacción */}
          <div className="form-control w-full">
            <label htmlFor="alergia-reaccion" className="label pb-0.5">
              <span className="label-text text-xs font-semibold text-[#1A2B5E]">
                Reacción <span className="text-red-500">*</span>
              </span>
            </label>
            <textarea
              id="alergia-reaccion"
              rows={3}
              placeholder="Describa la reacción que presenta el paciente..."
              className={`textarea textarea-bordered w-full bg-[#FFFFFF] border-[#B0B0B0] text-[#1A2B5E] focus:border-[#09268E] resize-none ${
                errors.reaccion ? "border-red-500" : ""
              }`}
              value={reaccion}
              onChange={(e) => {
                setReaccion(e.target.value);
                setErrors((p) => ({ ...p, reaccion: "" }));
              }}
            />
            {errors.reaccion && (
              <span className="text-xs text-red-500 mt-0.5">
                {errors.reaccion}
              </span>
            )}
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
              {loading ? "Guardando..." : "Guardar"}
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
