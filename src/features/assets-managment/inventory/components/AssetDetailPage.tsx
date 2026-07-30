"use client";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useHasPermission } from "@/lib/hasPermission";
import {
  getAssetById,
  getAssetQrBlob,
} from "@/features/assets-managment/inventory/services/assetService";
import { EditAssetModal } from "@/features/assets-managment/inventory/components/EditAssetModal";
import { RetireAssetModal } from "@/features/assets-managment/inventory/components/RetireAssetModal";
import MaintenanceAssetsPage from "@/features/assets-managment/maintenance/components/AssetsPage";
import { BleLocationCard } from "@/features/assets-managment/tracking/components/BleLocationCard";
import { AssetFloorPlanMap } from "@/features/assets-managment/tracking/components/AssetFloorPlanMap";
import { ActivoEstado } from "@/features/assets-managment/inventory/types";
import type { Activo } from "@/features/assets-managment/inventory/types";

interface AssetDetailPageProps {
  id: number;
}

// Formatea una fecha ISO a "DD / MM / YYYY". Si la fecha es nula o inválida, devuelve "—".
function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  const day = String(d.getUTCDate()).padStart(2, "0");
  const month = String(d.getUTCMonth() + 1).padStart(2, "0");
  const year = d.getUTCFullYear();
  return `${day} / ${month} / ${year}`;
}

