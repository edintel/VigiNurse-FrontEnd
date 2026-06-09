"use client";
import { useCallback, useRef, useState } from "react";
import axiosInstance from "@/lib/axios";
import { API_ENDPOINTS, SERVER_BASE_URL } from "@/config/api";
import { getFloorPlanView } from "@/features/administration/hospitalFloorPlans/services/hospitalFloorPlanService";
import type { VistaPlano, ZonaEnPlano } from "@/features/administration/hospitalFloorPlans/types";

interface Props {
  zonaId: number | null;
  pacienteId?: number | null;
  zonaNombre?: string | null;
}

interface ZonaConPlano {
  id: number;
  planoHospitalId: number | null;
  posX: number | null;
  posY: number | null;
}

function getImageUrl(url: string) {
  return `${SERVER_BASE_URL}${url}`;
}

async function getZonaById(zonaId: number): Promise<ZonaConPlano | null> {
  try {
    const res = await axiosInstance.get<ZonaConPlano>(
      API_ENDPOINTS.zonas.byId(zonaId),
      { params: { includeSensores: false } }
    );
    return res.data;
  } catch {
    return null;
  }
}

export function BabyFloorPlanMap({ zonaId, pacienteId, zonaNombre }: Props) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [vista, setVista] = useState<VistaPlano | null>(null);
  const [activeZona, setActiveZona] = useState<ZonaEnPlano | null>(null);
  const [noPlano, setNoPlano] = useState(false);
  const loaded = useRef(false);

  const loadMapa = useCallback(async () => {
    if (!zonaId) { setNoPlano(true); return; }
    setLoading(true);
    setError(null);
    setNoPlano(false);
    try {
      const zona = await getZonaById(zonaId);
      if (!zona?.planoHospitalId) { setNoPlano(true); setLoading(false); return; }

      const v = await getFloorPlanView(zona.planoHospitalId);
      setVista(v);

      // Buscar zona activa por pacienteId en tiempo real, fallback por zonaId
      const found = pacienteId
        ? v.zonas.find((z) => z.bebes.some((b) => b.pacienteId === pacienteId)) ?? null
        : null;
      setActiveZona(found ?? v.zonas.find((z) => z.zonaId === zonaId) ?? null);
    } catch {
      setError("No se pudo cargar el plano.");
    } finally {
      setLoading(false);
    }
  }, [zonaId, pacienteId]);

  function handleToggle() {
    const next = !open;
    setOpen(next);
    if (next && !loaded.current) {
      loaded.current = true;
      void loadMapa();
    }
  }

  const displayName = activeZona?.zonaNombre ?? zonaNombre ?? "Bebé";

  return (
    <div className="mt-3">
      <button
        type="button"
        onClick={handleToggle}
        className="flex items-center gap-2 text-sm font-semibold text-pink-700 hover:text-pink-900 transition-colors cursor-pointer"
      >
        <div className="w-7 h-7 rounded-lg bg-pink-50 flex items-center justify-center flex-shrink-0">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <path d="M3 9h18M9 21V9" />
          </svg>
        </div>
        {open ? "Cerrar mapa" : "Abrir mapa"}
        <svg
          width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
          strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
          className={`transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {open && (
        <div className="mt-3 rounded-xl border border-[#E2E8F0] overflow-hidden bg-white shadow-sm">
          {loading && (
            <div className="flex items-center justify-center py-12">
              <span className="loading loading-spinner loading-md text-pink-600" />
            </div>
          )}

          {!loading && error && (
            <div className="flex flex-col items-center justify-center py-10 gap-2">
              <p className="text-sm text-red-500">{error}</p>
              <button
                className="btn btn-xs text-white"
                style={{ backgroundColor: "#be185d" }}
                onClick={() => { loaded.current = false; void loadMapa(); }}
              >
                Reintentar
              </button>
            </div>
          )}

          {!loading && noPlano && (
            <div className="flex flex-col items-center justify-center py-10 gap-2 px-4 text-center">
              <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                  <path d="M3 9h18M9 21V9" />
                </svg>
              </div>
              <p className="text-sm font-medium text-slate-500">Sin plano configurado</p>
              <p className="text-xs text-slate-400">
                {zonaId
                  ? "Esta zona no tiene un plano asignado. Configúralo en Administración."
                  : "Este bebé no tiene zona detectada."}
              </p>
            </div>
          )}

          {!loading && !error && !noPlano && vista && (
            <>
              <div className="px-4 py-2.5 border-b border-[#F1F5F9] bg-slate-50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#be185d" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="18" height="18" rx="2" />
                    <path d="M3 9h18M9 21V9" />
                  </svg>
                  <span className="text-xs font-semibold text-[#1A2B5E]">{vista.nombre}</span>
                </div>
                {activeZona && (
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-pink-500 animate-pulse" />
                    <span className="text-xs text-slate-600 font-semibold">{activeZona.zonaNombre}</span>
                  </div>
                )}
              </div>

              <div className="relative bg-slate-100 select-none">
                <img
                  src={getImageUrl(vista.urlImagen)}
                  alt={vista.nombre}
                  className="w-full object-contain"
                  draggable={false}
                />

                {/* Ghost pins — otras zonas */}
                {vista.zonas
                  .filter((z) => z.zonaId !== activeZona?.zonaId && z.posX != null)
                  .map((z) => (
                    <ZonaGhostPin key={z.zonaId} zona={z} />
                  ))}

                {/* Pin activo del bebé */}
                {activeZona && activeZona.posX != null && activeZona.posY != null && (
                  <BabyActivePin
                    posX={activeZona.posX}
                    posY={activeZona.posY}
                    label={displayName}
                    bebeCount={activeZona.bebes.length}
                  />
                )}

                {!activeZona && vista.zonas.find((z) => z.zonaId === zonaId) && (
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-black/60 text-white text-xs rounded-full px-3 py-1">
                    Sin señal reciente — última zona conocida
                  </div>
                )}
              </div>

              <div className="px-4 py-2 bg-slate-50 border-t border-[#F1F5F9] flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-pink-500" />
                <p className="text-[10px] text-slate-400">
                  Posición determinada por el sensor BLE más cercano al brazalete.
                </p>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

function ZonaGhostPin({ zona }: { zona: ZonaEnPlano }) {
  const [hover, setHover] = useState(false);
  return (
    <div
      className="absolute z-10"
      style={{ left: `${zona.posX}%`, top: `${zona.posY}%`, transform: "translate(-50%, -100%)" }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      {hover && (
        <div className={[
          "absolute left-1/2 -translate-x-1/2 bg-slate-700 text-white text-[10px] rounded-lg px-2 py-1 whitespace-nowrap shadow pointer-events-none z-30",
          (zona.posY ?? 50) < 30 ? "top-full mt-1" : "bottom-full mb-1",
        ].join(" ")}>
          {zona.zonaNombre}
          {zona.bebes.length > 0 && (
            <span className="ml-1 text-pink-300">· {zona.bebes.length} bebé{zona.bebes.length !== 1 ? "s" : ""}</span>
          )}
        </div>
      )}
      <div className="flex flex-col items-center">
        <div className="w-5 h-5 rounded-full bg-slate-300/70 border border-white/80 flex items-center justify-center shadow-sm">
          <svg width="9" height="9" viewBox="0 0 24 24" fill="white" stroke="white" strokeWidth="1">
            <circle cx="12" cy="10" r="3" />
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
          </svg>
        </div>
        <div className="w-0.5 h-1.5 bg-slate-300/70" />
      </div>
    </div>
  );
}

function BabyActivePin({ posX, posY, label, bebeCount }: { posX: number; posY: number; label: string; bebeCount: number }) {
  const [hover, setHover] = useState(false);
  return (
    <div
      className="absolute z-20"
      style={{ left: `${posX}%`, top: `${posY}%`, transform: "translate(-50%, -100%)" }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      {hover && (
        <div className={[
          "absolute left-1/2 -translate-x-1/2 bg-pink-900 text-white text-xs rounded-lg px-2.5 py-1.5 whitespace-nowrap shadow-lg pointer-events-none z-30",
          posY < 30 ? "top-full mt-1" : "bottom-full mb-1",
        ].join(" ")}>
          <span className="font-semibold">{label}</span>
          <div className="text-[10px] text-pink-200 mt-0.5">
            {bebeCount > 1 ? `${bebeCount} bebés en esta zona` : "Bebé detectado aquí"}
          </div>
        </div>
      )}
      <div className="flex flex-col items-center drop-shadow-lg">
        <div className="relative">
          <div className="absolute inset-0 rounded-full bg-pink-500/25 animate-ping scale-150" />
          <div className="relative w-9 h-9 rounded-full bg-pink-600 border-2 border-white flex items-center justify-center shadow-md">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 12h.01M15 12h.01M10 16c.5.3 1.2.5 2 .5s1.5-.2 2-.5" />
              <path d="M19 6.3a9 9 0 0 1 1.8 3.9 2 2 0 0 1 0 3.6 9 9 0 0 1-17.6 0 2 2 0 0 1 0-3.6A9 9 0 0 1 12 3c2 0 3.5 1.1 3.5 2.5s-.9 2.5-2 2.5c-.8 0-1.5-.4-1.5-1" />
            </svg>
          </div>
          {bebeCount > 1 && (
            <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center border border-white">
              {bebeCount}
            </div>
          )}
        </div>
        <div className="w-0.5 h-2 bg-pink-600" />
        <div className="bg-pink-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap shadow max-w-28 truncate">
          {label}
        </div>
      </div>
    </div>
  );
}
