"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "@/lib/toast";
import {
  getAllowedZonesByEpisode,
  createAllowedZoneForBaby,
  revokeAllowedZone,
  getZones,
} from "@/features/baby-monitoring/services/zoneService";
import {
  TipoZona,
  TIPO_ZONA_LABELS,
  EstadoZona,
} from "@/features/baby-monitoring/types/zones";
import type {
  Zona,
  ZonaPermitidaBebe,
  CrearZonaPermitidaBebeDTO,
} from "@/features/baby-monitoring/types/zones";
import type { Bebe } from "@/features/baby-monitoring/types";
import { CallyDatePicker } from "@/shared/ui/CallyDatePicker";

interface BabyAllowedZonesSectionProps {
  bebe: Bebe;
  readOnly: boolean;
  onRefreshLocation: () => void;
}

function formatDate(dateStr: string | null) {
  if (!dateStr) return "—";
  try {
    return new Date(dateStr).toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

// ─── Modal: Asignar zona permitida ────────────────────────────────────────────

interface AssignAllowedZoneModalProps {
  open: boolean;
  bebe: Bebe;
  activeZonaIds: number[];
  onClose: () => void;
  onCreated: () => void;
}

function AssignAllowedZoneModal({
  open,
  bebe,
  activeZonaIds,
  onClose,
  onCreated,
}: AssignAllowedZoneModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [zones, setZones] = useState<Zona[]>([]);
  const [loadingZones, setLoadingZones] = useState(false);
  const [selectedZonaId, setSelectedZonaId] = useState<number | "">("");
  const [fechaFin, setFechaFin] = useState("");
  const [horaFin, setHoraFin] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      dialogRef.current?.showModal();
      setSelectedZonaId("");
      setFechaFin("");
      setHoraFin("");
      setLoadingZones(true);
      getZones({ pagina: 1, tamanio: 100, estado: EstadoZona.Activa, includeSensores: true })
        .then((res) => setZones(res.datos))
        .catch(() => toast.error("No se pudieron cargar las zonas."))
        .finally(() => setLoadingZones(false));
    } else {
      dialogRef.current?.close();
    }
  }, [open]);

  const selectedZone = zones.find((z) => z.id === Number(selectedZonaId)) ?? null;
  const isSalida = selectedZone?.tipo === TipoZona.Salida;
  const isAlreadyActive = selectedZonaId !== "" && activeZonaIds.includes(Number(selectedZonaId));
  const isValid = selectedZonaId !== "" && !isAlreadyActive;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isValid) return;
    setSubmitting(true);
    try {
      const dto: CrearZonaPermitidaBebeDTO = {
        pacienteId: bebe.pacienteId,
        episodioId: bebe.episodioId,
        zonaId: Number(selectedZonaId),
        fechaFin: fechaFin
          ? new Date(`${fechaFin}T${horaFin || "00:00"}`).toISOString()
          : null,
      };
      const saved = await createAllowedZoneForBaby(dto);
      toast.success(`Zona "${saved.zonaNombre}" añadida como permitida.`);
      onCreated();
      onClose();
    } catch (err: unknown) {
      const data = (err as { response?: { data?: { mensaje?: string; message?: string } } })?.response?.data;
      toast.error(data?.mensaje ?? data?.message ?? "No se pudo agregar la zona permitida.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <dialog
      ref={dialogRef}
      className="modal"
      onCancel={(e) => { e.preventDefault(); if (!submitting) onClose(); }}
    >
      <div className="modal-box max-w-md p-0 overflow-hidden rounded-xl">
        <div className="px-6 py-4 border-b border-[#E2E8F0]">
          <h3 className="text-base font-bold text-[#0f172a]">Agregar zona permitida</h3>
        </div>
        <form onSubmit={(e) => void handleSubmit(e)} className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-sm font-semibold text-[#334155] mb-1.5">
              Zona <span className="text-red-500">*</span>
            </label>
            {loadingZones ? (
              <div className="flex items-center gap-2 py-2">
                <span className="loading loading-spinner loading-xs text-[#09268E]" />
                <span className="text-sm text-slate-500">Cargando zonas...</span>
              </div>
            ) : (
              <select
                className="select select-bordered w-full text-sm"
                value={selectedZonaId}
                onChange={(e) => setSelectedZonaId(e.target.value === "" ? "" : Number(e.target.value))}
                disabled={submitting}
              >
                <option value="">Seleccionar zona...</option>
                {zones.map((z) => (
                  <option key={z.id} value={z.id} disabled={activeZonaIds.includes(z.id)}>
                    {z.nombre} — {TIPO_ZONA_LABELS[z.tipo]}
                    {z.sensores?.length ? ` (${z.sensores.length} sensores)` : ""}
                    {activeZonaIds.includes(z.id) ? " [ya activa]" : ""}
                  </option>
                ))}
              </select>
            )}
            {isAlreadyActive && (
              <p className="text-xs text-amber-600 mt-1 font-medium">
                Esta zona ya está activa para este bebé.
              </p>
            )}
          </div>

          {isSalida && (
            <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3">
              <p className="text-sm font-semibold text-red-800">Advertencia: zona de Salida</p>
              <p className="text-xs text-red-700 mt-0.5">
                Las zonas de tipo Salida representan riesgo crítico. Confirme que este permiso es intencional.
              </p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3 items-end">
            <CallyDatePicker
              id="zona-permitida-fecha-fin"
              label="Fecha fin (opcional)"
              value={fechaFin}
              onChange={setFechaFin}
              min={new Date().toISOString().slice(0, 10)}
            />
            <div>
              <label className="block text-sm font-semibold text-[#334155] mb-1.5">
                Hora fin{" "}
                <span className="text-xs font-normal text-slate-400">(opcional)</span>
              </label>
              <input
                type="time"
                className="input input-bordered h-12 w-full border-[#B0B0B0] text-[#1A2B5E] text-sm focus:border-[#09268E] focus:outline-none"
                value={horaFin}
                onChange={(e) => setHoraFin(e.target.value)}
                disabled={submitting || !fechaFin}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" className="btn btn-sm btn-ghost" onClick={onClose} disabled={submitting}>
              Cancelar
            </button>
            <button
              type="submit"
              className="btn btn-sm text-white"
              style={!isValid || submitting
                ? { backgroundColor: "#cbd5e1", borderColor: "#cbd5e1", color: "#94a3b8", cursor: "not-allowed" }
                : { backgroundColor: "#09268E", borderColor: "#09268E" }}
              disabled={!isValid || submitting}
            >
              {submitting && <span className="loading loading-spinner loading-xs" />}
              Agregar
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

// ─── Sección principal ────────────────────────────────────────────────────────

export function BabyAllowedZonesSection({
  bebe,
  readOnly,
  onRefreshLocation,
}: BabyAllowedZonesSectionProps) {
  const [allowedZones, setAllowedZones] = useState<ZonaPermitidaBebe[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [revoking, setRevoking] = useState<number | null>(null);

  const activeZonaIds = allowedZones.filter((z) => z.activa).map((z) => z.zonaId);

  const loadAllowedZones = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getAllowedZonesByEpisode(bebe.episodioId, false);
      setAllowedZones(
        [...data].sort(
          (a, b) => new Date(b.fechaInicio).getTime() - new Date(a.fechaInicio).getTime()
        )
      );
    } catch {
      // fail silently — not critical
    } finally {
      setLoading(false);
    }
  }, [bebe.episodioId]);

  useEffect(() => { void loadAllowedZones(); }, [loadAllowedZones]);

  async function handleRevoke(id: number) {
    setRevoking(id);
    try {
      await revokeAllowedZone(id);
      toast.success("Zona revocada correctamente.");
      void loadAllowedZones();
      onRefreshLocation();
    } catch (err: unknown) {
      const data = (err as { response?: { data?: { mensaje?: string; message?: string } } })?.response?.data;
      toast.error(data?.mensaje ?? data?.message ?? "No se pudo revocar la zona.");
    } finally {
      setRevoking(null);
    }
  }

  function handleZoneCreated() {
    void loadAllowedZones();
    onRefreshLocation();
  }

  const colSpan = readOnly ? 5 : 6;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-[#E2E8F0] overflow-hidden">
      <div className="px-5 py-3.5 border-b border-[#f1f5f9] bg-[#F8FAFC] flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-[0.5px] text-[#64748b]">
          Zonas permitidas
        </span>
        <div className="flex items-center gap-2">
          {!loading && allowedZones.length > 0 && (
            <span className="text-xs font-bold bg-[#f1f5f9] text-[#64748b] rounded-full px-2 py-0.5">
              {allowedZones.length}
            </span>
          )}
          {!readOnly && (
            <button
              type="button"
              className="btn btn-xs text-white"
              style={{ backgroundColor: "#09268E", borderColor: "#09268E" }}
              onClick={() => setShowAssignModal(true)}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="2.5"
                stroke="currentColor"
                className="size-3"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              Agregar zona
            </button>
          )}
        </div>
      </div>

      {readOnly && (
        <div className="px-5 py-2.5 border-b border-[#f1f5f9] bg-slate-50">
          <p className="text-xs text-slate-500">
            Bebé dado de alta. Las zonas permitidas se muestran en modo historial.
          </p>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="table table-zebra w-full table-fixed [&_td]:py-2.5 [&_th]:py-2.5">
          <colgroup>
            <col className="w-[22%]" />
            <col className="w-[18%]" />
            <col className="w-[18%]" />
            <col className="w-[24%]" />
            <col className="w-[10%]" />
            {!readOnly && <col className="w-[8%]" />}
          </colgroup>
          <thead>
            <tr className="bg-[#F8FAFC] text-[#1A2B5E]">
              <th className="text-xs font-semibold uppercase tracking-wide">Zona</th>
              <th className="text-xs font-semibold uppercase tracking-wide whitespace-nowrap">Inicio</th>
              <th className="text-xs font-semibold uppercase tracking-wide whitespace-nowrap">Fin</th>
              <th className="text-xs font-semibold uppercase tracking-wide whitespace-nowrap">Autorizado por</th>
              <th className="text-xs font-semibold uppercase tracking-wide">Estado</th>
              {!readOnly && <th />}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={colSpan} className="text-center py-8">
                  <span className="loading loading-spinner loading-md text-[#09268E]" />
                </td>
              </tr>
            ) : allowedZones.length === 0 ? (
              <tr>
                <td colSpan={colSpan} className="text-center py-8 text-base-content/40 text-sm">
                  No hay zonas permitidas registradas para este episodio.
                </td>
              </tr>
            ) : (
              allowedZones.map((zp) => (
                <tr key={zp.id} className="hover:bg-base-200">
                  <td className="text-sm font-semibold text-[#1A2B5E] truncate">{zp.zonaNombre}</td>
                  <td className="text-sm text-[#475569] whitespace-nowrap">{formatDate(zp.fechaInicio)}</td>
                  <td className="text-sm text-[#475569] whitespace-nowrap">{formatDate(zp.fechaFin)}</td>
                  <td className="text-sm text-[#475569] truncate">{zp.autorizadoPorNombre}</td>
                  <td>
                    {zp.activa ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 whitespace-nowrap">
                        <span className="size-1.5 rounded-full bg-emerald-500 inline-block" />
                        Activa
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-500 border border-slate-200 whitespace-nowrap">
                        Revocada
                      </span>
                    )}
                  </td>
                  {!readOnly && (
                    <td>
                      {zp.activa && (
                        <button
                          type="button"
                          className="btn btn-xs btn-ghost text-red-400 hover:text-red-600"
                          title="Revocar zona"
                          disabled={revoking === zp.id}
                          onClick={() => void handleRevoke(zp.id)}
                        >
                          {revoking === zp.id ? (
                            <span className="loading loading-spinner loading-xs" />
                          ) : (
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              fill="none"
                              viewBox="0 0 24 24"
                              strokeWidth="2"
                              stroke="currentColor"
                              className="size-4"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                            </svg>
                          )}
                        </button>
                      )}
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <AssignAllowedZoneModal
        open={showAssignModal}
        bebe={bebe}
        activeZonaIds={activeZonaIds}
        onClose={() => setShowAssignModal(false)}
        onCreated={handleZoneCreated}
      />
    </div>
  );
}
