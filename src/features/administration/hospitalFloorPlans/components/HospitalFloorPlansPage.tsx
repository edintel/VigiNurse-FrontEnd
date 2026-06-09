"use client";
import { useState } from "react";
import dynamic from "next/dynamic";
import { useAppSelector } from "@/store/hooks";
import { selectCurrentUser, selectCurrentRole } from "@/store/slices/authSlice";

const ConfigureFloorPlansTab = dynamic(
  () => import("@/features/administration/hospitalFloorPlans/components/tabs/ConfigureFloorPlansTab"),
  { ssr: false }
);
const FloorPlanMonitoringTab = dynamic(
  () => import("@/features/administration/hospitalFloorPlans/components/tabs/FloorPlanMonitoringTab"),
  { ssr: false }
);

type SubTab = "monitoreo" | "configurar";

// Componente principal de la página de Planos del Hospital
export default function HospitalFloorPlansPage() {
  const currentUser = useAppSelector(selectCurrentUser);
  const role = useAppSelector(selectCurrentRole);
  const isSuperAdmin = role === "SUPER_ADMIN";
  const isAdmin = role === "ADMIN";
  const canConfigure = isSuperAdmin || isAdmin;

  const hospitalId = currentUser?.hospitalId ?? 0;

  const [activeTab, setActiveTab] = useState<SubTab>("monitoreo");

  const tabs: { id: SubTab; label: string }[] = [
    { id: "monitoreo", label: "Monitoreo en tiempo real" },
    ...(canConfigure ? [{ id: "configurar" as SubTab, label: "Configurar planos" }] : []),
  ];

  if (!hospitalId && !isSuperAdmin) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-sm text-slate-500">No tienes un hospital asignado.</p>
      </div>
    );
  }

  return (
    <div className="py-6 px-8 xl:px-12 space-y-6">
      {/* Page header */}
      <div className="pb-1">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-9 h-9 rounded-lg bg-[#1A2B5E] flex items-center justify-center flex-shrink-0">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <path d="M3 9h18M9 21V9" />
            </svg>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[#1A2B5E] leading-tight">
              Planos del Hospital
            </h1>
            <p className="text-sm text-slate-500">
              Visualiza la ubicación de activos médicos en los planos del hospital en tiempo real.
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
              "px-5 py-3 text-base font-semibold transition-colors -mb-px border-b-2 whitespace-nowrap cursor-pointer",
              activeTab === tab.id
                ? "text-[#09268E] border-[#09268E]"
                : "text-slate-500 border-transparent hover:text-[#1A2B5E] hover:border-slate-300",
            ].join(" ")}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {activeTab === "monitoreo" && hospitalId > 0 && (
        <FloorPlanMonitoringTab hospitalId={hospitalId} />
      )}
      {activeTab === "configurar" && canConfigure && hospitalId > 0 && (
        <ConfigureFloorPlansTab hospitalId={hospitalId} isSuperAdmin={isSuperAdmin} />
      )}
    </div>
  );
}
