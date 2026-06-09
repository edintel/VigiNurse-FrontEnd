"use client";
import { useState } from "react";
import { useHasPermission } from "@/lib/hasPermission";
import dynamic from "next/dynamic";
import InventoryPage from "@/features/assets-managment/inventory/components/InventoryPage";
import MaintenanceCalendarPage from "@/features/assets-managment/maintenance/components/MaintenanceCalendarPage";
import AlertsPage from "@/features/alerts/maintenance/components/AlertsPage";
import TagsBleTab from "@/features/assets-managment/tracking/components/TagsBleTab";

const AssetMapTab = dynamic(
  () => import("@/features/assets-managment/tracking/components/AssetMapTab"),
  { ssr: false }
);

type ActiveTab = "inventario" | "mapa" | "calendar" | "sensores" | "alertas";

const TABS: { id: ActiveTab; label: string }[] = [
  { id: "inventario", label: "Inventario" },
  { id: "mapa", label: "Mapa de Activos" },
  { id: "calendar", label: "Calendario" },
  { id: "sensores", label: "Tags" },
  { id: "alertas", label: "Alertas" },
];

// Página principal de gestión de activos médicos.
export default function AssetsPage() {
  const canViewAlerts = useHasPermission("assetsManagement.alertsView");
  const [activeTab, setActiveTab] = useState<ActiveTab>("inventario");

  return (
    <div className="py-6 px-8 xl:px-12 space-y-6">
      {/* Encabezado */}
      <div className="pb-2">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-9 h-9 rounded-lg bg-[#1A2B5E] flex items-center justify-center flex-shrink-0">
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#fff"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
              <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
              <line x1="12" y1="22.08" x2="12" y2="12" />
            </svg>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[#1A2B5E] leading-tight">
              Inventario de Activos Médicos
            </h1>
            <p className="text-sm text-slate-500">
              Monitoreo y gestión centralizada de equipamiento clínico.
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-[#D1D9E6]">
        {TABS.filter((tab) => (tab.id !== "alertas" && tab.id !== "sensores") || canViewAlerts).map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={[
              "px-5 py-3 text-base font-semibold transition-colors -mb-px border-b-2",
              activeTab === tab.id
                ? "text-[#09268E] border-[#09268E]"
                : "text-slate-500 border-transparent hover:text-[#1A2B5E] hover:border-slate-300",
            ].join(" ")}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Contenido de la tab activa */}
      {activeTab === "inventario" && <InventoryPage />}
      {activeTab === "mapa" && <AssetMapTab />}
      {activeTab === "calendar" && <MaintenanceCalendarPage />}
      {activeTab === "alertas" && <AlertsPage />}
      {activeTab === "sensores" && <TagsBleTab />}
    </div>
  );
}
