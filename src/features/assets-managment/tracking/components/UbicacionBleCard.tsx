"use client";
import { useCallback, useEffect, useState } from "react";
import { getAsignacionesTagActivo, desasignarTagActivo } from "@/features/assets-managment/tracking/services/asignacionTagActivoService";
import { getUbicacionByTag } from "@/features/assets-managment/tracking/services/ubicacionActivoService";
import { VincularTagModal } from "@/features/assets-managment/tracking/components/VincularTagModal";
import type {
  AsignacionTagActivoDto,
  UbicacionActivoDto,
} from "@/features/assets-managment/tracking/types";
import { toast } from "@/lib/toast";

interface UbicacionBleCardProps {
  activoId: number;
}

function mVToPercent(mv: number): number {
  return Math.min(100, Math.max(0, Math.round((mv - 2000) / 1000 * 100)));
}

// Barra de señal RSSI (4 barras de tamaño creciente)
function RssiBar({ rssi }: { rssi: number }) {
  const strength =
    rssi >= -60 ? 4 : rssi >= -70 ? 3 : rssi >= -80 ? 2 : 1;
  const { label, color } =
    strength === 4
      ? { label: "Excelente", color: "#10b981" }
      : strength === 3
        ? { label: "Buena", color: "#22c55e" }
        : strength === 2
          ? { label: "Débil", color: "#f59e0b" }
          : { label: "Muy débil", color: "#ef4444" };

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-end gap-[3px]">
        {[1, 2, 3, 4].map((lvl) => (
          <div
            key={lvl}
            className="w-[5px] rounded-sm transition-colors"
            style={{
              height: `${lvl * 4 + 4}px`,
              backgroundColor: lvl <= strength ? color : "#e2e8f0",
            }}
          />
        ))}
      </div>
      <span className="text-xs font-semibold" style={{ color }}>
        {rssi} dBm
      </span>
      <span className="text-xs text-slate-400">·</span>
      <span className="text-xs text-slate-500">{label}</span>
    </div>
  );
}

function InfoRow({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="text-[#09268E] mt-0.5 shrink-0">{icon}</span>
      <div className="min-w-0">
        <p className="text-[10px] font-semibold uppercase tracking-[0.5px] text-slate-400">
          {label}
        </p>
        <div className="text-sm font-medium text-[#0f172a] mt-0.5">
          {children}
        </div>
      </div>
    </div>
  );
}

