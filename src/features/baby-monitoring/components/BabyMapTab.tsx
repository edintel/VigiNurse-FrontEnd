"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { useAppSelector } from "@/store/hooks";
import { selectCurrentUser, selectAuthToken } from "@/store/slices/authSlice";
import { getHospitalFloorPlans, getFloorPlanView } from "@/features/administration/hospitalFloorPlans/services/hospitalFloorPlanService";
import type { PlanoHospital, VistaPlano, ZonaEnPlano, BebeEnZona } from "@/features/administration/hospitalFloorPlans/types";
import { SERVER_BASE_URL } from "@/config/api";
import { formatBabyName } from "@/shared/utils/personName";

const REFRESH_MS = 30_000;

function getImageUrl(url: string) {
  return `${SERVER_BASE_URL}${url}`;
}

function hospitalIdFromJwt(token: string): number | null {
  try {
    const part = token.split(".")[1];
    const b64 = part.replace(/-/g, "+").replace(/_/g, "/");
    const padded = b64 + "=".repeat((4 - (b64.length % 4)) % 4);
    const payload = JSON.parse(atob(padded)) as Record<string, unknown>;
    const raw = payload["hospital_id"];
    if (typeof raw === "number") return raw;
    if (typeof raw === "string") return parseInt(raw, 10) || null;
    return null;
  } catch { return null; }
}

