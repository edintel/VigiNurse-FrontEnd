"use client";
import React, { useEffect, useRef, useState } from "react";
import { toast } from "@/lib/toast";
import { createPlantilla, updatePlantilla } from "../../services/plantillasService";
import type { PlantillaTurno, CreatePlantillaDto, Area } from "../../types";
import { TipoTurno } from "../../types";

interface Props {
  open: boolean;
  plantilla: PlantillaTurno | null;
  areas: Area[];
  onClose: () => void;
  onSaved: (p: PlantillaTurno) => void;
}

const EMPTY: CreatePlantillaDto = {
  nombre: "",
  horaInicio: "07:00:00",
  horaFin: "15:00:00",
  cruzaMedianoche: false,
  areaId: 0,
  tipoTurno: TipoTurno.Regular,
};

function extractApiError(err: unknown, fallback: string): string {
  if (err && typeof err === "object" && "response" in err) {
    const r = (err as { response?: { data?: { mensaje?: string } } }).response;
    if (r?.data?.mensaje) return r.data.mensaje;
  }
  return fallback;
}

// Modal para crear o editar una plantilla de turno
export function PlantillaFormModal({ open, plantilla, areas, onClose, onSaved }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [form, setForm] = useState<CreatePlantillaDto>(EMPTY);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setForm(
        plantilla
          ? {
              nombre: plantilla.nombre,
              horaInicio: plantilla.horaInicio,
              horaFin: plantilla.horaFin,
              cruzaMedianoche: plantilla.cruzaMedianoche,
              areaId: plantilla.areaId,
              tipoTurno: plantilla.tipoTurno,
            }
          : EMPTY,
      );
      dialogRef.current?.showModal();
    } else {
      dialogRef.current?.close();
    }
  }, [open, plantilla]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.nombre.trim()) { toast.error("El nombre es requerido."); return; }
    if (!form.areaId) { toast.error("Selecciona un área."); return; }
    setSaving(true);
    try {
      let saved: PlantillaTurno;
      if (plantilla) {
        saved = await updatePlantilla(plantilla.id, form);
      } else {
        saved = await createPlantilla(form);
      }
      toast.success(plantilla ? "Plantilla actualizada." : "Plantilla creada.");
      onSaved(saved);
      onClose();
    } catch (err) {
      toast.error(extractApiError(err, "Error al guardar la plantilla."));
    } finally {
      setSaving(false);
    }
  }

  const labelCls = "block text-xs font-semibold text-slate-600 mb-1";
  const inputCls = "w-full rounded-lg border border-[#e2e8f0] bg-white px-3 py-2 text-sm text-[#0f172a] focus:outline-none focus:ring-2 focus:ring-[#09268E]/30 focus:border-[#09268E] transition";

  return (
    <dialog ref={dialogRef} className="modal" onClose={onClose}>
      <div className="modal-box max-w-lg p-0 rounded-xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-7 py-5 border-b border-[#f1f5f9] flex items-start justify-between">
          <div>
            <h3 className="text-base font-bold text-[#0f172a]">
              {plantilla ? "Editar plantilla" : "Nueva plantilla de turno"}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {plantilla ? "Modifica los datos de la plantilla." : "Define los datos del turno base."}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="btn btn-sm btn-ghost btn-circle text-slate-400 hover:text-slate-700"
          >✕</button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          <div className="px-7 py-5 flex-1 overflow-y-auto space-y-4">
            {/* Nombre */}
            <div>
              <label className={labelCls}>Nombre</label>
              <input
                className={inputCls}
                placeholder="Ej. Mañana UCI"
                value={form.nombre}
                onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))}
              />
            </div>

            {/* Área */}
            <div>
              <label className={labelCls}>Área</label>
              <select
                className={inputCls + " cursor-pointer"}
                value={form.areaId || ""}
                onChange={(e) => setForm((f) => ({ ...f, areaId: Number(e.target.value) }))}
              >
                <option value="">Seleccionar área...</option>
                {areas.map((a) => (
                  <option key={a.id} value={a.id}>{a.nombre}</option>
                ))}
              </select>
            </div>

            {/* Horario */}
            <div className="grid grid-cols-2 gap-3">
              <fieldset className="fieldset">
                <legend className="fieldset-legend text-xs font-semibold text-slate-600">Hora inicio</legend>
                <input
                  type="time"
                  className="input input-bordered w-full bg-white border-[#e2e8f0] text-[#0f172a] focus:border-[#09268E] focus:outline-none"
                  value={form.horaInicio.slice(0, 5)}
                  onChange={(e) => setForm((f) => ({ ...f, horaInicio: e.target.value + ":00" }))}
                />
              </fieldset>
              <fieldset className="fieldset">
                <legend className="fieldset-legend text-xs font-semibold text-slate-600">Hora fin</legend>
                <input
                  type="time"
                  className="input input-bordered w-full bg-white border-[#e2e8f0] text-[#0f172a] focus:border-[#09268E] focus:outline-none"
                  value={form.horaFin.slice(0, 5)}
                  onChange={(e) => setForm((f) => ({ ...f, horaFin: e.target.value + ":00" }))}
                />
              </fieldset>
            </div>

            {/* Cruza medianoche */}
            <div className="flex items-center justify-between rounded-lg bg-[#f8fafc] border border-[#e2e8f0] px-4 py-3">
              <div>
                <p className="text-sm font-medium text-[#0f172a]">Cruza medianoche</p>
                <p className="text-xs text-slate-500">El turno termina al día siguiente.</p>
              </div>
              <input
                type="checkbox"
                className="toggle toggle-sm"
                style={{ accentColor: "#09268E" }}
                checked={form.cruzaMedianoche}
                onChange={(e) => setForm((f) => ({ ...f, cruzaMedianoche: e.target.checked }))}
              />
            </div>

            {form.cruzaMedianoche && (
              <div className="flex items-center gap-2 rounded-lg bg-amber-50 border border-amber-200 px-3 py-2 text-xs text-amber-700">
                <svg xmlns="http://www.w3.org/2000/svg" className="size-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126Z" />
                </svg>
                Este turno termina al día siguiente.
              </div>
            )}

            {/* Tipo de turno */}
            <div>
              <label className={labelCls}>Tipo de turno</label>
              <div className="flex gap-3">
                {[
                  { value: TipoTurno.Regular, label: "Regular" },
                  { value: TipoTurno.Guardia, label: "Guardia" },
                ].map(({ value, label }) => (
                  <label
                    key={value}
                    className={`flex items-center gap-2 flex-1 rounded-lg border px-4 py-3 cursor-pointer transition ${
                      form.tipoTurno === value
                        ? "border-[#09268E] bg-[#09268E]/5 text-[#09268E]"
                        : "border-[#e2e8f0] text-slate-600 hover:border-slate-300"
                    }`}
                  >
                    <input
                      type="radio"
                      name="tipoTurno"
                      className="radio radio-xs"
                      style={{ accentColor: "#09268E" }}
                      checked={form.tipoTurno === value}
                      onChange={() => setForm((f) => ({ ...f, tipoTurno: value }))}
                    />
                    <span className="text-sm font-medium">{label}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="px-7 py-4 border-t border-[#f1f5f9] bg-[#f8fafc] flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="btn btn-sm btn-ghost text-slate-600"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="btn btn-sm text-white border-none"
              style={{ background: "#09268E" }}
            >
              {saving && <span className="loading loading-spinner loading-xs" />}
              {plantilla ? "Guardar cambios" : "Crear plantilla"}
            </button>
          </div>
        </form>
      </div>
      <form method="dialog" className="modal-backdrop"><button>close</button></form>
    </dialog>
  );
}
