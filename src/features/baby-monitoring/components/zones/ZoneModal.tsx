"use client";
import { useEffect, useRef, useState } from "react";
import { toast } from "@/lib/toast";
import { createZone, updateZone } from "@/features/baby-monitoring/services/zoneService";
import {
  TipoZona,
  EstadoZona,
  TIPO_ZONA_LABELS,
  ESTADO_ZONA_LABELS,
} from "@/features/baby-monitoring/types/zones";
import type { Zona, CrearZonaDTO, ActualizarZonaDTO } from "@/features/baby-monitoring/types/zones";

interface ZoneModalProps {
  open: boolean;
  zona?: Zona | null;
  onClose: () => void;
  onSaved: (zona: Zona) => void;
}

export function ZoneModal({ open, zona, onClose, onSaved }: ZoneModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const isEditing = zona != null;

  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [tipo, setTipo] = useState<TipoZona>(TipoZona.Segura);
  const [estado, setEstado] = useState<EstadoZona>(EstadoZona.Activa);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      dialogRef.current?.showModal();
      if (zona) {
        setNombre(zona.nombre);
        setDescripcion(zona.descripcion ?? "");
        setTipo(zona.tipo);
        setEstado(zona.estado);
      } else {
        setNombre("");
        setDescripcion("");
        setTipo(TipoZona.Segura);
        setEstado(EstadoZona.Activa);
      }
    } else {
      dialogRef.current?.close();
    }
  }, [open, zona]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!nombre.trim()) return;
    setSubmitting(true);
    try {
      let saved: Zona;
      if (isEditing) {
        const dto: ActualizarZonaDTO = {
          nombre: nombre.trim(),
          descripcion: descripcion.trim() || null,
          tipo,
          estado,
          esSegura: zona.esSegura,
        };
        saved = await updateZone(zona.id, dto);
        toast.success(`Zona "${saved.nombre}" actualizada.`);
      } else {
        const dto: CrearZonaDTO = {
          nombre: nombre.trim(),
          descripcion: descripcion.trim() || null,
          tipo,
          estado,
          esSegura: false,
        };
        saved = await createZone(dto);
        toast.success(`Zona "${saved.nombre}" creada.`);
      }
      onSaved(saved);
      onClose();
    } catch (err: unknown) {
      const data = (err as { response?: { data?: { mensaje?: string; message?: string } } })?.response?.data;
      toast.error(data?.mensaje ?? data?.message ?? "No se pudo guardar la zona.");
    } finally {
      setSubmitting(false);
    }
  }

  const tipoValues = (Object.values(TipoZona).filter((v) => typeof v === "number") as TipoZona[]);
  const estadoValues = (Object.values(EstadoZona).filter((v) => typeof v === "number") as EstadoZona[]);

  return (
    <dialog
      ref={dialogRef}
      className="modal"
      onCancel={(e) => { e.preventDefault(); if (!submitting) onClose(); }}
    >
      <div className="modal-box max-w-md p-0 overflow-hidden rounded-xl">
        <div className="px-6 py-4 border-b border-[#E2E8F0]">
          <h3 className="text-base font-bold text-[#0f172a]">
            {isEditing ? "Editar zona" : "Nueva zona"}
          </h3>
        </div>
        <form onSubmit={(e) => void handleSubmit(e)} className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-sm font-semibold text-[#334155] mb-1.5">
              Nombre <span className="text-red-500">*</span>
            </label>
            <input
              className="input input-bordered w-full text-sm"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ej. Neonatología Sur"
              disabled={submitting}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-semibold text-[#334155] mb-1.5">
                Tipo <span className="text-red-500">*</span>
              </label>
              <select
                className="select select-bordered w-full text-sm"
                value={tipo}
                onChange={(e) => setTipo(Number(e.target.value) as TipoZona)}
                disabled={submitting}
              >
                {tipoValues.map((t) => (
                  <option key={t} value={t}>{TIPO_ZONA_LABELS[t]}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-[#334155] mb-1.5">
                Estado <span className="text-red-500">*</span>
              </label>
              <select
                className="select select-bordered w-full text-sm"
                value={estado}
                onChange={(e) => setEstado(Number(e.target.value) as EstadoZona)}
                disabled={submitting}
              >
                {estadoValues.map((s) => (
                  <option key={s} value={s}>{ESTADO_ZONA_LABELS[s]}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-[#334155] mb-1.5">Descripción</label>
            <textarea
              className="textarea textarea-bordered w-full text-sm rounded-lg resize-none"
              rows={2}
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              placeholder="Descripción opcional..."
              disabled={submitting}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" className="btn btn-sm btn-ghost" onClick={onClose} disabled={submitting}>
              Cancelar
            </button>
            <button
              type="submit"
              className="btn btn-sm text-white"
              style={!nombre.trim() || submitting
                ? { backgroundColor: "#cbd5e1", borderColor: "#cbd5e1", color: "#94a3b8", cursor: "not-allowed" }
                : { backgroundColor: "#09268E", borderColor: "#09268E" }}
              disabled={!nombre.trim() || submitting}
            >
              {submitting && <span className="loading loading-spinner loading-xs" />}
              {isEditing ? "Guardar cambios" : "Crear zona"}
            </button>
          </div>
        </form>
      </div>
      <form method="dialog" className="modal-backdrop">
        <button type="button" onClick={() => { if (!submitting) onClose(); }}>close</button>
      </form>
    </dialog>
  );
}
