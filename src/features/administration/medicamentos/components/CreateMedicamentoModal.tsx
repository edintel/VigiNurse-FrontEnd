"use client";
import { useEffect, useRef, useState } from "react";
import { InputField } from "@/shared/ui/InputField";
import { createMedicamento } from "@/features/administration/medicamentos/services/medicamentosService";
import type { MedicamentoAdmin } from "@/features/administration/medicamentos/types";
import { toast } from "@/lib/toast";

interface Props {
  open: boolean;
  onClose: () => void;
  onCreated: (m: MedicamentoAdmin) => void;
}

// Componente modal para crear un nuevo medicamento. Se encarga de manejar el formulario, validaciones y llamadas a la API para crear el medicamento.
export function CreateMedicamentoModal({ open, onClose, onCreated }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  const [nombreGenerico, setNombreGenerico] = useState("");
  const [nombreComercial, setNombreComercial] = useState("");
  const [formulacionFarma, setFormulacionFarma] = useState("");
  const [concentracion, setConcentracion] = useState("");

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [apiError, setApiError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      dialogRef.current?.showModal();
      setNombreGenerico("");
      setNombreComercial("");
      setFormulacionFarma("");
      setConcentracion("");
      setErrors({});
      setApiError(null);
    } else {
      dialogRef.current?.close();
    }
  }, [open]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const next: Record<string, string> = {};
    if (!nombreGenerico.trim()) next.nombreGenerico = "El nombre genérico es obligatorio.";
    if (!nombreComercial.trim()) next.nombreComercial = "El nombre comercial es obligatorio.";
    if (!formulacionFarma.trim()) next.formulacionFarma = "La formulación es obligatoria.";
    if (!concentracion.trim()) next.concentracion = "La concentración es obligatoria.";
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setLoading(true);
    setApiError(null);
    try {
      const created = await createMedicamento({
        nombreGenerico: nombreGenerico.trim(),
        nombreComercial: nombreComercial.trim(),
        formulacionFarma: formulacionFarma.trim(),
        concentracion: concentracion.trim(),
      });
      toast.success("Medicamento creado exitosamente.");
      onCreated(created);
      onClose();
    } catch (err: unknown) {
      const data = (
        err as { response?: { data?: { message?: string; mensaje?: string } } }
      )?.response?.data;
      const msg =
        data?.mensaje ??
        data?.message ??
        "No se pudo crear el medicamento. Intente nuevamente.";
      setApiError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <dialog ref={dialogRef} className="modal" onClose={onClose}>
      <div className="modal-box bg-[#EEEEEE] w-full max-w-md">
        <button
          type="button"
          className="absolute right-3 top-3 text-gray-500 hover:text-[#1A2B5E] transition-colors"
          onClick={onClose}
        >
          ✕
        </button>

        <h3 className="text-lg font-bold text-[#1A2B5E] mb-4">
          Agregar medicamento
        </h3>

        {apiError && (
          <div role="alert" className="alert alert-error text-sm py-3 mb-4">
            <span>{apiError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
          <InputField
            label="Nombre genérico"
            id="create-medicamento-generico"
            name="nombreGenerico"
            value={nombreGenerico}
            onChange={(e) => {
              setNombreGenerico(e.target.value);
              setErrors((p) => ({ ...p, nombreGenerico: "" }));
            }}
            placeholder="Ej. Amoxicilina"
            error={errors.nombreGenerico || undefined}
            required
          />

          <InputField
            label="Nombre comercial"
            id="create-medicamento-comercial"
            name="nombreComercial"
            value={nombreComercial}
            onChange={(e) => {
              setNombreComercial(e.target.value);
              setErrors((p) => ({ ...p, nombreComercial: "" }));
            }}
            placeholder="Ej. Amoxicilina"
            error={errors.nombreComercial || undefined}
            required
          />

          <InputField
            label="Formulación farmacéutica"
            id="create-medicamento-formulacion"
            name="formulacionFarma"
            value={formulacionFarma}
            onChange={(e) => {
              setFormulacionFarma(e.target.value);
              setErrors((p) => ({ ...p, formulacionFarma: "" }));
            }}
            placeholder="Ej. C16H19N3O5S"
            error={errors.formulacionFarma || undefined}
            required
          />

          <InputField
            label="Concentración"
            id="create-medicamento-concentracion"
            name="concentracion"
            value={concentracion}
            onChange={(e) => {
              setConcentracion(e.target.value);
              setErrors((p) => ({ ...p, concentracion: "" }));
            }}
            placeholder="Ej. 125 mg"
            error={errors.concentracion || undefined}
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
              {loading && <span className="loading loading-spinner loading-sm" />}
              {loading ? "Creando..." : "Crear medicamento"}
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

