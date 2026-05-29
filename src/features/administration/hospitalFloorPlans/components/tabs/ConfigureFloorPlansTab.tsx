"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  getHospitalFloorPlans,
  getAreasList,
  saveAreaPosition,
} from "@/features/administration/hospitalFloorPlans/services/hospitalFloorPlanService";
import type {
  PlanoHospital,
  AreaConPosicion,
} from "@/features/administration/hospitalFloorPlans/types";
import { UploadFloorPlanModal } from "@/features/administration/hospitalFloorPlans/components/UploadFloorPlanModal";
import { DeleteFloorPlanModal } from "@/features/administration/hospitalFloorPlans/components/DeleteFloorPlanModal";
import { SERVER_BASE_URL } from "@/config/api";
import { toast } from "@/lib/toast";

interface Props {
  hospitalId: number;
  isSuperAdmin?: boolean;
}

function getImageUrl(urlImagen: string) {
  return `${SERVER_BASE_URL}${urlImagen}`;
}

// Componente principal para configurar planos hospitalarios
export default function ConfigureFloorPlansTab({ hospitalId, isSuperAdmin }: Props) {
  const imageRef = useRef<HTMLImageElement>(null);

  const [planos, setPlanos] = useState<PlanoHospital[]>([]);
  const [areas, setAreas] = useState<AreaConPosicion[]>([]);
  const [selectedPlano, setSelectedPlano] = useState<PlanoHospital | null>(null);
  const [selectedAreaId, setSelectedAreaId] = useState<number | null>(null);
  const [loadingData, setLoadingData] = useState(true);
  const [loadingPin, setLoadingPin] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSubir, setShowSubir] = useState(false);
  const [planoToDelete, setPlanoToDelete] = useState<PlanoHospital | null>(null);

  const loadData = useCallback(async () => {
    setLoadingData(true);
    setError(null);
    try {
      const [ps, as] = await Promise.all([
        getHospitalFloorPlans(hospitalId),
        getAreasList(),
      ]);
      setPlanos(ps);
      setAreas(as.filter((a) => a.hospitalId === hospitalId));
    } catch {
      setError("Error al cargar los datos. Intenta nuevamente.");
    } finally {
      setLoadingData(false);
    }
  }, [hospitalId]);

  useEffect(() => { void loadData(); }, [loadData]);

  const areasDelPlano = selectedPlano
    ? areas.filter((a) => a.planoHospitalId === selectedPlano.id)
    : [];

  const areasSinPlano = areas.filter((a) => a.planoHospitalId === null);

  function handleImageClick(e: React.MouseEvent<HTMLDivElement>) {
    if (!selectedAreaId || !imageRef.current || loadingPin) return;
    const rect = imageRef.current.getBoundingClientRect();
    const posX = ((e.clientX - rect.left) / rect.width) * 100;
    const posY = ((e.clientY - rect.top) / rect.height) * 100;
    void savePin(selectedAreaId, posX, posY);
  }

  async function savePin(areaId: number, posX: number, posY: number) {
    if (!selectedPlano) return;
    setLoadingPin(true);
    try {
      await saveAreaPosition(areaId, {
        planoHospitalId: selectedPlano.id,
        posX: Math.round(posX * 100) / 100,
        posY: Math.round(posY * 100) / 100,
      });
      const area = areas.find((a) => a.id === areaId);
      toast.success(`Área "${area?.nombre ?? ""}" posicionada.`);
      setSelectedAreaId(null);
      const updated = await getAreasList();
      setAreas(updated.filter((a) => a.hospitalId === hospitalId));
    } catch {
      toast.error("Error al guardar la posición.");
    } finally {
      setLoadingPin(false);
    }
  }

  async function removePin(area: AreaConPosicion) {
    if (loadingPin) return;
    setLoadingPin(true);
    try {
      await saveAreaPosition(area.id, {
        planoHospitalId: null,
        posX: null,
        posY: null,
      });
      toast.success(`Pin de "${area.nombre}" eliminado.`);
      const updated = await getAreasList();
      setAreas(updated.filter((a) => a.hospitalId === hospitalId));
    } catch {
      toast.error("Error al eliminar el pin.");
    } finally {
      setLoadingPin(false);
    }
  }

  if (loadingData) {
    return (
      <div className="flex items-center justify-center py-16">
        <span className="loading loading-spinner loading-md text-[#09268E]" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3">
        <p className="text-sm text-red-600">{error}</p>
        <button
          className="btn btn-sm text-white"
          style={{ backgroundColor: "#09268E" }}
          onClick={loadData}
        >
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header bar */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <p className="text-sm text-slate-500">
          {planos.length === 0
            ? "No hay planos cargados. Sube el primero."
            : `${planos.length} plano${planos.length !== 1 ? "s" : ""} disponible${planos.length !== 1 ? "s" : ""}.`}
        </p>
        <button
          className="btn btn-sm text-white flex items-center gap-1.5"
          style={{ backgroundColor: "#09268E" }}
          onClick={() => setShowSubir(true)}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Subir nuevo plano
        </button>
      </div>

      {/* Planos list */}
      {planos.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 bg-slate-50 rounded-xl border border-dashed border-slate-300">
          <div className="w-12 h-12 rounded-xl bg-[#EBF0FF] flex items-center justify-center mb-3">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#09268E" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <path d="M3 9h18M9 21V9" />
            </svg>
          </div>
          <p className="text-sm font-semibold text-slate-600">Sin planos cargados</p>
          <p className="text-xs text-slate-400 mt-1">Sube la imagen de un plano para comenzar a posicionar áreas.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {[...planos].sort((a, b) => a.orden - b.orden).map((plano) => (
            <div
              key={plano.id}
              className={[
                "group rounded-xl border transition-all duration-200 cursor-pointer overflow-hidden",
                selectedPlano?.id === plano.id
                  ? "border-[#09268E] shadow-md ring-2 ring-[#09268E]/20"
                  : "border-[#E2E8F0] hover:border-[#09268E]/40 hover:shadow-sm",
              ].join(" ")}
              onClick={() => {
                setSelectedPlano(plano);
                setSelectedAreaId(null);
              }}
            >
              <div className="bg-slate-100 h-28 flex items-center justify-center overflow-hidden relative">
                <img
                  src={getImageUrl(plano.urlImagen)}
                  alt={plano.nombre}
                  className="w-full h-full object-cover"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                />
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    type="button"
                    title="Eliminar plano"
                    className="w-7 h-7 rounded-lg bg-white/90 border border-slate-200 flex items-center justify-center text-red-500 hover:bg-red-50 transition-colors cursor-pointer"
                    onClick={(e) => { e.stopPropagation(); setPlanoToDelete(plano); }}
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="3 6 5 6 21 6" />
                      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                      <path d="M10 11v6M14 11v6" />
                    </svg>
                  </button>
                </div>
              </div>
              <div className="px-3 py-2.5 bg-white">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-semibold text-[#1A2B5E] truncate">{plano.nombre}</span>
                  <span className="text-xs text-slate-400 flex-shrink-0">Orden {plano.orden}</span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  {areas.filter((a) => a.planoHospitalId === plano.id).length} área
                  {areas.filter((a) => a.planoHospitalId === plano.id).length !== 1 ? "s" : ""} posicionada
                  {areas.filter((a) => a.planoHospitalId === plano.id).length !== 1 ? "s" : ""}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Selected plano editor */}
      {selectedPlano && (
        <div className="border border-[#E2E8F0] rounded-xl overflow-hidden bg-white shadow-sm">
          <div className="px-5 py-3.5 border-b border-[#E2E8F0] bg-slate-50 flex items-center gap-2 flex-wrap">
            <div className="w-6 h-6 rounded bg-[#EBF0FF] flex items-center justify-center flex-shrink-0">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#09268E" strokeWidth="2.5">
                <circle cx="12" cy="10" r="3" /><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
              </svg>
            </div>
            <span className="text-sm font-bold text-[#1A2B5E]">
              Editando: {selectedPlano.nombre}
            </span>
            {selectedAreaId && (
              <span className="ml-auto text-xs bg-amber-50 text-amber-700 border border-amber-200 rounded-full px-2.5 py-0.5 font-medium flex items-center gap-1.5">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <circle cx="12" cy="10" r="3" /><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
                </svg>
                Haz clic en el plano para colocar el pin
              </span>
            )}
          </div>

          <div className="flex flex-col lg:flex-row">
            {/* Image area */}
            <div className="flex-1 p-4">
              <div
                className="relative rounded-lg overflow-hidden border border-[#E2E8F0] bg-slate-50 select-none"
                style={{ cursor: selectedAreaId ? "crosshair" : "default" }}
                onClick={handleImageClick}
              >
                {loadingPin && (
                  <div className="absolute inset-0 bg-white/60 z-20 flex items-center justify-center">
                    <span className="loading loading-spinner loading-sm text-[#09268E]" />
                  </div>
                )}
                <img
                  ref={imageRef}
                  src={getImageUrl(selectedPlano.urlImagen)}
                  alt={selectedPlano.nombre}
                  className="w-full object-contain"
                  draggable={false}
                  onError={(e) => {
                    const el = e.target as HTMLImageElement;
                    el.style.display = "none";
                  }}
                />
                {/* Pins */}
                {areasDelPlano
                  .filter((a) => a.posX !== null && a.posY !== null)
                  .map((area) => (
                    <PinOverlay
                      key={area.id}
                      area={area}
                      isSelected={selectedAreaId === area.id}
                      onRemove={() => void removePin(area)}
                    />
                  ))}
              </div>
              <p className="text-xs text-slate-400 mt-2 text-center">
                Selecciona un área de la lista y luego haz clic sobre el plano para colocar su pin.
              </p>
            </div>

            {/* Areas panel */}
            <div className="lg:w-72 border-t lg:border-t-0 lg:border-l border-[#E2E8F0] flex flex-col">
              <div className="px-4 py-3 border-b border-[#E2E8F0] bg-slate-50">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Áreas sin posición
                  <span className="ml-2 bg-amber-100 text-amber-700 rounded-full px-1.5 py-0.5 text-[10px]">
                    {areasSinPlano.length}
                  </span>
                </p>
              </div>
              <div className="flex-1 overflow-y-auto max-h-72">
                {areasSinPlano.length === 0 ? (
                  <div className="px-4 py-6 text-center">
                    <p className="text-xs text-slate-400">Todas las áreas tienen posición asignada.</p>
                  </div>
                ) : (
                  <div className="divide-y divide-[#f1f5f9]">
                    {areasSinPlano.map((area) => (
                      <button
                        key={area.id}
                        type="button"
                        className={[
                          "w-full px-4 py-2.5 flex items-center gap-3 text-left transition-colors cursor-pointer",
                          selectedAreaId === area.id
                            ? "bg-[#EBF0FF] text-[#09268E]"
                            : "hover:bg-slate-50 text-slate-700",
                        ].join(" ")}
                        onClick={() => setSelectedAreaId(selectedAreaId === area.id ? null : area.id)}
                      >
                        <div className={[
                          "w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors",
                          selectedAreaId === area.id ? "border-[#09268E] bg-[#09268E]" : "border-slate-300",
                        ].join(" ")}>
                          {selectedAreaId === area.id && (
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                              <circle cx="12" cy="10" r="4" fill="white" stroke="white" />
                            </svg>
                          )}
                        </div>
                        <span className="text-sm font-medium truncate">{area.nombre}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {areasDelPlano.filter((a) => a.posX !== null).length > 0 && (
                <>
                  <div className="px-4 py-3 border-t border-[#E2E8F0] bg-slate-50">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Áreas posicionadas
                      <span className="ml-2 bg-emerald-100 text-emerald-700 rounded-full px-1.5 py-0.5 text-[10px]">
                        {areasDelPlano.filter((a) => a.posX !== null).length}
                      </span>
                    </p>
                  </div>
                  <div className="overflow-y-auto max-h-48">
                    <div className="divide-y divide-[#f1f5f9]">
                      {areasDelPlano
                        .filter((a) => a.posX !== null)
                        .map((area) => (
                          <div key={area.id} className="px-4 py-2.5 flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2 min-w-0">
                              <div className="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0" />
                              <span className="text-sm text-slate-700 truncate">{area.nombre}</span>
                            </div>
                            <button
                              type="button"
                              title="Quitar pin"
                              className="text-slate-400 hover:text-red-500 transition-colors flex-shrink-0 cursor-pointer"
                              onClick={() => void removePin(area)}
                              disabled={loadingPin}
                            >
                              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                              </svg>
                            </button>
                          </div>
                        ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      <UploadFloorPlanModal
        open={showSubir}
        onClose={() => setShowSubir(false)}
        onCreated={(plano) => {
          setPlanos((prev) => [...prev, plano]);
          setSelectedPlano(plano);
        }}
        hospitalId={hospitalId}
        isSuperAdmin={isSuperAdmin}
      />

      <DeleteFloorPlanModal
        open={planoToDelete !== null}
        plano={planoToDelete}
        onClose={() => setPlanoToDelete(null)}
        onDeleted={(id) => {
          setPlanos((prev) => prev.filter((p) => p.id !== id));
          if (selectedPlano?.id === id) setSelectedPlano(null);
          void loadData();
        }}
      />
    </div>
  );
}

function PinOverlay({
  area,
  isSelected,
  onRemove,
}: {
  area: AreaConPosicion;
  isSelected: boolean;
  onRemove: () => void;
}) {
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
      {/* Tooltip */}
      {hover && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 bg-[#1A2B5E] text-white text-xs rounded-lg px-2.5 py-1.5 whitespace-nowrap shadow-lg z-20 pointer-events-none">
          <div className="font-semibold">{area.nombre}</div>
          <div className="text-[10px] text-blue-200 mt-0.5">
            ({area.posX?.toFixed(1)}%, {area.posY?.toFixed(1)}%)
          </div>
        </div>
      )}

      {/* Pin */}
      <div className="relative flex flex-col items-center">
        <div
          className={[
            "w-8 h-8 rounded-full border-2 flex items-center justify-center shadow-md transition-transform hover:scale-110",
            isSelected ? "border-amber-400 bg-amber-500" : "border-white bg-[#09268E]",
          ].join(" ")}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="white" stroke="white" strokeWidth="1">
            <circle cx="12" cy="10" r="3" />
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
          </svg>
        </div>
        <div
          className="w-0.5 h-2 bg-[#09268E]"
          style={{ marginTop: "-1px" }}
        />

        {/* Remove button */}
        {hover && (
          <button
            type="button"
            className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600 transition-colors cursor-pointer z-30"
            onClick={(e) => { e.stopPropagation(); onRemove(); }}
          >
            <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}
