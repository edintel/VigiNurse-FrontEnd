"use client";
import { useCallback, useRef, useState } from "react";
import axiosInstance from "@/lib/axios";
import { API_ENDPOINTS, SERVER_BASE_URL } from "@/config/api";
import type { AreaConPosicion, VistaPlano, AreaEnPlano } from "@/features/administration/hospitalFloorPlans/types";


interface Props {
  areaId: number | null;
  activoId?: number | null;
  areaName?: string | null;
}

function getImageUrl(urlImagen: string) {
  return `${SERVER_BASE_URL}${urlImagen}`;
}

// Obtener detalles del área para luego cargar el plano y posicionar el activo
async function getAreaById(areaId: number): Promise<AreaConPosicion | null> {
  try {
    const res = await axiosInstance.get<AreaConPosicion>(API_ENDPOINTS.areas.byId(areaId));
    return res.data;
  } catch {
    return null;
  }
}

// Obtener datos del plano hospitalario para renderizar la vista y posicionar el activo
async function getFloorPlanView(planoId: number): Promise<VistaPlano | null> {
  try {
    const res = await axiosInstance.get<VistaPlano>(API_ENDPOINTS.hospitalFloorPlans.vista(planoId));
    return res.data;
  } catch {
    return null;
  }
}

// Componente principal que muestra el mapa de planta con la posición del activo
export function AssetFloorPlanMap({ areaId, activoId, areaName }: Props) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [vista, setVista] = useState<VistaPlano | null>(null);
  const [activeArea, setActiveArea] = useState<AreaEnPlano | null>(null);
  const [noPlano, setNoPlano] = useState(false);
  const loaded = useRef(false);

  const loadMapa = useCallback(async () => {
    if (!areaId) { setNoPlano(true); return; }
    setLoading(true);
    setError(null);
    setNoPlano(false);
    try {
      const area = await getAreaById(areaId);
      if (!area?.planoHospitalId) { setNoPlano(true); setLoading(false); return; }

      const v = await getFloorPlanView(area.planoHospitalId);
      if (!v) { setError("No se pudo cargar el plano."); setLoading(false); return; }

      setVista(v);

      // Buscar el área que contiene el activo en dispositivos[] (tiempo real)
      // Si no se encuentra, usar el área por areaId como fallback
      const found = activoId
        ? v.areas.find((a) => a.activos.some((d) => d.activoId === activoId)) ?? null
        : null;
      const fallback = v.areas.find((a) => a.areaId === areaId) ?? null;
      setActiveArea(found ?? fallback);
    } catch {
      setError("No se pudo cargar el plano.");
    } finally {
      setLoading(false);
    }
  }, [areaId, activoId]);

  function handleToggle() {
    const next = !open;
    setOpen(next);
    if (next && !loaded.current) {
      loaded.current = true;
      void loadMapa();
    }
  }

  const displayName = activeArea?.areaNombre ?? areaName ?? "Activo";

  return (
    <div className="mt-3">
      {/* Toggle button */}
      <button
        type="button"
        onClick={handleToggle}
        className="flex items-center gap-2 text-sm font-semibold text-[#09268E] hover:text-[#1A2B5E] transition-colors cursor-pointer"
      >
        <div className="w-7 h-7 rounded-lg bg-[#EBF0FF] flex items-center justify-center flex-shrink-0">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <path d="M3 9h18M9 21V9" />
          </svg>
        </div>
        {open ? "Cerrar mapa" : "Abrir mapa"}
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {open && (
        <div className="mt-3 rounded-xl border border-[#E2E8F0] overflow-hidden bg-white shadow-sm">
          {loading && (
            <div className="flex items-center justify-center py-12">
              <span className="loading loading-spinner loading-md text-[#09268E]" />
            </div>
          )}

          {!loading && error && (
            <div className="flex flex-col items-center justify-center py-10 gap-2">
              <p className="text-sm text-red-500">{error}</p>
              <button
                className="btn btn-xs text-white"
                style={{ backgroundColor: "#09268E" }}
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
                {areaId
                  ? "Esta área no tiene un plano asignado. Configúralo en Administración."
                  : "Este activo no tiene área detectada."}
              </p>
            </div>
          )}

          {!loading && !error && !noPlano && vista && (
            <>
              {/* Header */}
              <div className="px-4 py-2.5 border-b border-[#F1F5F9] bg-slate-50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#09268E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="18" height="18" rx="2" />
                    <path d="M3 9h18M9 21V9" />
                  </svg>
                  <span className="text-xs font-semibold text-[#1A2B5E]">{vista.nombre}</span>
                </div>
                {activeArea && (
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-[#09268E] animate-pulse" />
                    <span className="text-xs text-slate-600 font-semibold">{activeArea.areaNombre}</span>
                  </div>
                )}
              </div>

              {/* Map */}
              <div className="relative bg-slate-100 select-none">
                <img
                  src={getImageUrl(vista.urlImagen)}
                  alt={vista.nombre}
                  className="w-full object-contain"
                  draggable={false}
                />

                {/* Pins de otras áreas (referencia) */}
                {vista.areas
                  .filter((a) => a.areaId !== activeArea?.areaId && a.posX != null)
                  .map((a) => (
                    <GhostPin key={a.areaId} area={a} />
                  ))}

                {/* Pin del activo (área activa) */}
                {activeArea && activeArea.posX != null && activeArea.posY != null && (
                  <AssetPin
                    posX={activeArea.posX}
                    posY={activeArea.posY}
                    label={displayName}
                    deviceCount={activeArea.activos.length}
                  />
                )}

                {/* Sin señal: el área fue detectada pero ya no aparece en dispositivos */}
                {!activeArea && vista.areas.find((a) => a.areaId === areaId) && (
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-black/60 text-white text-xs rounded-full px-3 py-1">
                    Sin señal reciente — última área conocida
                  </div>
                )}
              </div>

              <div className="px-4 py-2 bg-slate-50 border-t border-[#F1F5F9] flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <p className="text-[10px] text-slate-400">
                  Posición determinada por el gateway BLE más cercano al activo.
                </p>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

// Pin fantasma para mostrar otras áreas en el plano sin sobrecargar la vista (sin animación ni hover activo)
function GhostPin({ area }: { area: AreaEnPlano }) {
  const [hover, setHover] = useState(false);
  return (
    <div
      className="absolute z-10"
      style={{
        left: `${area.posX}%`,
        top: `${area.posY}%`,
        transform: "translate(-50%, -100%)",
      }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      {hover && (
        <div className={[
          "absolute left-1/2 -translate-x-1/2 bg-slate-700 text-white text-[10px] rounded-lg px-2 py-1 whitespace-nowrap shadow pointer-events-none z-30",
          area.posY < 30 ? "top-full mt-1" : "bottom-full mb-1",
        ].join(" ")}>
          {area.areaNombre}
          {area.activos.length > 0 && (
            <span className="ml-1 text-blue-300">· {area.activos.length} activo{area.activos.length !== 1 ? "s" : ""}</span>
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

// Pin principal para el activo rastreado, con animación y tooltip detallado al hacer hover (nombre + cantidad de activos en el área) */
function AssetPin({ posX, posY, label, deviceCount }: { posX: number; posY: number; label: string; deviceCount: number }) {
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
          "absolute left-1/2 -translate-x-1/2 bg-[#1A2B5E] text-white text-xs rounded-lg px-2.5 py-1.5 whitespace-nowrap shadow-lg pointer-events-none z-30",
          posY < 30 ? "top-full mt-1" : "bottom-full mb-1",
        ].join(" ")}>
          <span className="font-semibold">{label}</span>
          <div className="text-[10px] text-blue-200 mt-0.5">
            {deviceCount > 1 ? `${deviceCount} activos en esta área` : "Activo detectado aquí"}
          </div>
        </div>
      )}
      <div className="flex flex-col items-center drop-shadow-lg">
        <div className="relative">
          <div className="absolute inset-0 rounded-full bg-[#09268E]/25 animate-ping scale-150" />
          <div className="relative w-9 h-9 rounded-full bg-[#09268E] border-2 border-white flex items-center justify-center shadow-md">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
              <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
              <line x1="12" y1="22.08" x2="12" y2="12" />
            </svg>
          </div>
          {deviceCount > 1 && (
            <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center border border-white">
              {deviceCount}
            </div>
          )}
        </div>
        <div className="w-0.5 h-2 bg-[#09268E]" />
        <div className="bg-[#09268E] text-white text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap shadow">
          {label}
        </div>
      </div>
    </div>
  );
}
