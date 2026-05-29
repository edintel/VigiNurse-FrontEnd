"use client";
import { useEffect, useRef, useState } from "react";
import { createHospitalFloorPlan } from "@/features/administration/hospitalFloorPlans/services/hospitalFloorPlanService";
import type { PlanoHospital } from "@/features/administration/hospitalFloorPlans/types";
import { toast } from "@/lib/toast";

const ACCEPTED = ".jpg,.jpeg,.png,.svg,.webp";

interface Props {
  open: boolean;
  onClose: () => void;
  onCreated: (plano: PlanoHospital) => void;
  hospitalId?: number;
  isSuperAdmin?: boolean;
}

// Componente para subir un nuevo plano del hospital
export function UploadFloorPlanModal({ open, onClose, onCreated, hospitalId, isSuperAdmin }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const [nombre, setNombre] = useState("");
  const [orden, setOrden] = useState("0");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [hosId, setHosId] = useState(hospitalId ? String(hospitalId) : "");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [apiError, setApiError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      dialogRef.current?.showModal();
    } else {
      dialogRef.current?.close();
      resetForm();
    }
  }, [open]);

  function resetForm() {
    setNombre("");
    setOrden("0");
    setFile(null);
    setPreview(null);
    setHosId(hospitalId ? String(hospitalId) : "");
    setErrors({});
    setApiError(null);
    if (fileRef.current) fileRef.current.value = "";
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] ?? null;
    setFile(f);
    if (f) {
      const url = URL.createObjectURL(f);
      setPreview(url);
    } else {
      setPreview(null);
    }
  }

  function validate() {
    const errs: Record<string, string> = {};
    if (!nombre.trim()) errs.nombre = "El nombre es obligatorio.";
    if (!file) errs.imagen = "Debes seleccionar una imagen.";
    const o = parseInt(orden, 10);
    if (isNaN(o) || o < 0) errs.orden = "El orden debe ser un número >= 0.";
    if (isSuperAdmin && !hosId.trim()) errs.hospitalId = "El ID del hospital es obligatorio.";
    return errs;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    setLoading(true);
    setApiError(null);
    try {
      const fd = new FormData();
      fd.append("Nombre", nombre.trim());
      fd.append("Orden", String(parseInt(orden, 10)));
      fd.append("imagen", file!);
      if (isSuperAdmin && hosId.trim()) {
        fd.append("HospitalId", hosId.trim());
      }
      const plano = await createHospitalFloorPlan(fd);
      toast.success(`Plano "${plano.nombre}" creado exitosamente.`);
      onCreated(plano);
      onClose();
    } catch (err: unknown) {
      const data = (err as { response?: { data?: { mensaje?: string } } })?.response?.data;
      setApiError(data?.mensaje ?? "Error al crear el plano.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <dialog
      ref={dialogRef}
      className="modal"
      onCancel={(e) => { e.preventDefault(); if (!loading) onClose(); }}
    >
      <div className="modal-box max-w-lg p-0 overflow-hidden rounded-xl">
        <div className="px-6 py-4 border-b border-[#E2E8F0] flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#EBF0FF] flex items-center justify-center flex-shrink-0">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#09268E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <path d="M3 9h18M9 21V9" />
            </svg>
          </div>
          <h3 className="text-base font-bold text-[#0f172a]">Subir nuevo plano</h3>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Nombre del plano <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={nombre}
              onChange={(e) => { setNombre(e.target.value); setErrors(p => ({ ...p, nombre: "" })); }}
              placeholder="Ej: Planta Baja, Piso 1..."
              disabled={loading}
              className="input input-bordered input-sm w-full text-sm"
            />
            {errors.nombre && <p className="text-xs text-red-500 mt-1">{errors.nombre}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Orden de visualización <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              min={0}
              value={orden}
              onChange={(e) => { setOrden(e.target.value); setErrors(p => ({ ...p, orden: "" })); }}
              disabled={loading}
              className="input input-bordered input-sm w-full text-sm"
            />
            {errors.orden && <p className="text-xs text-red-500 mt-1">{errors.orden}</p>}
          </div>

          {isSuperAdmin && (
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                ID del Hospital <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min={1}
                value={hosId}
                onChange={(e) => { setHosId(e.target.value); setErrors(p => ({ ...p, hospitalId: "" })); }}
                disabled={loading}
                className="input input-bordered input-sm w-full text-sm"
              />
              {errors.hospitalId && <p className="text-xs text-red-500 mt-1">{errors.hospitalId}</p>}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Imagen del plano <span className="text-red-500">*</span>
              <span className="ml-1 font-normal text-slate-400">(jpg, png, svg, webp)</span>
            </label>
            <input
              ref={fileRef}
              type="file"
              accept={ACCEPTED}
              onChange={handleFileChange}
              disabled={loading}
              className="file-input file-input-bordered file-input-sm w-full text-sm"
            />
            {errors.imagen && <p className="text-xs text-red-500 mt-1">{errors.imagen}</p>}
            {preview && (
              <div className="mt-2 rounded-lg overflow-hidden border border-[#E2E8F0] bg-slate-50 max-h-40 flex items-center justify-center">
                <img src={preview} alt="Vista previa" className="max-h-40 object-contain" />
              </div>
            )}
          </div>

          {apiError && (
            <div className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2 border border-red-200">
              {apiError}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              className="btn btn-sm btn-ghost"
              onClick={onClose}
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="btn btn-sm text-white"
              style={{ backgroundColor: "#09268E" }}
              disabled={loading}
            >
              {loading && <span className="loading loading-spinner loading-xs" />}
              Subir plano
            </button>
          </div>
        </form>
      </div>
      <form method="dialog" className="modal-backdrop">
        <button type="button" onClick={() => { if (!loading) onClose(); }}>close</button>
      </form>
    </dialog>
  );
}