// Mapea el estado del activo a estilos y etiquetas predefinidas.
function StatusBadge({ estado }: { estado: ActivoEstado }) {
  const configs: Record<
    ActivoEstado,
    { bg: string; border: string; text: string; label: string }
  > = {
    [ActivoEstado.Disponible]: {
      bg: "bg-[rgba(0,211,144,0.1)]",
      border: "border-[rgba(0,211,144,0.2)]",
      text: "text-[#00d390]",
      label: "Disponible",
    },
    [ActivoEstado.Mantenimiento]: {
      bg: "bg-[rgba(252,188,19,0.1)]",
      border: "border-[rgba(252,188,19,0.2)]",
      text: "text-[#fcbc13]",
      label: "Mantenimiento",
    },
    [ActivoEstado.Retirado]: {
      bg: "bg-red-50",
      border: "border-red-200",
      text: "text-red-500",
      label: "Retirado",
    },
  };
  const c = configs[estado] ?? configs[ActivoEstado.Disponible];
  return (
    <span
      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold uppercase border ${c.bg} ${c.border} ${c.text}`}
    >
      {c.label}
    </span>
  );
}

// Componente para mostrar un campo de información con su etiqueta. Se usa para mostrar pares clave-valor en las tarjetas de detalles.
function InfoField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[10px] font-semibold uppercase tracking-[0.5px] text-slate-500">
        {label}
      </span>
      <div className="text-sm font-semibold text-[#0f172a]">{children}</div>
    </div>
  );
}

// Componente para mostrar el ícono de cada sección en las tarjetas de detalles. Solo aplica estilos de color y tamaño, el ícono se pasa como hijo.
function SectionIcon({ children }: { children: React.ReactNode }) {
  return <span className="shrink-0 text-[#09268E]">{children}</span>;
}

const TABS = [
  { id: "info", label: "Información General", active: true },
  { id: "mantenimientos", label: "Mantenimientos", active: true },
];

// Página de detalles de un activo específico. Muestra información detallada, código QR, historial de mantenimientos y permite editar o retirar el activo.
export default function AssetDetailPage({ id }: AssetDetailPageProps) {
  const router = useRouter();
  const canEdit = useHasPermission("assetsManagement.edit");
  const canRetire = useHasPermission("assetsManagement.retire");
  const canPlanMaintenance = useHasPermission("assetsManagement.maintenancePlan");
  const canExecuteMaintenance = useHasPermission("assetsManagement.maintenanceExecute");
  const [activo, setActivo] = useState<Activo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [qrUrl, setQrUrl] = useState<string | null>(null);
  const [showEdit, setShowEdit] = useState(false);
  const [showRetirar, setShowRetirar] = useState(false);
  const [activeTab, setActiveTab] = useState("info");

  const fetchAsset = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getAssetById(id);
      setActivo(data);
    } catch {
      setError("No se pudo cargar la información del activo.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void fetchAsset();
  }, [fetchAsset]);

  // Carga la imagen QR como blob: al pedirla por axios viaja la cookie de sesión,
  // cosa que no ocurriría con un <img src> apuntando directo al endpoint.
  useEffect(() => {
    let objectUrl: string | null = null;
    getAssetQrBlob(id)
      .then((blob) => {
        objectUrl = URL.createObjectURL(blob);
        setQrUrl(objectUrl);
      })
      .catch(() => {
        setQrUrl(null);
      });
    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [id]);

  function handleAssetUpdated(updated: Activo) {
    setActivo(updated);
    setShowEdit(false);
  }

  function handleAssetRetired() {
    setActivo((prev) =>
      prev
        ? { ...prev, estado: ActivoEstado.Retirado, estadoNombre: "Retirado" }
        : prev,
    );
    setShowRetirar(false);
    setActiveTab("info");
    // Recarga para obtener motivo, retiradoPor y fechaRetiro del servidor.
    void fetchAsset();
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <span className="loading loading-spinner loading-lg text-[#09268E]" />
      </div>
    );
  }

  if (error || !activo) {
    return (
      <div className="py-6 px-8 xl:px-12">
        <div role="alert" className="alert alert-error text-sm max-w-md">
          <span>{error ?? "Activo no encontrado."}</span>
          <button
            className="btn btn-xs btn-ghost"
            onClick={() => void fetchAsset()}
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  const isRetirado = activo.estado === ActivoEstado.Retirado;

  return (
    <div className="flex flex-col min-h-full animate-slide-in-right">
      {/* Sub-header: volver al inventario */}
      <div className="bg-white border-b border-[#E2E8F0] px-8 xl:px-12 h-16 flex items-center gap-4 shrink-0">
        <button
          type="button"
          className="flex items-center gap-2 text-slate-500 hover:text-[#09268E] transition-colors text-xs font-semibold uppercase tracking-[0.6px]"
          onClick={() => router.push("/assets-management")}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth="2"
            stroke="currentColor"
            className="size-3"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18"
            />
          </svg>
          Volver al Inventario
        </button>
        <div className="h-6 w-px bg-[#E2E8F0]" />
      </div>

      {/* Contenido principal */}
      <div className="py-6 px-8 xl:px-12 space-y-6">
        {/* Título y acciones */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-4xl font-bold text-black tracking-tight font-[var(--font-montserrat)]">
              {activo.numeroSerie}
            </h1>
            <StatusBadge estado={activo.estado} />
            {activo.esCritico && (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="size-5 text-red-500 shrink-0"
              >
                <path
                  fillRule="evenodd"
                  d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.006 5.404.434c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.434 2.082-5.005Z"
                  clipRule="evenodd"
                />
              </svg>
            )}
          </div>
          {!isRetirado && canEdit && (
            <button
              type="button"
              className="btn text-white flex items-center gap-2"
              style={{ backgroundColor: "#09268E", borderColor: "#09268E" }}
              onClick={() => setShowEdit(true)}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="2.5"
                stroke="currentColor"
                className="size-[1em]"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Z"
                />
              </svg>
              Editar Ficha
            </button>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 border-b border-[#E2E8F0]">
          {TABS.filter((tab) => !isRetirado || tab.id === "info").map((tab) => (
            <button
              key={tab.id}
              type="button"
              disabled={!tab.active}
              onClick={() => tab.active && setActiveTab(tab.id)}
              className={[
                "px-6 py-3 text-sm font-semibold transition-colors -mb-px border-b-2",
                !tab.active
                  ? "text-slate-400 border-transparent cursor-not-allowed"
                  : activeTab === tab.id
                    ? "text-[#09268E] border-[#09268E]"
                    : "text-slate-500 border-transparent hover:text-[#09268E]",
              ].join(" ")}
              title={tab.active ? undefined : "Próximamente disponible"}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Contenido tab Mantenimientos */}
        {activeTab === "mantenimientos" && (
          <MaintenanceAssetsPage activoId={id} canPlan={canPlanMaintenance} canExecute={canExecuteMaintenance} />
        )}

        {/* Contenido tab Información General */}
        {activeTab === "info" && (
          <div className="flex flex-col gap-6">
              {/* Fila superior: Especificaciones + Identificación Digital */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Card: Especificaciones */}
                <div className="bg-white border border-[#E2E8F0] rounded-xl shadow-sm p-6 flex flex-col gap-6">
                  <div className="flex items-center gap-2">
                    <SectionIcon>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth="1.5"
                        stroke="currentColor"
                        className="size-5"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
                        />
                      </svg>
                    </SectionIcon>
                    <h3 className="text-xs font-bold uppercase tracking-[0.7px] text-[#09268E]">
                      Especificaciones
                    </h3>
                  </div>
                  <div className="grid grid-cols-2 gap-x-6 gap-y-5">
                    <InfoField label="S/N">
                      <span className="font-mono">{activo.numeroSerie}</span>
                    </InfoField>
                    <InfoField label="Tipo de Activo">
                      {activo.tipoActivoNombre}
                    </InfoField>
                    <InfoField label="Marca">{activo.marca}</InfoField>
                    <InfoField label="Modelo">{activo.modelo}</InfoField>
                    <InfoField label="Estado">{activo.estadoNombre}</InfoField>
                    <InfoField label="Criticidad">
                      {activo.esCritico ? "Alta" : "Normal"}
                    </InfoField>
                    {activo.esCritico && (
                      <>
                        <InfoField label="Registrado por">
                          {activo.nombreCreador ?? "—"}
                        </InfoField>
                        <InfoField label="Fecha de Creación">
                          {formatDate(activo.fechaCreacion)}
                        </InfoField>
                      </>
                    )}
                  </div>
                </div>

                {/* Card: Identificación Digital */}
                <div className="bg-white border border-[#E2E8F0] rounded-xl shadow-sm p-6 flex flex-col gap-6">
                  <div className="flex items-center gap-2">
                    <SectionIcon>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth="1.5"
                        stroke="currentColor"
                        className="size-5"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0 1 3.75 9.375v-4.5ZM3.75 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 0 1-1.125-1.125v-4.5ZM13.5 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0 1 13.5 9.375v-4.5Z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M6.75 6.75h.75v.75h-.75v-.75ZM6.75 16.5h.75v.75h-.75v-.75ZM16.5 6.75h.75v.75h-.75v-.75ZM13.5 13.5h.75v.75h-.75v-.75ZM13.5 19.5h.75v.75h-.75v-.75ZM19.5 13.5h.75v.75h-.75v-.75ZM19.5 19.5h.75v.75h-.75v-.75ZM16.5 16.5h.75v.75h-.75v-.75Z"
                        />
                      </svg>
                    </SectionIcon>
                    <h3 className="text-xs font-bold uppercase tracking-[0.7px] text-[#09268E]">
                      Identificación Digital
                    </h3>
                  </div>

                  <div className="flex flex-col items-center gap-4">
                    {/* QR Image */}
                    <div className="bg-[#F1F5F9] border-2 border-dashed border-[#CBD5E1] rounded p-1 size-32 flex items-center justify-center">
                      {qrUrl ? (
                        <img
                          src={qrUrl}
                          alt="Código QR del activo"
                          className="size-full object-contain"
                        />
                      ) : (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth="1"
                          stroke="currentColor"
                          className="size-10 text-slate-300"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0 1 3.75 9.375v-4.5ZM3.75 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 0 1-1.125-1.125v-4.5ZM13.5 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0 1 13.5 9.375v-4.5Z"
                          />
                        </svg>
                      )}
                    </div>

                  
                  </div>
                </div>
              </div>

              {/* Card: Localización — BLE para activos críticos, clásica para el resto */}
              {activo.esCritico ? (
                <BleLocationCard activoId={activo.id} canEdit={canEdit} />
              ) : (
                <div className="bg-white border border-[#E2E8F0] rounded-xl shadow-sm p-6 flex flex-col gap-6">
                  <div className="flex items-center gap-2">
                    <SectionIcon>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth="1.5"
                        stroke="currentColor"
                        className="size-5"
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
                    </SectionIcon>
                    <h3 className="text-xs font-bold uppercase tracking-[0.7px] text-[#09268E]">
                      Ubicación y Origen
                    </h3>
                  </div>
                  <div className="grid grid-cols-3 gap-6">
                    <InfoField label="Área Actual">
                      <div className="flex items-center gap-2">
                        <span className="size-2 rounded-full bg-blue-500 shrink-0" />
                        {activo.areaNombre}
                      </div>
                    </InfoField>
                    <InfoField label="Ingresado por">
                      {activo.nombreCreador}
                    </InfoField>
                    <InfoField label="Fecha de Creación">
                      {formatDate(activo.fechaCreacion)}
                    </InfoField>
                  </div>
                  <AssetFloorPlanMap areaId={activo.areaId} activoId={activo.id} areaName={activo.areaNombre} />
                </div>
              )}

              {/* Card: Retiro de Activo */}
              <div className="bg-[rgba(254,242,242,0.5)] border-2 border-[#fecaca] rounded-xl p-6 flex flex-col gap-6">
                <div className="flex items-center gap-2">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth="1.5"
                    stroke="currentColor"
                    className="size-[18px] text-red-600 shrink-0"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
                    />
                  </svg>
                  <h3 className="text-xs font-bold uppercase tracking-[0.7px] text-red-600">
                    Retiro de Activo
                  </h3>
                </div>

                {isRetirado ? (
                  <div className="grid grid-cols-3 gap-6">
                    <InfoField label="Motivo del Retiro">
                      {activo.motivoRetiro}
                    </InfoField>
                    <InfoField label="Retirado por">
                      {activo.nombreRetiro}
                    </InfoField>
                    <InfoField label="Fecha de Retiro">
                      {formatDate(activo.fechaRetiro)}
                    </InfoField>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-slate-500">
                      Este activo no ha sido retirado.
                    </p>
                    {canRetire && (
                    <button
                      type="button"
                      className="btn btn-sm text-white"
                      style={{
                        backgroundColor: "#dc2626",
                        borderColor: "#dc2626",
                      }}
                      onClick={() => setShowRetirar(true)}
                    >
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
                          d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z"
                        />
                      </svg>
                      Registrar Retiro
                    </button>
                    )}
                  </div>
                )}
              </div>
          </div>
        )}
      </div>

      {/* Modales */}
      <EditAssetModal
        open={showEdit}
        activo={activo}
        onClose={() => setShowEdit(false)}
        onUpdated={handleAssetUpdated}
      />
      <RetireAssetModal
        open={showRetirar}
        activo={activo}
        onClose={() => setShowRetirar(false)}
        onRetirado={handleAssetRetired}
      />
    </div>
  );
}
