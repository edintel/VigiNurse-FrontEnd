"use client";
import { useState } from "react";
import UsersPage from "@/features/administration/users/components/UsersPage";
import AuditPage from "@/features/administration/audit/components/AuditPage";
import HospitalsPage from "@/features/administration/hospitals/components/HospitalsPage";
import SpecialtiesPage from "@/features/administration/specialties/components/SpecialtiesPage";
import AreasAndZonesPage from "@/features/administration/areasAndZones/components/AreasAndZonesPage";
import MedicationsPage from "@/features/administration/medications/components/MedicationsPage";
import AssetTypesPage from "@/features/administration/assetTypes/components/AssetTypesPage";
import VitalSignsPage from "@/features/administration/vitalSigns/components/VitalSignsPage";
import HospitalFloorPlansAdminTab from "@/features/administration/hospitalFloorPlans/components/HospitalFloorPlansAdminTab";
import { useAppSelector } from "@/store/hooks";
import { selectCurrentRole } from "@/store/slices/authSlice";

type ActiveTab =
  | "usuarios"
  | "specialties"
  | "auditoria"
  | "hospitales"
  | "areasAndZones"
  | "medications"
  | "tiposActivos"
  | "vitalSigns"
  | "hospitalFloorPlans";

const BASE_TABS: { id: ActiveTab; label: string }[] = [
  { id: "usuarios", label: "Gestión de Usuarios" },
  { id: "specialties", label: "Especialidades" },
  { id: "areasAndZones", label: "Áreas y Zonas" },
  { id: "hospitalFloorPlans", label: "Planos del Hospital" },
  { id: "medications", label: "Medicamentos" },
  { id: "tiposActivos", label: "Tipos de Activos" },
  { id: "vitalSigns", label: "Signos Vitales" },
  { id: "hospitales", label: "Hospitales" },
  { id: "auditoria", label: "Auditoría" },
];

// Muestra la pagina de administracion.
export default function AdministracionPage() {
  const [activeTab, setActiveTab] = useState<ActiveTab>("usuarios");
  const role = useAppSelector(selectCurrentRole);
  const isSuperAdmin = role === "SUPER_ADMIN";
  const isAdmin = role === "ADMIN";

  const tabs = BASE_TABS.filter((t) => {
    if (t.id === "hospitales") return isSuperAdmin;
    if (t.id === "specialties") return isAdmin;
    if (t.id === "areasAndZones") return isAdmin;
    if (t.id === "medications") return isAdmin;
    if (t.id === "tiposActivos") return isAdmin;
    if (t.id === "vitalSigns") return isAdmin;
    if (t.id === "hospitalFloorPlans") return isAdmin || isSuperAdmin;
    return true;
  });

  return (
    <div className="py-6 px-8 xl:px-12 space-y-6">
      <div className="pb-5">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-9 h-9 rounded-lg bg-[#1A2B5E] flex items-center justify-center flex-shrink-0">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[#1A2B5E] leading-tight">
              Administración
            </h1>
            <p className="text-sm text-slate-500">
              Gestiona usuarios, hospitales y revisa los registros de auditoría
              del sistema.
            </p>
          </div>
        </div>
      </div>

      <div className="flex gap-1 border-b border-[#D1D9E6] overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={[
              "px-5 py-3 text-base font-semibold transition-colors -mb-px border-b-2 whitespace-nowrap",
              activeTab === tab.id
                ? "text-[#09268E] border-[#09268E]"
                : "text-slate-500 border-transparent hover:text-[#1A2B5E] hover:border-slate-300",
            ].join(" ")}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "usuarios" && <UsersPage />}
      {activeTab === "specialties" && isAdmin && <SpecialtiesPage />}
      {activeTab === "areasAndZones" && isAdmin && <AreasAndZonesPage />}
      {activeTab === "medications" && isAdmin && <MedicationsPage />}
      {activeTab === "tiposActivos" && isAdmin && <AssetTypesPage />}
      {activeTab === "vitalSigns" && isAdmin && <VitalSignsPage />}
      {activeTab === "hospitalFloorPlans" && (isAdmin || isSuperAdmin) && <HospitalFloorPlansAdminTab />}
      {activeTab === "hospitales" && isSuperAdmin && <HospitalsPage />}
      {activeTab === "auditoria" && <AuditPage />}
    </div>
  );
}
