"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { useAppSelector } from "@/store/hooks";
import { selectHospitalId } from "@/store/slices/authSlice";
import { getHospitalFloorPlans, getFloorPlanView } from "@/features/administration/hospitalFloorPlans/services/hospitalFloorPlanService";
import type { PlanoHospital, VistaPlano, AreaEnPlano, ActivoEnArea } from "@/features/administration/hospitalFloorPlans/types";
import { SERVER_BASE_URL } from "@/config/api";

const REFRESH_MS = 30_000;

function getImageUrl(url: string) {
  return `${SERVER_BASE_URL}${url}`;
}

function formatRelative(iso: string) {
  const secs = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (secs < 60) return `${secs}s`;
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins}min`;
  return `${Math.floor(mins / 60)}h`;
}

// Componente principal del tab de mapa de activos que muestra los planos del hospital 
// y la ubicación de los activos en tiempo real.
export default function AssetMapTab() {
  // El hospitalId llega en la respuesta de login y se guarda en el perfil de sesion;
  // ya no se decodifica del JWT, que ahora vive en una cookie httpOnly.
  const hospitalId = useAppSelector(selectHospitalId);

  const [planos, setPlanos] = useState<PlanoHospital[]>([]);
  const [activePlanoId, setActivePlanoId] = useState<number | null>(null);
  const [vista, setVista] = useState<VistaPlano | null>(null);
  const [loadingPlanos, setLoadingPlanos] = useState(true);
  const [loadingVista, setLoadingVista] = useState(false);
  const [errorPlanos, setErrorPlanos] = useState<string | null>(null);
  const [errorVista, setErrorVista] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const loadPlanos = useCallback(async () => {
    if (!hospitalId) return;
    setLoadingPlanos(true);
    setErrorPlanos(null);
    try {
      const list = await getHospitalFloorPlans(hospitalId);
      const sorted = [...list].sort((a, b) => a.orden - b.orden);
      setPlanos(sorted);
      if (sorted.length > 0) setActivePlanoId((prev) => prev ?? sorted[0].id);
    } catch {
      setErrorPlanos("No se pudieron cargar los planos.");
    } finally {
      setLoadingPlanos(false);
    }
  }, [hospitalId]);

  const loadVista = useCallback(async (planoId: number) => {
    setLoadingVista(true);
    setErrorVista(null);
    try {
      const v = await getFloorPlanView(planoId);
      setVista(v);
      setLastUpdate(new Date());
    } catch {
      setErrorVista("No se pudo cargar la vista del plano.");
    } finally {
      setLoadingVista(false);
    }
  }, []);

  useEffect(() => { void loadPlanos(); }, [loadPlanos]);

  useEffect(() => {
    if (!activePlanoId) return;
    void loadVista(activePlanoId);
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => void loadVista(activePlanoId), REFRESH_MS);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [activePlanoId, loadVista]);

  const areasConPosicion = (vista?.areas.filter((a) => a.posX != null) ?? [])
    .map((a) => ({ ...a, activos: a.activos ?? [] }));
  const totalActivos = areasConPosicion.reduce((n, a) => n + a.activos.length, 0);
  const areasOcupadas = areasConPosicion.filter((a) => a.activos.length > 0).length;

  if (!hospitalId) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-sm text-slate-400">No tienes hospital asignado.</p>
      </div>
    );
  }

  if (loadingPlanos) {
    return (
      <div className="flex items-center justify-center py-20">
        <span className="loading loading-spinner loading-md text-[#09268E]" />
      </div>
    );
  }

  if (errorPlanos) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3">
        <p className="text-sm text-red-500">{errorPlanos}</p>
        <button className="btn btn-sm text-white" style={{ backgroundColor: "#09268E" }} onClick={loadPlanos}>
          Reintentar
        </button>
      </div>
    );
  }

  if (planos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <div className="w-14 h-14 rounded-xl bg-[#EBF0FF] flex items-center justify-center">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#09268E" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2" /><path d="M3 9h18M9 21V9" />
          </svg>
        </div>
        <p className="text-sm font-semibold text-slate-600">Sin planos configurados</p>
        <p className="text-xs text-slate-400 text-center max-w-xs">
          Configura los planos del hospital desde la sección de Administración para visualizar la ubicación de los activos.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Stats bar */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-medium text-slate-600">
              {totalActivos} activo{totalActivos !== 1 ? "s" : ""} detectado{totalActivos !== 1 ? "s" : ""}
            </span>
          </div>
          <div className="h-3 w-px bg-slate-200" />
          <span className="text-xs text-slate-400">
            {areasOcupadas} área{areasOcupadas !== 1 ? "s" : ""} ocupada{areasOcupadas !== 1 ? "s" : ""}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {lastUpdate && (
            <span className="text-xs text-slate-400">
              Actualizado hace {formatRelative(lastUpdate.toISOString())}
            </span>
          )}
          <button
            type="button"
            title="Actualizar ahora"
            className="w-7 h-7 rounded-lg border border-[#E2E8F0] flex items-center justify-center text-slate-500 hover:bg-slate-50 hover:text-[#09268E] transition-colors cursor-pointer"
            onClick={() => activePlanoId && void loadVista(activePlanoId)}
            disabled={loadingVista}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
              className={loadingVista ? "animate-spin" : ""}>
              <path d="M23 4v6h-6" /><path d="M1 20v-6h6" />
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
            </svg>
          </button>
        </div>
      </div>

      {/* Floor tabs */}
      <div className="flex gap-0.5 border-b border-[#e2e8f0] overflow-x-auto">
        {planos.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => setActivePlanoId(p.id)}
            className={[
              "px-4 py-2.5 text-sm font-semibold transition-colors -mb-px border-b-2 whitespace-nowrap cursor-pointer",
              activePlanoId === p.id
                ? "text-[#09268E] border-[#09268E]"
                : "text-slate-500 border-transparent hover:text-[#1A2B5E] hover:border-slate-300",
            ].join(" ")}
          >
            {p.nombre}
          </button>
        ))}
      </div>

      {/* Floor plan view */}
      {errorVista ? (
        <div className="flex flex-col items-center py-10 gap-3">
          <p className="text-sm text-red-500">{errorVista}</p>
          <button className="btn btn-sm text-white" style={{ backgroundColor: "#09268E" }}
            onClick={() => activePlanoId && void loadVista(activePlanoId)}>
            Reintentar
          </button>
        </div>
      ) : (
        <div className="rounded-xl border border-[#E2E8F0] overflow-hidden bg-white shadow-sm">
          {loadingVista && !vista && (
            <div className="flex items-center justify-center py-24">
              <span className="loading loading-spinner loading-md text-[#09268E]" />
            </div>
          )}

          {vista && (
            <>
              <div className="relative bg-slate-100 select-none">
                <img
                  src={getImageUrl(vista.urlImagen)}
                  alt={vista.nombre}
                  className="w-full object-contain"
                  style={{ opacity: loadingVista ? 0.65 : 1, transition: "opacity 0.2s" }}
                  draggable={false}
                />
                {loadingVista && (
                  <div className="absolute top-3 right-3">
                    <span className="loading loading-spinner loading-xs text-[#09268E]" />
                  </div>
                )}
                {areasConPosicion.map((area) => (
                  <AreaPin key={area.areaId} area={area} />
                ))}
              </div>

              {/* Legend */}
              <div className="px-5 py-4 border-t border-[#E2E8F0]">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Áreas con activos
                  </p>
                  <div className="flex items-center gap-3 text-[10px] text-slate-400">
                    <span className="flex items-center gap-1">
                      <span className="w-3 h-3 rounded-full bg-[#09268E] inline-block" /> Con activos
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-3 h-3 rounded-full bg-slate-300 inline-block" /> Sin activos
                    </span>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {areasConPosicion.filter((a) => a.activos.length > 0).length === 0 ? (
                    <p className="text-xs text-slate-400">Ningún activo detectado en este piso ahora mismo.</p>
                  ) : (
                    areasConPosicion
                      .filter((a) => a.activos.length > 0)
                      .map((area) => {
                        const activos = area.activos;
                        return (
                          <div key={area.areaId} className="inline-flex items-center gap-1.5 bg-white border border-[#E2E8F0] rounded-full px-3 py-1 text-xs font-medium text-slate-700">
                            <div className="w-2 h-2 rounded-full bg-[#09268E]" />
                            {area.areaNombre}
                            <span className="bg-[#EBF0FF] text-[#09268E] rounded-full px-1.5 py-px text-[10px] font-bold">
                              {activos.length}
                            </span>
                          </div>
                        );
                      })
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

// Componente que representa el pin de un área en el plano, mostrando su estado (con o sin activos) 
// y un tooltip con detalles al hacer hover.
function AreaPin({ area }: { area: AreaEnPlano }) {
  const [hover, setHover] = useState(false);
  const activos = area.activos;
  const hasActivos = activos.length > 0;

  return (
    <div
      className="absolute z-10"
      style={{ left: `${area.posX}%`, top: `${area.posY}%`, transform: "translate(-50%, -100%)" }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      {hover && <AreaTooltip area={area} activos={activos} flipTooltip={area.posY < 30} />}

      <div className="flex flex-col items-center cursor-default">
        <div className={[
          "relative rounded-full border-2 border-white shadow-md flex items-center justify-center transition-transform hover:scale-110",
          hasActivos ? "w-9 h-9 bg-[#09268E]" : "w-6 h-6 bg-slate-400",
        ].join(" ")}>
          {hasActivos ? (
            <>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                <line x1="12" y1="22.08" x2="12" y2="12" />
              </svg>
              <div className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center border border-white">
                {activos.length > 9 ? "9+" : activos.length}
              </div>
            </>
          ) : (
            <svg width="10" height="10" viewBox="0 0 24 24" fill="white" stroke="white" strokeWidth="1">
              <circle cx="12" cy="10" r="3" /><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
            </svg>
          )}
        </div>
        <div className={["w-0.5", hasActivos ? "h-2 bg-[#09268E]" : "h-1.5 bg-slate-400"].join(" ")} />
        <div className={[
          "rounded text-[10px] font-semibold px-1.5 py-0.5 border whitespace-nowrap max-w-28 truncate",
          hasActivos ? "bg-[#09268E] text-white border-[#09268E]" : "bg-white text-slate-500 border-slate-200",
        ].join(" ")}>
          {area.areaNombre}
        </div>
      </div>
    </div>
  );
}

// Componente que muestra un tooltip con información detallada del área 
// y los activos presentes en ella al hacer hover sobre el pin del área en el plano.
function AreaTooltip({ area, activos, flipTooltip }: { area: AreaEnPlano; activos: ActivoEnArea[]; flipTooltip?: boolean }) {
  const box = (
    <div className="bg-[#1A2B5E] text-white rounded-xl shadow-xl min-w-52 max-w-72 overflow-hidden">
      <div className="px-3 py-2.5 border-b border-white/10">
        <p className="font-bold text-sm">{area.areaNombre}</p>
        <p className="text-[10px] text-blue-200 mt-0.5">
          {activos.length === 0 ? "Sin activos detectados" : `${activos.length} activo${activos.length !== 1 ? "s" : ""} detectado${activos.length !== 1 ? "s" : ""}`}
        </p>
      </div>
      {activos.length > 0 && (
        <div className="divide-y divide-white/10 max-h-48 overflow-y-auto">
          {activos.map((d, i) => (
            <div key={i} className="px-3 py-2 flex items-start gap-2">
              <div className="w-5 h-5 rounded bg-blue-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" strokeWidth="2.5">
                  <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                </svg>
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-white truncate">
                  {d.activoDescripcion ?? "Activo sin descripción"}
                </p>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  Últ. señal: {formatRelative(d.ultimaActualizacion)} atrás
                </p>
              </div>
            </div>
          ))}

          </div>
        )}
      </div>
  );
  const arrowDown = (
    <div className="flex justify-center">
      <div className="w-0 h-0" style={{ borderLeft: "6px solid transparent", borderRight: "6px solid transparent", borderTop: "6px solid #1A2B5E" }} />
    </div>
  );
  const arrowUp = (
    <div className="flex justify-center">
      <div className="w-0 h-0" style={{ borderLeft: "6px solid transparent", borderRight: "6px solid transparent", borderBottom: "6px solid #1A2B5E" }} />
    </div>
  );
  return flipTooltip ? (
    <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 z-30 pointer-events-none">
      {arrowUp}
      {box}
    </div>
  ) : (
    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-30 pointer-events-none">
      {box}
      {arrowDown}
    </div>
  );
}
