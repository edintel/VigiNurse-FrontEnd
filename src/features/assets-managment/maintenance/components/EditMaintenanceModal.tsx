"use client";
import { useEffect, useRef, useState } from "react";
import { SearchableSelect } from "@/shared/ui/SearchableSelect";
import { CallyDatePicker } from "@/shared/ui/CallyDatePicker";
import { updateMantenimiento } from "@/features/assets-managment/maintenance/services/maintenanceService";
import { getUsers } from "@/features/administration/users/services/userManagementService";
import { MantenimientoTipo } from "@/features/assets-managment/maintenance/types";
import type { Mantenimiento } from "@/features/assets-managment/maintenance/types";
import { toast } from "@/lib/toast";

interface SelectOption {
  id: number;
  label: string;
  sublabel?: string;
}

interface EditMantenimientoModalProps {
  open: boolean;
  activoId: number;
  mantenimiento: Mantenimiento | null;
  onClose: () => void;
  onUpdated: (m: Mantenimiento) => void;
}

// Modal para editar un mantenimiento programado. Solo se pueden cambiar la fecha programada y el responsable. El tipo y la razón son de solo lectura. Se muestra un error general si la actualización falla por algún motivo. Se validan los campos requeridos antes de enviar.
export function EditMantenimientoModal({
  open,
  activoId,
  mantenimiento,
  onClose,
  onUpdated,
}: EditMantenimientoModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  const [fechaProgramada, setFechaProgramada] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [apiError, setApiError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Responsable SearchableSelect
  const [respOptions, setRespOptions] = useState<SelectOption[]>([]);
  const [respSearch, setRespSearch] = useState("");
  const [respSelectedId, setRespSelectedId] = useState<number | null>(null);
  const [respShowDropdown, setRespShowDropdown] = useState(false);
  const [respLoading, setRespLoading] = useState(false);

  useEffect(() => {
    if (open && mantenimiento) {
      dialogRef.current?.showModal();
      setFechaProgramada(mantenimiento.fechaProgramada.slice(0, 10));
      setRespSelectedId(mantenimiento.responsableId);
      setRespSearch(mantenimiento.nombreResponsable);
      setErrors({});
      setApiError(null);

      // Cargar técnicos para el select de responsables
      setRespLoading(true);
      getUsers(1, 200, { rol: "TECNICO" })
        .then((res) =>
          setRespOptions(
            res.datos.map((u) => ({
              id: u.id,
              label: `${u.nombre} ${u.apellidos}`,
              sublabel: u.cedula ?? undefined,
            })),
          ),
        )
        .catch(() => {})
        .finally(() => setRespLoading(false));
    } else {
      dialogRef.current?.close();
    }
  }, [open, mantenimiento]);

  // Valida los campos requeridos y llama a la API para actualizar el mantenimiento. Muestra un toast de éxito o error según corresponda.
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const newErrors: Record<string, string> = {};
    if (!fechaProgramada)
      newErrors.fecha = "La fecha programada es obligatoria.";
    if (respSelectedId === null)
      newErrors.resp = "El responsable es obligatorio.";
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    if (!mantenimiento) return;

    setLoading(true);
    setApiError(null);
    try {
      const updated = await updateMantenimiento(activoId, mantenimiento.id, {
        tipo: mantenimiento.tipo,
        razon: mantenimiento.razon,
        fechaProgramada: new Date(fechaProgramada).toISOString(),
        responsableId: respSelectedId!,
      });
      toast.success("Mantenimiento actualizado exitosamente.");
      onUpdated(updated);
      onClose();
    } catch (err: unknown) {
      const data = (
        err as { response?: { data?: { message?: string; mensaje?: string } } }
      )?.response?.data;
      const msg =
        data?.mensaje ??
        data?.message ??
        "No se pudo actualizar el mantenimiento. Intente nuevamente.";
      setApiError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  // Filtra las opciones de responsables según el texto de búsqueda, buscando tanto en el label como en el sublabel (nombre completo y cédula).
  const filteredResp = respOptions.filter(
    (r) =>
      r.label.toLowerCase().includes(respSearch.toLowerCase()) ||
      (r.sublabel?.toLowerCase().includes(respSearch.toLowerCase()) ?? false),
  );

  const tipoLabel =
    mantenimiento?.tipo === MantenimientoTipo.Preventivo
      ? "Preventivo"
      : "Correctivo";

  return (
    <dialog ref={dialogRef} className="modal" onClose={onClose}>
      <div className="modal-box bg-[#EEEEEE] w-full max-w-lg overflow-visible">
        <button
          type="button"
          className="absolute right-3 top-3 text-gray-500 hover:text-[#1A2B5E] transition-colors"
          onClick={onClose}
        >
          ✕
        </button>

        <h3 className="text-lg font-bold text-[#1A2B5E] mb-4">
          Editar mantenimiento
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
          {/* Tipo — solo lectura */}
          <div className="form-control w-full">
            <label className="label pb-1">
              <span
                className="label-text text-sm font-medium"
                style={{ color: "#1A2B5E" }}
              >
                Tipo
              </span>
            </label>
            <div className="px-3 py-2 rounded border border-[#B0B0B0]/60 bg-[#EEEEEE] text-sm text-slate-500 select-none">
              {tipoLabel}
            </div>
          </div>

          {/* Razón — solo lectura */}
          <div className="form-control w-full">
            <label className="label pb-1">
              <span
                className="label-text text-sm font-medium"
                style={{ color: "#1A2B5E" }}
              >
                Razón
              </span>
            </label>
            <div className="px-3 py-2 rounded border border-[#B0B0B0]/60 bg-[#EEEEEE] text-sm text-slate-500 min-h-[4.5rem] whitespace-pre-wrap select-none">
              {mantenimiento?.razon}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Fecha programada — editable */}
            <CallyDatePicker
              id="edit-mant-fecha"
              label="Fecha programada"
              required
              value={fechaProgramada}
              onChange={(val) => {
                setFechaProgramada(val);
                setErrors((p) => ({ ...p, fecha: "" }));
              }}
              error={errors.fecha}
            />

            {/* Responsable — editable */}
            <SearchableSelect
              id="edit-mant-resp"
              label="Responsable"
              required
              inputClassName="h-12"
              options={filteredResp}
              loading={respLoading}
              selectedId={respSelectedId}
              searchValue={respSearch}
              onSearchChange={(e) => {
                setRespSearch(e.target.value);
                setErrors((p) => ({ ...p, resp: "" }));
              }}
              onSelect={(opt) => {
                setRespSelectedId(opt.id);
                setRespSearch(opt.label);
                setRespShowDropdown(false);
                setErrors((p) => ({ ...p, resp: "" }));
              }}
              showDropdown={respShowDropdown}
              onFocus={() => setRespShowDropdown(true)}
              onBlur={() => setRespShowDropdown(false)}
              placeholder="Buscar técnico..."
              error={errors.resp}
              onClear={() => {
                setRespSelectedId(null);
                setRespSearch("");
              }}
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
