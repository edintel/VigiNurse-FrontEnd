"use client";
import { useEffect, useRef, useState } from "react";
import { AsignarGatewayModal } from "@/features/administration/areasYZonas/components/AsignarGatewayModal";

export interface GatewayEntry {
  id: number;
  gatewayNombre: string;
  gatewayMac: string;
  fechaAsignacion: string;
}

interface Props {
  open: boolean;
  targetId: number;
  targetNombre: string;
  targetTipo: "area" | "zona";
  gateways: GatewayEntry[];
  desasignando: number | null;
  onClose: () => void;
  onDesasignar: (id: number) => void;
  onAsignado: () => void;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString("es-CL", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

export function GatewaysModal({
  open, targetId, targetNombre, targetTipo,
  gateways, desasignando,
  onClose, onDesasignar, onAsignado,
}: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [asignarOpen, setAsignarOpen] = useState(false);
  const [confirmId, setConfirmId] = useState<number | null>(null);

  useEffect(() => {
    if (open) dialogRef.current?.showModal();
    else { dialogRef.current?.close(); setConfirmId(null); }
  }, [open]);

  const label = targetTipo === "area" ? "Área" : "Zona";

  return (
    <>
      <dialog
        ref={dialogRef}
        className="modal"
        onCancel={(e) => { e.preventDefault(); onClose(); }}
      >
        <div className="modal-box max-w-2xl p-0 overflow-hidden rounded-xl">
          {/* Header */}
          <div className="px-6 py-4 border-b border-[#E2E8F0] flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: "#09268E" }}>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="#fff" className="size-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.288 15.038a5.25 5.25 0 0 1 7.424 0M5.106 11.856c3.807-3.808 9.98-3.808 13.788 0M1.924 8.674c5.565-5.565 14.587-5.565 20.152 0M12.53 18.22l-.53.53-.53-.53a.75.75 0 0 1 1.06 0Z" />
                </svg>
              </div>
              <div>
                <h3 className="text-base font-bold text-[#0f172a] leading-tight">Gateways asignados</h3>
                <p className="text-xs text-slate-400 mt-0.5">{label}: <span className="font-semibold text-[#1A2B5E]">{targetNombre}</span></p>
              </div>
            </div>
            <button
              type="button"
              className="btn btn-sm text-white gap-1.5 flex-shrink-0"
              style={{ backgroundColor: "#09268E", borderColor: "#09268E" }}
              onClick={() => setAsignarOpen(true)}
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" className="size-3.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              Agregar gateway
            </button>
          </div>

          {/* Body */}
          <div className="px-6 py-4 min-h-[180px]">
            {gateways.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-3 py-10 text-slate-400">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-10 opacity-30">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 3l18 18M8.288 15.038a5.25 5.25 0 0 1 7.424 0m-9.192-3.182c1.977-1.978 4.5-3.04 7.085-3.182M1.924 8.674c2.162-2.162 4.8-3.681 7.706-4.382M12 18.75l-.53.53-.53-.53a.75.75 0 0 1 1.06 0Z" />
                </svg>
                <div className="text-center">
                  <p className="text-sm font-medium">Sin gateways asignados</p>
                  <p className="text-xs mt-0.5">Usa el botón de arriba para agregar uno</p>
                </div>
              </div>
            ) : (
              <div className="rounded-lg border border-[#E2E8F0] overflow-hidden">
                <table className="table table-sm w-full">
                  <thead>
                    <tr className="bg-slate-50/70 border-b border-slate-100">
                      <th className="text-[10px] font-bold uppercase tracking-widest text-slate-400 py-2.5 pl-4">Nombre</th>
                      <th className="text-[10px] font-bold uppercase tracking-widest text-slate-400 py-2.5">MAC</th>
                      <th className="text-[10px] font-bold uppercase tracking-widest text-slate-400 py-2.5">Asignado</th>
                      <th className="text-[10px] font-bold uppercase tracking-widest text-slate-400 py-2.5 pr-4 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {gateways.map((gw) => (
                      <tr key={gw.id} className={`border-b border-slate-100/60 last:border-0 transition-colors ${confirmId === gw.id ? "bg-red-50/60" : "hover:bg-slate-50/60"}`}>
                        <td className="py-2.5 pl-4 font-semibold text-sm text-[#0f172a]">{gw.gatewayNombre}</td>
                        <td className="py-2.5">
                          <span className="font-mono text-xs text-slate-500 bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded">
                            {gw.gatewayMac}
                          </span>
                        </td>
                        <td className="py-2.5 text-xs text-slate-400">{formatDate(gw.fechaAsignacion)}</td>
                        <td className="py-2.5 pr-4">
                          <div className="flex items-center justify-end gap-2">
                            {confirmId === gw.id ? (
                              <>
                                <span className="text-xs text-red-600 font-medium whitespace-nowrap">¿Desasignar?</span>
                                <button
                                  type="button"
                                  className="btn btn-xs btn-error text-white"
                                  disabled={desasignando === gw.id}
                                  onClick={() => { setConfirmId(null); onDesasignar(gw.id); }}
                                >
                                  {desasignando === gw.id ? <span className="loading loading-spinner loading-xs" /> : "Sí"}
                                </button>
                                <button
                                  type="button"
                                  className="btn btn-xs btn-ghost"
                                  onClick={() => setConfirmId(null)}
                                >
                                  No
                                </button>
                              </>
                            ) : (
                              <button
                                type="button"
                                className="btn btn-square btn-sm btn-ghost text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                                title="Desasignar gateway"
                                disabled={desasignando === gw.id}
                                onClick={() => setConfirmId(gw.id)}
                              >
                                {desasignando === gw.id ? (
                                  <span className="loading loading-spinner loading-sm" />
                                ) : (
                                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" className="size-5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                                  </svg>
                                )}
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-[#E2E8F0] flex justify-end">
            <button type="button" className="btn btn-sm btn-ghost" onClick={onClose}>
              Cerrar
            </button>
          </div>
        </div>

        <form method="dialog" className="modal-backdrop">
          <button type="button" onClick={onClose}>close</button>
        </form>
      </dialog>

      <AsignarGatewayModal
        open={asignarOpen}
        targetId={targetId}
        targetNombre={targetNombre}
        targetTipo={targetTipo}
        onClose={() => setAsignarOpen(false)}
        onAsignado={() => { setAsignarOpen(false); onAsignado(); }}
      />
    </>
  );
}
