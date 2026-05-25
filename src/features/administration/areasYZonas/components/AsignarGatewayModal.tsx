"use client";
import { useEffect, useRef, useState } from "react";
import { toast } from "@/lib/toast";
import {
  getGatewaysBle,
} from "@/features/administration/areasYZonas/services/gatewayBleService";
import {
  asignarGatewayArea,
  asignarGatewayZona,
} from "@/features/administration/areasYZonas/services/asignacionService";
import {
  EstadoGatewayBle,
  ESTADO_GATEWAY_LABELS,
  type GatewayBle,
} from "@/features/administration/areasYZonas/types";

interface AsignarGatewayModalProps {
  open: boolean;
  targetId: number;
  targetNombre: string;
  targetTipo: "area" | "zona";
  onClose: () => void;
  onAsignado: () => void;
}

const ESTADO_DOT: Record<EstadoGatewayBle, string> = {
  [EstadoGatewayBle.Activo]: "bg-emerald-400 animate-pulse",
  [EstadoGatewayBle.Inactivo]: "bg-amber-400",
  [EstadoGatewayBle.Offline]: "bg-slate-400",
};

export function AsignarGatewayModal({
  open,
  targetId,
  targetNombre,
  targetTipo,
  onClose,
  onAsignado,
}: AsignarGatewayModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [gateways, setGateways] = useState<GatewayBle[]>([]);
  const [selected, setSelected] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setSelected(null);
      setSearch("");
      dialogRef.current?.showModal();
      setLoading(true);
      getGatewaysBle(1, 100)
        .then((r) => setGateways(r.datos))
        .catch(() => setGateways([]))
        .finally(() => setLoading(false));
    } else {
      dialogRef.current?.close();
    }
  }, [open]);

  async function handleAsignar() {
    if (!selected) return;
    setSaving(true);
    try {
      if (targetTipo === "area") {
        await asignarGatewayArea({ gatewayBleId: selected, areaId: targetId });
        toast.success("Gateway asignado al área.");
      } else {
        await asignarGatewayZona({ gatewayBleId: selected, zonaId: targetId });
        toast.success("Gateway asignado a la zona.");
      }
      onAsignado();
      onClose();
    } catch (err: unknown) {
      const data = (err as { response?: { data?: { mensaje?: string } } })?.response?.data;
      toast.error(data?.mensaje ?? "No se pudo asignar el gateway.");
    } finally {
      setSaving(false);
    }
  }

  const titulo = `Asignar gateway — ${targetNombre}`;

  const filteredGateways = search.trim()
    ? gateways.filter(
        (gw) =>
          gw.direccionMac.toLowerCase().includes(search.trim().toLowerCase()) ||
          gw.nombre.toLowerCase().includes(search.trim().toLowerCase())
      )
    : gateways;

  return (
    <dialog ref={dialogRef} className="modal" onClose={onClose}>
      <div className="modal-box bg-white w-full max-w-lg overflow-hidden p-0">
        <div
          className="px-6 pt-5 pb-4 flex items-center gap-3"
          style={{ background: "linear-gradient(135deg, #1A2B5E 0%, #09268E 100%)" }}
        >
          <div className="w-9 h-9 rounded-lg bg-white/15 flex items-center justify-center flex-shrink-0">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="3" width="20" height="14" rx="2" />
              <path d="M8 21h8M12 17v4M7 8h.01M11 8h.01M15 8h.01M7 12h10" />
            </svg>
          </div>
          <div>
            <h3 className="text-base font-bold text-white leading-tight">{titulo}</h3>
            <p className="text-xs text-blue-200 mt-0.5">
              Selecciona el gateway que se vinculará a esta {targetTipo === "area" ? "área" : "zona"}.
            </p>
          </div>
        </div>

        <div className="px-5 pt-4 pb-2">
          <div className="relative">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
              <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
            </svg>
            <input
              type="text"
              placeholder="Buscar por nombre o dirección MAC..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input input-sm w-full pl-9 bg-white border-slate-200 focus:border-[#09268E] focus:outline-none text-sm"
            />
            {search && (
              <button
                type="button"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                onClick={() => setSearch("")}
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" className="size-3.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>

        <div className="px-5 pb-4">
          {loading ? (
            <div className="flex justify-center py-8">
              <span className="loading loading-spinner loading-md text-[#09268E]" />
            </div>
          ) : gateways.length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-8">No hay gateways disponibles.</p>
          ) : filteredGateways.length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-8">No se encontraron gateways con ese criterio.</p>
          ) : (
            <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
              {filteredGateways.map((gw) => {
                const isSelected = selected === gw.id;
                const hasArea = !!gw.areaNombre;
                const hasZona = !!gw.zonaNombre;
                return (
                  <button
                    key={gw.id}
                    type="button"
                    onClick={() => setSelected(gw.id)}
                    className={[
                      "w-full text-left rounded-lg border px-3.5 py-3 transition-colors",
                      isSelected
                        ? "border-[#09268E] bg-[#eff6ff]"
                        : "border-[#e2e8f0] bg-white hover:border-[#93c5fd] hover:bg-[#f8faff]",
                    ].join(" ")}
                  >
                    <div className="flex items-center gap-2.5">
                      <span
                        className={`w-2 h-2 rounded-full flex-shrink-0 ${ESTADO_DOT[gw.estado] ?? "bg-slate-400"}`}
                      />
                      <span className="font-semibold text-sm text-[#0f172a] flex-1">{gw.nombre}</span>
                      <span className="font-mono text-[10px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                        {gw.direccionMac}
                      </span>
                    </div>
                    <div className="mt-1.5 flex gap-3 flex-wrap pl-4">
                      <span className="text-[11px] text-slate-500">
                        Estado: <span className="font-medium">{ESTADO_GATEWAY_LABELS[gw.estado]}</span>
                      </span>
                      {hasArea && (
                        <span className="text-[11px] text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded">
                          Área: {gw.areaNombre}
                        </span>
                      )}
                      {hasZona && (
                        <span className="text-[11px] text-purple-700 bg-purple-50 border border-purple-200 px-1.5 py-0.5 rounded">
                          Zona: {gw.zonaNombre}
                        </span>
                      )}
                      {!hasArea && !hasZona && (
                        <span className="text-[11px] text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded">
                          Libre
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {selected !== null && (
            <p className="mt-3 text-xs text-slate-500 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
              Si el gateway ya está vinculado a otra {targetTipo === "area" ? "área" : "zona"}, la asignación anterior se cerrará automáticamente.
            </p>
          )}
        </div>

        <div className="flex justify-end gap-2 px-5 pb-5">
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={onClose}
            disabled={saving}
          >
            Cancelar
          </button>
          <button
            type="button"
            className="btn btn-sm text-white"
            style={{ backgroundColor: "#09268E", borderColor: "#09268E" }}
            onClick={handleAsignar}
            disabled={saving || !selected}
          >
            {saving && <span className="loading loading-spinner loading-xs" />}
            Asignar gateway
          </button>
        </div>
      </div>
      <form method="dialog" className="modal-backdrop">
        <button type="submit" onClick={onClose}>close</button>
      </form>
    </dialog>
  );
}
