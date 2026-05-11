"use client";
import { useMemo, useState } from "react";
import { useHasPermission } from "@/lib/hasPermission";
import ActivePatientsPage from "@/features/patients/components/patients/ActivePatientsPage";
import PatientsListPage from "@/features/patients/components/patients/PatientsListPage";

type ActiveTab = "atencion" | "registro";

const TABS: { id: ActiveTab; label: string }[] = [
  { id: "atencion", label: "Pacientes en Atención" },
  { id: "registro", label: "Registro de Pacientes" },
];

// Página principal de gestión de pacientes con pestañas.
export default function PatientsPage() {
  const canViewEpisodes = useHasPermission("patients.episodesView");
  const tabs = useMemo(
    () => TABS.filter((tab) => tab.id !== "atencion" || canViewEpisodes),
    [canViewEpisodes],
  );
  const [activeTab, setActiveTab] = useState<ActiveTab>("atencion");
  const effectiveTab: ActiveTab =
    !canViewEpisodes && activeTab === "atencion" ? "registro" : activeTab;

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
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[#1A2B5E] leading-tight">
              Gestión de Pacientes
            </h1>
            <p className="text-sm text-slate-500">
              Registro y seguimiento centralizado de pacientes.
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-[#D1D9E6]">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={[
              "px-5 py-3 text-base font-semibold transition-colors -mb-px border-b-2",
              effectiveTab === tab.id
                ? "text-[#09268E] border-[#09268E]"
                : "text-slate-500 border-transparent hover:text-[#1A2B5E] hover:border-slate-300",
            ].join(" ")}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Contenido de la tab activa */}
      {effectiveTab === "atencion" && canViewEpisodes && <ActivePatientsPage />}
      {effectiveTab === "registro" && <PatientsListPage />}
    </div>
  );
}
