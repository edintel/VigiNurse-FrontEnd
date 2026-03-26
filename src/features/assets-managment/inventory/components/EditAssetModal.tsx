"use client";
import { useEffect, useRef, useState } from "react";
import { InputField } from "@/shared/ui/InputField";
import { SearchableSelect } from "@/shared/ui/SearchableSelect";
import { updateActivo } from "@/features/assets-managment/inventory/services/assetService";
import { getTiposActivos } from "@/features/administration/assetTypes/services/assetTypeService";
import { getAreas } from "@/features/administration/areas/services/areaService";
import { ActivoEstado } from "@/features/assets-managment/inventory/types";
import type { Activo } from "@/features/assets-managment/inventory/types";
import { toast } from "@/lib/toast";

interface SelectOption {
  id: number;
  label: string;
}

interface EditAssetModalProps {
  open: boolean;
  activo: Activo | null;
  onClose: () => void;
  onUpdated: (activo: Activo) => void;
}

// Modal para editar un activo médico existente.
export function EditAssetModal({
  open,
  activo,
  onClose,
  onUpdated,
}: EditAssetModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  const [numeroSerie, setNumeroSerie] = useState("");
  const [marca, setMarca] = useState("");
  const [modelo, setModelo] = useState("");
  const [estado, setEstado] = useState<number>(ActivoEstado.Disponible);
  const [esCritico, setEsCritico] = useState(false);
  const [rfidCodigo, setRfidCodigo] = useState("");

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [apiError, setApiError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Tipo activo SearchableSelect
  const [tipoOptions, setTipoOptions] = useState<SelectOption[]>([]);
  const [tipoSearch, setTipoSearch] = useState("");
  const [tipoSelectedId, setTipoSelectedId] = useState<number | null>(null);
  const [tipoShowDropdown, setTipoShowDropdown] = useState(false);
  const [tipoLoading, setTipoLoading] = useState(false);

  // Área SearchableSelect
  const [areaOptions, setAreaOptions] = useState<SelectOption[]>([]);
  const [areaSearch, setAreaSearch] = useState("");
  const [areaSelectedId, setAreaSelectedId] = useState<number | null>(null);
  const [areaShowDropdown, setAreaShowDropdown] = useState(false);
  const [areaLoading, setAreaLoading] = useState(false);

  useEffect(() => {
    if (open && activo) {
      setNumeroSerie(activo.numeroSerie);
      setMarca(activo.marca);
      setModelo(activo.modelo);
      setEstado(activo.estado);
      setEsCritico(activo.esCritico);
      setRfidCodigo(activo.rfidCodigo ?? "");
      setErrors({});
      setApiError(null);

      setTipoLoading(true);
      getTiposActivos(1, 200)
        .then((res) => {
          const opts = res.datos.map((t) => ({ id: t.id, label: t.nombre }));
          setTipoOptions(opts);
          const current = opts.find((t) => t.id === activo.tipoActivoId);
          if (current) {
            setTipoSelectedId(current.id);
            setTipoSearch(current.label);
          }
        })
        .catch(() => {})
        .finally(() => setTipoLoading(false));

      setAreaLoading(true);
      getAreas(1, 200)
        .then((res) => {
          const opts = res.datos.map((a) => ({ id: a.id, label: a.nombre }));
          setAreaOptions(opts);
          const current = opts.find((a) => a.id === activo.areaId);
          if (current) {
            setAreaSelectedId(current.id);
            setAreaSearch(current.label);
          }
        })
        .catch(() => {})
        .finally(() => setAreaLoading(false));

      dialogRef.current?.showModal();
    } else {
      dialogRef.current?.close();
      setTipoSearch("");
      setTipoSelectedId(null);
      setAreaSearch("");
      setAreaSelectedId(null);
    }
  }, [open, activo]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!activo) return;
    const newErrors: Record<string, string> = {};
    if (!numeroSerie.trim())
      newErrors.numeroSerie = "El número de serie es obligatorio.";
    if (!marca.trim()) newErrors.marca = "La marca es obligatoria.";
    if (!modelo.trim()) newErrors.modelo = "El modelo es obligatorio.";
    if (tipoSelectedId === null)
      newErrors.tipo = "El tipo de activo es obligatorio.";
    if (areaSelectedId === null) newErrors.area = "El área es obligatoria.";
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    setLoading(true);
    setApiError(null);
    try {
      const updated = await updateActivo(activo.id, {
        numeroSerie: numeroSerie.trim(),
        tipoActivoId: tipoSelectedId!,
        marca: marca.trim(),
        modelo: modelo.trim(),
        estado,
        esCritico,
        rfidCodigo: rfidCodigo.trim() || null,
        areaId: areaSelectedId!,
      });
      toast.success(
        `Activo "${updated.numeroSerie}" actualizado exitosamente.`,
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
        "No se pudo actualizar el activo. Intente nuevamente.";
      setApiError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  const filteredTipos = tipoOptions.filter((t) =>
    t.label.toLowerCase().includes(tipoSearch.toLowerCase()),
  );
  const filteredAreas = areaOptions.filter((a) =>
    a.label.toLowerCase().includes(areaSearch.toLowerCase()),
  );

  return (
    <dialog ref={dialogRef} className="modal" onClose={onClose}>
      <div className="modal-box bg-[#EEEEEE] w-full max-w-xl">
        <button
          type="button"
          className="absolute right-3 top-3 text-gray-500 hover:text-[#1A2B5E] transition-colors"
          onClick={onClose}
        >
          ✕
        </button>

        <h3 className="text-lg font-bold text-[#1A2B5E] mb-1">Editar activo</h3>
        {activo && (
          <p className="text-sm text-slate-400 mb-4">
            ID: {activo.id} · SN: {activo.numeroSerie}
          </p>
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
          <div className="grid grid-cols-2 gap-4">
            <InputField
              label="Número de serie"
              id="edit-activo-serie"
              name="numeroSerie"
              value={numeroSerie}
              onChange={() => {}}
              placeholder="Ej. 2C43FC2145"
              disabled
            />
            <InputField
              label="Marca"
              id="edit-activo-marca"
              name="marca"
              value={marca}
              onChange={(e) => {
                setMarca(e.target.value);
                setErrors((p) => ({ ...p, marca: "" }));
              }}
              placeholder="Ej. Samsung"
              error={errors.marca}
              required
            />
            <InputField
              label="Modelo"
              id="edit-activo-modelo"
              name="modelo"
              value={modelo}
              onChange={(e) => {
                setModelo(e.target.value);
                setErrors((p) => ({ ...p, modelo: "" }));
              }}
              placeholder="Ej. Super Monitor 3000"
              error={errors.modelo}
              required
            />
            <div className="form-control w-full">
              <label className="label pb-1">
                <span
                  className="label-text text-sm font-medium"
                  style={{ color: "#1A2B5E" }}
                >
                  Condición <span className="text-error">*</span>
                </span>
              </label>
              <select
                className="select select-bordered w-full bg-[#EEEEEE] border-[#B0B0B0] text-[#1A2B5E] focus:border-[#09268E] focus:outline-none"
                value={estado}
                onChange={(e) => setEstado(parseInt(e.target.value, 10))}
              >
                <option value={ActivoEstado.Disponible}>Disponible</option>
                <option value={ActivoEstado.Mantenimiento}>
                  Mantenimiento
                </option>
                <option value={ActivoEstado.Retirado}>Retirado</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <SearchableSelect
              id="edit-activo-tipo"
              label="Tipo de activo"
              required
              options={filteredTipos}
              loading={tipoLoading}
              selectedId={tipoSelectedId}
              searchValue={tipoSearch}
              onSearchChange={(e) => {
                setTipoSearch(e.target.value);
                setErrors((p) => ({ ...p, tipo: "" }));
              }}
              onSelect={(opt) => {
                setTipoSelectedId(opt.id);
                setTipoSearch(opt.label);
                setTipoShowDropdown(false);
                setErrors((p) => ({ ...p, tipo: "" }));
              }}
              showDropdown={tipoShowDropdown}
              onFocus={() => setTipoShowDropdown(true)}
              onBlur={() => setTipoShowDropdown(false)}
              placeholder="Buscar tipo..."
              error={errors.tipo}
              onClear={() => {
                setTipoSelectedId(null);
                setTipoSearch("");
              }}
            />
            <SearchableSelect
              id="edit-activo-area"
              label="Área"
              required
              options={filteredAreas}
              loading={areaLoading}
              selectedId={areaSelectedId}
              searchValue={areaSearch}
              onSearchChange={(e) => {
                setAreaSearch(e.target.value);
                setErrors((p) => ({ ...p, area: "" }));
              }}
              onSelect={(opt) => {
                setAreaSelectedId(opt.id);
                setAreaSearch(opt.label);
                setAreaShowDropdown(false);
                setErrors((p) => ({ ...p, area: "" }));
              }}
              showDropdown={areaShowDropdown}
              onFocus={() => setAreaShowDropdown(true)}
              onBlur={() => setAreaShowDropdown(false)}
              placeholder="Buscar área..."
              error={errors.area}
              onClear={() => {
                setAreaSelectedId(null);
                setAreaSearch("");
              }}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <InputField
              label="Código RFID (opcional)"
              id="edit-activo-rfid"
              name="rfidCodigo"
              value={rfidCodigo}
              onChange={(e) => setRfidCodigo(e.target.value)}
              placeholder="Ej. RF-001"
            />
            <div className="form-control w-full">
              <label className="label pb-1">
                <span
                  className="label-text text-sm font-medium"
                  style={{ color: "#1A2B5E" }}
                >
                  ¿Es crítico?
                </span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer pt-2">
                <input
                  type="checkbox"
                  className="checkbox border-[#B0B0B0]"
                  checked={esCritico}
                  onChange={(e) => setEsCritico(e.target.checked)}
                  style={{ accentColor: "#09268E" }}
                />
                <span className="text-sm text-slate-600">
                  {esCritico ? "Sí, es un activo crítico" : "No es crítico"}
                </span>
              </label>
            </div>
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
