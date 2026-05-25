"use client";
import { useEffect, useRef, useState } from "react";
import { InputField } from "@/shared/ui/InputField";
import { updateTipoSignoVital } from "@/features/administration/signosVitales/services/signosVitalesService";
import type { TipoSignoVital } from "@/features/administration/signosVitales/types";
import { toast } from "@/lib/toast";

interface EditTipoSignoVitalModalProps {
  open: boolean;
  tipo: TipoSignoVital | null;
  onClose: () => void;
  onUpdated: (tipo: TipoSignoVital) => void;
}

// Modal para editar un tipo de signo vital existente. 
export function EditTipoSignoVitalModal({
  open,
  tipo,
  onClose,
  onUpdated,
}: EditTipoSignoVitalModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [nombre, setNombre] = useState("");
  const [unidad, setUnidad] = useState("");
  const [minimoNormal, setMinimoNormal] = useState("");
  const [maximoNormal, setMaximoNormal] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [apiError, setApiError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && tipo) {
      setNombre(tipo.nombre);
      setUnidad(tipo.unidad);
      setMinimoNormal(String(tipo.minimoNormal));
      setMaximoNormal(String(tipo.maximoNormal));
      setErrors({});
      setApiError(null);
      dialogRef.current?.showModal();
    } else {
      dialogRef.current?.close();
    }
  }, [open, tipo]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!tipo) return;

    const next: Record<string, string> = {};
    if (!nombre.trim()) next.nombre = "El nombre es obligatorio.";
    if (!unidad.trim()) next.unidad = "La unidad es obligatoria.";
    const min = parseFloat(minimoNormal);
    const max = parseFloat(maximoNormal);
    if (minimoNormal.trim() === "" || isNaN(min)) next.minimoNormal = "Ingrese un valor numérico.";
    if (maximoNormal.trim() === "" || isNaN(max)) next.maximoNormal = "Ingrese un valor numérico.";
    if (!isNaN(min) && !isNaN(max) && min >= max) {
      next.maximoNormal = "El máximo debe ser mayor que el mínimo.";
    }
    if (Object.keys(next).length > 0) {
      setErrors(next);
      return;
    }

    setLoading(true);
    setApiError(null);
    try {
      const updated = await updateTipoSignoVital(tipo.id, {
        nombre: nombre.trim(),
        unidad: unidad.trim(),
        minimoNormal: min,
        maximoNormal: max,
      });
      toast.success(`"${updated.nombre}" actualizado exitosamente.`);
      onUpdated(updated);
      onClose();
    } catch (err: unknown) {
      const data = (
        err as { response?: { data?: { message?: string; mensaje?: string } } }
      )?.response?.data;
      const msg =
        data?.mensaje ?? data?.message ?? "No se pudo actualizar el tipo de signo vital.";
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
          Editar tipo de signo vital
        </h3>
        {tipo && <p className="text-sm text-slate-400 mb-4">ID: {tipo.id}</p>}

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

        <form onSubmit={(e) => void handleSubmit(e)} noValidate className="flex flex-col gap-4">
          <InputField
            label="Nombre"
            id="edit-signo-nombre"
            value={nombre}
            onChange={(e) => { setNombre(e.target.value); setErrors((p) => ({ ...p, nombre: "" })); }}
            placeholder="Ej. Saturación de oxígeno"
            error={errors.nombre}
            required
          />

          <InputField
            label="Unidad de medida"
            id="edit-signo-unidad"
            value={unidad}
            onChange={(e) => { setUnidad(e.target.value); setErrors((p) => ({ ...p, unidad: "" })); }}
            placeholder="Ej. %"
            error={errors.unidad}
            required
          />

          <div className="grid grid-cols-2 gap-3">
            <InputField
              label="Mínimo normal"
              id="edit-signo-min"
              type="number"
              value={minimoNormal}
              onChange={(e) => { setMinimoNormal(e.target.value); setErrors((p) => ({ ...p, minimoNormal: "" })); }}
              placeholder="Ej. 95"
              error={errors.minimoNormal}
              required
            />
            <InputField
              label="Máximo normal"
              id="edit-signo-max"
              type="number"
              value={maximoNormal}
              onChange={(e) => { setMaximoNormal(e.target.value); setErrors((p) => ({ ...p, maximoNormal: "" })); }}
              placeholder="Ej. 100"
              error={errors.maximoNormal}
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
              {loading && <span className="loading loading-spinner loading-sm" />}
              {loading ? "Guardando..." : "Guardar cambios"}
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
