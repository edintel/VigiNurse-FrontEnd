"use client";
import { useEffect, useRef, useState } from "react";
import { toast } from "@/lib/toast";
import { createMovementAuthorization } from "@/features/baby-monitoring/services/babyService";
import { getZones } from "@/features/baby-monitoring/services/zoneService";
import { EstadoZona, TipoZona, TIPO_ZONA_LABELS } from "@/features/baby-monitoring/types/zones";
import type { Zona } from "@/features/baby-monitoring/types/zones";
import type { Bebe, AutorizacionMovimiento, CrearAutorizacionMovimientoDTO } from "@/features/baby-monitoring/types";
import { CallyDatePicker } from "@/shared/ui/CallyDatePicker";

interface CreateMovementAuthorizationModalProps {
  open: boolean;
  bebe: Bebe;
  currentZonaId?: number | null;
  currentZonaNombre?: string | null;
  onClose: () => void;
  onCreated: (auth: AutorizacionMovimiento) => void;
}

export function CreateMovementAuthorizationModal({
  open, bebe, currentZonaId, currentZonaNombre, onClose, onCreated,
}: CreateMovementAuthorizationModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [zones, setZones] = useState<Zona[]>([]);
  const [loadingZones, setLoadingZones] = useState(false);
  const [zonaDestinoId, setZonaDestinoId] = useState<number | "">("");
  const [motivo, setMotivo] = useState("");
  const [fechaExp, setFechaExp] = useState("");
  const [horaExp, setHoraExp] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      dialogRef.current?.showModal();
      setZonaDestinoId(""); setMotivo(""); setFechaExp(""); setHoraExp("");
      setLoadingZones(true);
      getZones({ pagina: 1, tamanio: 100, estado: EstadoZona.Activa, includeSensores: false })
        .then((res) => setZones(res.datos))
        .catch(() => toast.error("No se pudieron cargar las zonas."))
        .finally(() => setLoadingZones(false));
    } else {
      dialogRef.current?.close();
    }
  }, [open]);

  const selectedZone = zones.find((z) => z.id === Number(zonaDestinoId)) ?? null;
  const isSalida = selectedZone?.tipo === TipoZona.Salida;
  const isValid = zonaDestinoId !== "" && motivo.trim() !== "";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isValid) return;
    setSubmitting(true);
    try {
      const dto: CrearAutorizacionMovimientoDTO = {
        pacienteId: bebe.pacienteId,
        episodioId: bebe.episodioId,
        zonaOrigenId: currentZonaId ?? null,
        zonaDestinoId: Number(zonaDestinoId),
        motivo: motivo.trim(),
        fechaExpiracion: fechaExp
          ? new Date(`${fechaExp}T${horaExp || "23:59"}`).toISOString()
          : null,
      };
      const saved = await createMovementAuthorization(dto);
      toast.success("Autorización de movimiento creada.");
      onCreated(saved);
      onClose();
    } catch (err: unknown) {
      const data = (err as { response?: { data?: { mensaje?: string; message?: string } } })?.response?.data;
      toast.error(data?.mensaje ?? data?.message ?? "No se pudo crear la autorización.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <dialog ref={dialogRef} className="modal" onCancel={(e) => { e.preventDefault(); if (!submitting) onClose(); }}>
      <div className="modal-box max-w-lg p-0 overflow-hidden rounded-xl">
        <div className="px-6 py-4 border-b border-[#E2E8F0]">
          <h3 className="text-base font-bold text-[#0f172a]">Nueva autorización de movimiento</h3>
        </div>
        <form onSubmit={(e) => void handleSubmit(e)} className="px-6 py-5 space-y-4">
          {currentZonaId && (
            <div>
              <label className="block text-sm font-semibold text-[#334155] mb-1.5">Zona de origen</label>
              <div className="input input-bordered w-full text-sm flex items-center bg-slate-50 text-slate-500 cursor-not-allowed">
                {currentZonaNombre ?? "Zona actual"}
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold text-[#334155] mb-1.5">
              Zona de destino <span className="text-red-500">*</span>
            </label>
            {loadingZones ? (
              <div className="flex items-center gap-2 py-2">
                <span className="loading loading-spinner loading-xs text-[#09268E]" />
                <span className="text-sm text-slate-500">Cargando zonas...</span>
              </div>
            ) : (
              <select
                className="select select-bordered w-full text-sm"
                value={zonaDestinoId}
                onChange={(e) => setZonaDestinoId(e.target.value === "" ? "" : Number(e.target.value))}
                disabled={submitting}
              >
                <option value="">Seleccionar zona...</option>
                {zones.map((z) => (
                  <option key={z.id} value={z.id}>
                    {z.nombre} — {TIPO_ZONA_LABELS[z.tipo]}
                  </option>
                ))}
              </select>
            )}
          </div>

          {isSalida && (
            <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3">
              <p className="text-sm font-semibold text-red-800">Advertencia: zona de Salida</p>
              <p className="text-xs text-red-700 mt-0.5">La zona destino es de tipo Salida. Confirme que este movimiento es intencional.</p>
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold text-[#334155] mb-1.5">
              Motivo <span className="text-red-500">*</span>
            </label>
            <textarea
              className="textarea textarea-bordered w-full text-sm rounded-lg resize-none"
              rows={2}
              placeholder="Describe el motivo del movimiento..."
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              disabled={submitting}
            />
          </div>

          <div className="grid grid-cols-2 gap-3 items-end">
            <CallyDatePicker
              id="autorizacion-fecha-exp"
              label="Fecha expiración (opcional)"
              value={fechaExp}
              onChange={setFechaExp}
              min={new Date().toISOString().slice(0, 10)}
            />
            <div>
              <label className="block text-sm font-semibold text-[#334155] mb-1.5">
                Hora <span className="text-xs font-normal text-slate-400">(opcional)</span>
              </label>
              <input
                type="time"
                className="input input-bordered w-full text-sm"
                value={horaExp}
                onChange={(e) => setHoraExp(e.target.value)}
                disabled={submitting || !fechaExp}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" className="btn btn-sm btn-ghost" onClick={onClose} disabled={submitting}>Cancelar</button>
            <button
              type="submit"
              className="btn btn-sm text-white"
              style={!isValid || submitting
                ? { backgroundColor: "#cbd5e1", borderColor: "#cbd5e1", color: "#94a3b8", cursor: "not-allowed" }
                : { backgroundColor: "#09268E", borderColor: "#09268E" }}
              disabled={!isValid || submitting}
            >
              {submitting && <span className="loading loading-spinner loading-xs" />}
              Crear autorización
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
