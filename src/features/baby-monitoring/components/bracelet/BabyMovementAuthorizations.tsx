"use client";
import { useCallback, useEffect, useState } from "react";
import { toast } from "@/lib/toast";
import {
  getMovementAuthorizationsByEpisode,
  markMovementAuthorizationAsUsed,
} from "@/features/baby-monitoring/services/babyService";
import type { Bebe, AutorizacionMovimiento } from "@/features/baby-monitoring/types";
import { CreateMovementAuthorizationModal } from "./CreateMovementAuthorizationModal";

interface BabyMovementAuthorizationsProps {
  bebe: Bebe;
  readOnly: boolean;
  currentZonaId?: number | null;
  currentZonaNombre?: string | null;
}

function formatDT(d: string | null) {
  if (!d) return "—";
  try {
    return new Date(d).toLocaleString("es-ES", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit", hour12: false });
  } catch { return d; }
}

// Componente para mostrar y gestionar las autorizaciones de movimiento del bebé dentro del hospital. 
// Permite ver las autorizaciones existentes, crear nuevas y marcar como utilizadas las autorizaciones pendientes.
export function BabyMovementAuthorizations({ bebe, readOnly, currentZonaId, currentZonaNombre }: BabyMovementAuthorizationsProps) {
  const [auths, setAuths] = useState<AutorizacionMovimiento[]>([]);
  const [loading, setLoading] = useState(true);
  const [markingUsed, setMarkingUsed] = useState<number | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const loadAuths = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getMovementAuthorizationsByEpisode(bebe.episodioId);
      setAuths([...data].sort((a, b) => new Date(b.fechaAutorizacion).getTime() - new Date(a.fechaAutorizacion).getTime()));
    } catch {
      // fail silently
    } finally {
      setLoading(false);
    }
  }, [bebe.episodioId]);

  useEffect(() => { void loadAuths(); }, [loadAuths]);

  async function handleMarkUsed(id: number) {
    setMarkingUsed(id);
    try {
      await markMovementAuthorizationAsUsed(id);
      toast.success("Autorización marcada como utilizada.");
      void loadAuths();
    } catch (err: unknown) {
      const data = (err as { response?: { data?: { mensaje?: string; message?: string } } })?.response?.data;
      toast.error(data?.mensaje ?? data?.message ?? "No se pudo marcar como utilizada.");
    } finally {
      setMarkingUsed(null);
    }
  }

  const colCount = readOnly ? 7 : 8;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-[#E2E8F0] overflow-hidden">
      <div className="px-5 py-3.5 border-b border-[#f1f5f9] bg-[#F8FAFC] flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-[0.5px] text-[#64748b]">Autorizaciones de movimiento</span>
        <div className="flex items-center gap-2">
          {!loading && auths.length > 0 && (
            <span className="text-xs font-bold bg-[#f1f5f9] text-[#64748b] rounded-full px-2 py-0.5">{auths.length}</span>
          )}
          {!readOnly && bebe.activo && (
            <button
              type="button"
              className="btn btn-xs text-white"
              style={{ backgroundColor: "#09268E", borderColor: "#09268E" }}
              onClick={() => setShowCreateModal(true)}
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" className="size-3">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              Nueva autorización
            </button>
          )}
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="table table-zebra w-full [&_td]:py-2.5 [&_th]:py-2.5">
          <thead>
            <tr className="bg-[#F8FAFC] text-[#1A2B5E]">
              <th className="text-xs font-semibold uppercase tracking-wide whitespace-nowrap">Zona origen</th>
              <th className="text-xs font-semibold uppercase tracking-wide whitespace-nowrap">Zona destino</th>
              <th className="text-xs font-semibold uppercase tracking-wide">Motivo</th>
              <th className="text-xs font-semibold uppercase tracking-wide whitespace-nowrap">Autorizado por</th>
              <th className="text-xs font-semibold uppercase tracking-wide whitespace-nowrap">Fecha aut.</th>
              <th className="text-xs font-semibold uppercase tracking-wide whitespace-nowrap">Expira</th>
              <th className="text-xs font-semibold uppercase tracking-wide">Estado</th>
              {!readOnly && <th />}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={colCount} className="text-center py-8"><span className="loading loading-spinner loading-md text-[#09268E]" /></td></tr>
            ) : auths.length === 0 ? (
              <tr><td colSpan={colCount} className="text-center py-8 text-base-content/40 text-sm">No hay autorizaciones de movimiento para este episodio.</td></tr>
            ) : (
              auths.map((auth) => (
                <tr key={auth.id} className="hover:bg-base-200">
                  <td className="text-sm text-[#475569] whitespace-nowrap">{auth.zonaOrigenNombre ?? "—"}</td>
                  <td className="text-sm font-semibold text-[#1A2B5E] whitespace-nowrap">{auth.zonaDestinoNombre}</td>
                  <td className="text-sm text-[#475569] truncate max-w-[150px]">{auth.motivo}</td>
                  <td className="text-sm text-[#475569] whitespace-nowrap truncate">{auth.autorizadoPorNombre}</td>
                  <td className="text-sm text-[#475569] whitespace-nowrap">{formatDT(auth.fechaAutorizacion)}</td>
                  <td className="text-sm text-[#475569] whitespace-nowrap">{formatDT(auth.fechaExpiracion)}</td>
                  <td>
                    {auth.utilizada ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 whitespace-nowrap">
                        <span className="size-1.5 rounded-full bg-emerald-500 inline-block" />
                        Utilizada
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200 whitespace-nowrap">
                        Pendiente
                      </span>
                    )}
                  </td>
                  {!readOnly && (
                    <td>
                      {!auth.utilizada && (
                        <button
                          type="button"
                          className="btn btn-xs btn-ghost text-slate-500 hover:text-emerald-600 whitespace-nowrap"
                          disabled={markingUsed === auth.id}
                          onClick={() => void handleMarkUsed(auth.id)}
                        >
                          {markingUsed === auth.id ? <span className="loading loading-spinner loading-xs" /> : "Marcar utilizada"}
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

      <CreateMovementAuthorizationModal
        open={showCreateModal}
        bebe={bebe}
        currentZonaId={currentZonaId}
        currentZonaNombre={currentZonaNombre}
        onClose={() => setShowCreateModal(false)}
        onCreated={() => void loadAuths()}
      />
    </div>
  );
}
