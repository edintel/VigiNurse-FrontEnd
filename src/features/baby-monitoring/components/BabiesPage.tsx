"use client";
import { useState } from "react";
import dynamic from "next/dynamic";
import BabiesListPage from "@/features/baby-monitoring/components/BabiesListPage";
import BraceletsPage from "@/features/baby-monitoring/components/BraceletsPage";

const GlobalBleAlertsTab = dynamic(
  () => import("@/features/baby-monitoring/components/alerts/GlobalBleAlertsTab"),
  { ssr: false }
);

type Tab = "neonatos" | "brazaletes" | "alertas";

const TABS: { id: Tab; label: string }[] = [
  { id: "neonatos", label: "Neonatos" },
  { id: "brazaletes", label: "Brazaletes" },
  { id: "alertas", label: "Alertas" },
];

// Componente principal de la página de gestión de neonatos
export default function BabiesPage() {
  const [activeTab, setActiveTab] = useState<Tab>("neonatos");

  return (
    <div className="py-6 px-8 xl:px-12 space-y-6">
      {/* Encabezado */}
      <div className="pb-2">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-9 h-9 rounded-lg bg-[#1A2B5E] flex items-center justify-center flex-shrink-0">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#fff"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M9 12h.01" />
              <path d="M15 12h.01" />
              <path d="M10 16c.5.3 1.2.5 2 .5s1.5-.2 2-.5" />
              <path d="M19 6.3a9 9 0 0 1 1.8 3.9 2 2 0 0 1 0 3.6 9 9 0 0 1-17.6 0 2 2 0 0 1 0-3.6A9 9 0 0 1 12 3c2 0 3.5 1.1 3.5 2.5s-.9 2.5-2 2.5c-.8 0-1.5-.4-1.5-1" />
            </svg>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[#1A2B5E] leading-tight">
              Gestión de Neonatos
            </h1>
            <p className="text-sm text-slate-500">
              Registro y seguimiento de recién nacidos internados.
            </p>
          </div>
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex gap-0 border-b border-[#D1D9E6] -mt-2">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={[
              "px-5 py-3 text-sm font-semibold transition-colors -mb-px border-b-2 whitespace-nowrap",
              activeTab === tab.id
                ? "text-[#09268E] border-[#09268E]"
                : "text-slate-500 border-transparent hover:text-[#1A2B5E] hover:border-slate-300",
            ].join(" ")}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Contenido */}
      {activeTab === "neonatos" && <BabiesListPage />}
      {activeTab === "brazaletes" && <BraceletsPage />}
      {activeTab === "alertas" && <GlobalBleAlertsTab />}
    </div>
  );
}