function formatRelative(iso: string) {
  const secs = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (secs < 60) return `${secs}s`;
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins}min`;
  return `${Math.floor(mins / 60)}h`;
}

export default function BabyMapTab() {
  const currentUser = useAppSelector(selectCurrentUser);
  const token = useAppSelector(selectAuthToken);
  const hospitalId = currentUser?.hospitalId ?? (token ? hospitalIdFromJwt(token) : null);

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

  const zonasConPos = (vista?.zonas.filter((z) => z.posX != null) ?? [])
    .map((z) => ({ ...z, bebes: z.bebes ?? [] }));
  const totalBebes = zonasConPos.reduce((n, z) => n + z.bebes.length, 0);
  const zonasOcupadas = zonasConPos.filter((z) => z.bebes.length > 0).length;

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
        <span className="loading loading-spinner loading-md text-pink-600" />
      </div>
    );
  }

  if (errorPlanos) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3">
        <p className="text-sm text-red-500">{errorPlanos}</p>
        <button className="btn btn-sm text-white" style={{ backgroundColor: "#be185d" }} onClick={loadPlanos}>
          Reintentar
        </button>
      </div>
    );
  }

  if (planos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <div className="w-14 h-14 rounded-xl bg-pink-50 flex items-center justify-center">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#be185d" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2" /><path d="M3 9h18M9 21V9" />
          </svg>
        </div>
        <p className="text-sm font-semibold text-slate-600">Sin planos configurados</p>
        <p className="text-xs text-slate-400 text-center max-w-xs">
          Configura los planos del hospital desde la sección de Administración para ver la ubicación de los bebés.
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
            <div className="w-2 h-2 rounded-full bg-pink-500 animate-pulse" />
            <span className="text-xs font-medium text-slate-600">
              {totalBebes} bebé{totalBebes !== 1 ? "s" : ""} detectado{totalBebes !== 1 ? "s" : ""}
            </span>
          </div>
          <div className="h-3 w-px bg-slate-200" />
          <span className="text-xs text-slate-400">
            {zonasOcupadas} zona{zonasOcupadas !== 1 ? "s" : ""} ocupada{zonasOcupadas !== 1 ? "s" : ""}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {lastUpdate && (
            <span className="text-xs text-slate-400">
              Actualizado hace {formatRelative(lastUpdate.toISOString())} atrás
            </span>
          )}
          <button
            type="button"
            title="Actualizar ahora"
            className="w-7 h-7 rounded-lg border border-[#E2E8F0] flex items-center justify-center text-slate-500 hover:bg-slate-50 hover:text-pink-600 transition-colors cursor-pointer"
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
                ? "text-pink-700 border-pink-600"
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
          <button className="btn btn-sm text-white" style={{ backgroundColor: "#be185d" }}
            onClick={() => activePlanoId && void loadVista(activePlanoId)}>
            Reintentar
          </button>
        </div>
      ) : (
        <div className="rounded-xl border border-[#E2E8F0] overflow-hidden bg-white shadow-sm">
          {loadingVista && !vista && (
            <div className="flex items-center justify-center py-24">
              <span className="loading loading-spinner loading-md text-pink-600" />
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
                    <span className="loading loading-spinner loading-xs text-pink-600" />
                  </div>
                )}
                {zonasConPos.map((zona) => (
                  <ZonaPin key={zona.zonaId} zona={zona} />
                ))}
              </div>

              {/* Legend */}
              <div className="px-5 py-4 border-t border-[#E2E8F0]">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Zonas con bebés
                  </p>
                  <div className="flex items-center gap-3 text-[10px] text-slate-400">
                    <span className="flex items-center gap-1">
                      <span className="w-3 h-3 rounded-full bg-pink-600 inline-block" /> Con bebés
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-3 h-3 rounded-full bg-slate-300 inline-block" /> Sin bebés
                    </span>
                  </div>
                </div>
                {zonasConPos.filter((z) => z.bebes.length > 0).length === 0 ? (
                  <p className="text-xs text-slate-400">Ningún bebé detectado en este piso ahora mismo.</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {zonasConPos
                      .filter((z) => z.bebes.length > 0)
                      .map((zona) => (
                        <div key={zona.zonaId} className="inline-flex items-center gap-1.5 bg-white border border-[#E2E8F0] rounded-full px-3 py-1 text-xs font-medium text-slate-700">
                          <div className="w-2 h-2 rounded-full bg-pink-600" />
                          {zona.zonaNombre}
                          <span className="bg-pink-50 text-pink-700 rounded-full px-1.5 py-px text-[10px] font-bold">
                            {zona.bebes.length}
                          </span>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

function ZonaPin({ zona }: { zona: ZonaEnPlano }) {
  const [hover, setHover] = useState(false);
  const hasBebes = zona.bebes.length > 0;

  return (
    <div
      className="absolute z-10"
      style={{ left: `${zona.posX}%`, top: `${zona.posY}%`, transform: "translate(-50%, -100%)" }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      {hover && <ZonaTooltip zona={zona} flipTooltip={(zona.posY ?? 50) < 30} />}

      <div className="flex flex-col items-center cursor-default">
        <div className={[
          "relative rounded-full border-2 border-white shadow-md flex items-center justify-center transition-transform hover:scale-110",
          hasBebes ? "w-9 h-9 bg-pink-600" : "w-6 h-6 bg-slate-400",
        ].join(" ")}>
          {hasBebes ? (
            <>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 12h.01M15 12h.01M10 16c.5.3 1.2.5 2 .5s1.5-.2 2-.5" />
                <path d="M19 6.3a9 9 0 0 1 1.8 3.9 2 2 0 0 1 0 3.6 9 9 0 0 1-17.6 0 2 2 0 0 1 0-3.6A9 9 0 0 1 12 3c2 0 3.5 1.1 3.5 2.5s-.9 2.5-2 2.5c-.8 0-1.5-.4-1.5-1" />
              </svg>
              <div className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center border border-white">
                {zona.bebes.length > 9 ? "9+" : zona.bebes.length}
              </div>
            </>
          ) : (
            <svg width="10" height="10" viewBox="0 0 24 24" fill="white" stroke="white" strokeWidth="1">
              <circle cx="12" cy="10" r="3" /><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
            </svg>
          )}
        </div>
        <div className={["w-0.5", hasBebes ? "h-2 bg-pink-600" : "h-1.5 bg-slate-400"].join(" ")} />
        <div className={[
          "rounded text-[10px] font-semibold px-1.5 py-0.5 border whitespace-nowrap max-w-28 truncate",
          hasBebes ? "bg-pink-600 text-white border-pink-600" : "bg-white text-slate-500 border-slate-200",
        ].join(" ")}>
          {zona.zonaNombre}
        </div>
      </div>
    </div>
  );
}

function ZonaTooltip({ zona, flipTooltip }: { zona: ZonaEnPlano; flipTooltip?: boolean }) {
  const bebes = zona.bebes ?? [];
  const box = (
    <div className="bg-pink-900 text-white rounded-xl shadow-xl min-w-52 max-w-72 overflow-hidden">
      <div className="px-3 py-2.5 border-b border-white/10">
        <p className="font-bold text-sm">{zona.zonaNombre}</p>
        <p className="text-[10px] text-pink-200 mt-0.5">
          {bebes.length === 0 ? "Sin bebés detectados" : `${bebes.length} bebé${bebes.length !== 1 ? "s" : ""}`}
        </p>
      </div>
      {bebes.length > 0 && (
        <div className="divide-y divide-white/10 max-h-48 overflow-y-auto">
          {bebes.map((b, i) => (
            <BebeRow key={i} bebe={b} />
          ))}
        </div>
      )}
      {bebes.length === 0 && (
        <div className="px-3 py-2">
          <p className="text-xs text-pink-200">Zona vacía</p>
        </div>
      )}
    </div>
  );
  const arrowDown = (
    <div className="flex justify-center">
      <div className="w-0 h-0" style={{ borderLeft: "6px solid transparent", borderRight: "6px solid transparent", borderTop: "6px solid #831843" }} />
    </div>
  );
  const arrowUp = (
    <div className="flex justify-center">
      <div className="w-0 h-0" style={{ borderLeft: "6px solid transparent", borderRight: "6px solid transparent", borderBottom: "6px solid #831843" }} />
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

function BebeRow({ bebe }: { bebe: BebeEnZona }) {
  return (
    <div className="px-3 py-2 flex items-start gap-2">
      <div className="w-5 h-5 rounded bg-pink-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#f9a8d4" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 12h.01M15 12h.01M10 16c.5.3 1.2.5 2 .5s1.5-.2 2-.5" />
          <path d="M19 6.3a9 9 0 0 1 1.8 3.9 2 2 0 0 1 0 3.6 9 9 0 0 1-17.6 0 2 2 0 0 1 0-3.6A9 9 0 0 1 12 3c2 0 3.5 1.1 3.5 2.5s-.9 2.5-2 2.5c-.8 0-1.5-.4-1.5-1" />
        </svg>
      </div>
      <div className="min-w-0">
        <p className="text-xs font-semibold text-white truncate">
          {formatBabyName(bebe.pacienteNombre, bebe.pacienteApellidos, bebe.nombreMadre, bebe.apellidosMadre)}
        </p>
        <p className="text-[10px] text-pink-300 mt-0.5">
          Últ. señal: {formatRelative(bebe.ultimaActualizacion)} atrás
        </p>
      </div>
    </div>
  );
}