function formatDateTime(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("es-CL", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// Calcula el tiempo transcurrido desde la última actualización de la ubicación.
function tiempoTranscurrido(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "hace unos segundos";
  if (mins < 60) return `hace ${mins} min`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `hace ${hrs} h`;
  return `hace ${Math.floor(hrs / 24)} días`;
}

export function UbicacionBleCard({ activoId }: UbicacionBleCardProps) {
  const [asignacion, setAsignacion] = useState<AsignacionTagActivoDto | null>(null);
  const [ubicacion, setUbicacion] = useState<UbicacionActivoDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingUbicacion, setLoadingUbicacion] = useState(false);
  const [desvinculando, setDesvinculando] = useState(false);
  const [showVincular, setShowVincular] = useState(false);

  const loadAsignacion = useCallback(async () => {
    setLoading(true);
    try {
      const all = await getAsignacionesTagActivo(true);
      const found = all.find((a) => a.activoId === activoId) ?? null;
      setAsignacion(found);
      if (found) {
        setLoadingUbicacion(true);
        getUbicacionByTag(found.tagBleId)
          .then(setUbicacion)
          .catch(() => setUbicacion(null))
          .finally(() => setLoadingUbicacion(false));
      } else {
        setUbicacion(null);
      }
    } catch {
      setAsignacion(null);
    } finally {
      setLoading(false);
    }
  }, [activoId]);

  useEffect(() => {
    void loadAsignacion();
  }, [loadAsignacion]);

  async function handleDesvincular() {
    if (!asignacion) return;
    setDesvinculando(true);
    try {
      await desasignarTagActivo(asignacion.id);
      toast.success(`Tag "${asignacion.tagCodigo}" desvinculado del activo.`);
      setAsignacion(null);
      setUbicacion(null);
    } catch {
      toast.error("No se pudo desvincular el tag. Intente nuevamente.");
    } finally {
      setDesvinculando(false);
    }
  }

  function handleVinculado(nueva: AsignacionTagActivoDto) {
    setAsignacion(nueva);
    setLoadingUbicacion(true);
    getUbicacionByTag(nueva.tagBleId)
      .then(setUbicacion)
      .catch(() => setUbicacion(null))
      .finally(() => setLoadingUbicacion(false));
  }

  return (
    <>
      <div className="bg-white border border-[#E2E8F0] rounded-xl shadow-sm overflow-hidden">
        {/* Header de la card */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-[#F1F5F9]">
          <div className="flex items-center gap-2">
            
            <h3 className="text-xs font-bold uppercase tracking-[0.7px] text-[#09268E]">
              Localización
            </h3>
          </div>

     
          
        </div>

        {/* Cuerpo */}
        <div className="px-6 py-5 flex flex-col gap-5">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <span className="loading loading-spinner loading-md text-[#09268E]" />
            </div>
          ) : !asignacion ? (
            /* Empty state */
            <div className="flex flex-col items-center justify-center py-8 gap-3 text-center">
              <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center">
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  className="text-slate-300"
                >
                  <path d="m6.5 6.5 11 11M17.5 6.5 12 12l5.5 5.5M6.5 6.5 12 12l-5.5 5.5" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-600">
                  Sin tag vinculado
                </p>
                <p className="text-xs text-slate-400 mt-1 max-w-[280px]">
                  Vincule un tag para habilitar la localización en tiempo
                  real del activo.
                </p>
              </div>
              <button
                type="button"
                className="btn btn-sm text-white mt-1"
                style={{ backgroundColor: "#09268E", borderColor: "#09268E" }}
                onClick={() => setShowVincular(true)}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="2.5"
                  stroke="currentColor"
                  className="size-[1.1em]"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 4.5v15m7.5-7.5h-15"
                  />
                </svg>
                Vincular tag
              </button>
            </div>
          ) : (
            <>
              {/* Tag vinculado — chip */}
              <div className="flex items-center justify-between gap-3 bg-blue-50 border border-blue-100 rounded-xl px-4 py-3">
                <div className="flex items-center gap-3 min-w-0">
                  
                  <div className="min-w-0">
                    <p className="text-[10px] text-blue-400 font-semibold uppercase tracking-[0.5px]">
                      Tag vinculado
                    </p>
                    <div className="flex items-center gap-2 flex-wrap mt-0.5">
                      <span className="font-mono text-sm font-bold text-[#09268E]">
                        {asignacion.tagCodigo}
                      </span>
                      <span className="font-mono text-xs text-slate-400 bg-white border border-slate-200 px-1.5 py-0.5 rounded">
                        {asignacion.tagMac}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      Vinculado el {formatDateTime(asignacion.fechaAsignacion)}
                      {asignacion.asignadoPorNombre
                        ? ` · por ${asignacion.asignadoPorNombre}`
                        : ""}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  className="btn btn-xs btn-ghost text-red-500 hover:bg-red-50 shrink-0"
                  title="Desvincular tag"
                  onClick={handleDesvincular}
                  disabled={desvinculando}
                >
                  {desvinculando ? (
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
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M13.181 8.68a4.503 4.503 0 0 1 1.903 6.405m-9.768-2.782L1.522 17.25a4.5 4.5 0 0 0 7.368 4.442l1.106-1.106m7.041-7.776 1.106-1.106a4.5 4.5 0 0 0-7.369-4.443M4.75 6.75l14.5 12M4.75 6.75 3 5"
                      />
                    </svg>
                  )}
                  Desvincular
                </button>
              </div>

              {/* Sección de ubicación */}
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.5px] text-slate-400 mb-3">
                  Última ubicación detectada
                </p>

                {loadingUbicacion ? (
                  <div className="flex items-center gap-2 py-4">
                    <span className="loading loading-spinner loading-sm text-[#09268E]" />
                    <span className="text-sm text-slate-400">
                      Cargando ubicación...
                    </span>
                  </div>
                ) : !ubicacion ? (
                  <div className="flex items-center gap-3 bg-slate-50 border border-slate-100 rounded-xl px-4 py-4">
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      className="text-slate-300 shrink-0"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z"
                      />
                    </svg>
                    <div>
                      <p className="text-sm text-slate-500 font-medium">
                        Sin señal reciente
                      </p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        El tag aún no ha sido detectado por ningún gateway.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Área detectada */}
                    <InfoRow
                      label="Área detectada"
                      icon={
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
                        </svg>
                      }
                    >
                      {ubicacion.areaNombre ?? (
                        <span className="text-slate-400 font-normal italic">
                          Gateway sin área asignada
                        </span>
                      )}
                    </InfoRow>

                    {/* Gateway */}
                    <InfoRow
                      label="Gateway detector"
                      icon={
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <rect x="2" y="3" width="20" height="14" rx="2" />
                          <path d="M8 21h8M12 17v4" />
                        </svg>
                      }
                    >
                      <div>
                        <span>
                          {ubicacion.gatewayNombre ?? (
                            <span className="text-slate-400 font-normal italic">
                              No registrado
                            </span>
                          )}
                        </span>
                        <span className="font-mono text-[10px] text-slate-400 block">
                          {ubicacion.macGateway}
                        </span>
                      </div>
                    </InfoRow>

                    {/* Señal RSSI */}
                    <InfoRow
                      label="Intensidad de señal"
                      icon={
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M8.288 15.038a5.25 5.25 0 0 1 7.424 0M5.106 11.856c3.807-3.808 9.98-3.808 13.788 0M1.924 8.674c5.565-5.565 14.587-5.565 20.152 0M12.53 18.22l-.53.53-.53-.53a.75.75 0 0 1 1.06 0Z" />
                        </svg>
                      }
                    >
                      <RssiBar rssi={ubicacion.rssi} />
                    </InfoRow>

                    {/* Última señal */}
                    <InfoRow
                      label="Última señal"
                      icon={
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                        </svg>
                      }
                    >
                      <span>
                        {formatDateTime(ubicacion.ultimaActualizacion)}
                        <span className="text-slate-400 font-normal text-xs ml-1">
                          ({tiempoTranscurrido(ubicacion.ultimaActualizacion)})
                        </span>
                      </span>
                    </InfoRow>

                    {/* Batería (si disponible) */}
                    {ubicacion.bateria !== null && (
                      <InfoRow
                        label="Batería del sensor"
                        icon={
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="1" y="6" width="18" height="12" rx="2" />
                            <path strokeLinecap="round" d="M23 11v2" />
                          </svg>
                        }
                      >
                        {(() => {
                          const pct = mVToPercent(ubicacion.bateria!);
                          const color =
                            pct > 60
                              ? "text-emerald-600"
                              : pct > 20
                                ? "text-yellow-600"
                                : "text-red-600";
                          return (
                            <span className={color}>
                              {pct}%{" "}
                              <span className="text-slate-400 font-normal text-xs">
                                ({ubicacion.bateria} mV)
                              </span>
                            </span>
                          );
                        })()}
                      </InfoRow>
                    )}
                  </div>
                )}
              </div>
            </>
          )}

        </div>
      </div>

      <VincularTagModal
        open={showVincular}
        activoId={activoId}
        onClose={() => setShowVincular(false)}
        onVinculado={handleVinculado}
      />
    </>
  );
}
