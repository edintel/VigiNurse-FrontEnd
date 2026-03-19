"use client";
import { useState } from "react";
import UsersPage from "@/features/users/components/UsersPage";
import AuditPage from "@/features/audit/components/AuditPage";
import HospitalsPage from "@/features/hospitals/components/HospitalsPage";
import EspecialidadesPage from "@/features/especialidades/components/EspecialidadesPage";
import AreasPage from "@/features/areas/components/AreasPage";
import { useAppSelector } from "@/store/hooks";
import { selectCurrentRole } from "@/store/slices/authSlice";
type ActiveTab = "usuarios" | "especialidades" | "auditoria" | "hospitales" | "areas";
const BASE_TABS: {
    id: ActiveTab;
    label: string;
}[] = [
    { id: "usuarios", label: "Gestión de Usuarios" },
    { id: "especialidades", label: "Especialidades" },
    { id: "areas", label: "Áreas" },
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
        if (t.id === "hospitales")
            return isSuperAdmin;
        if (t.id === "especialidades")
            return isAdmin;
        if (t.id === "areas")
            return isAdmin;
        return true;
    });
    return (<div className="py-6 px-8 xl:px-12 space-y-6">
      
      <div className="pb-5">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-9 h-9 rounded-lg bg-[#1A2B5E] flex items-center justify-center flex-shrink-0">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
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

      
      <div className="flex gap-1 border-b border-[#D1D9E6]">
        {tabs.map((tab) => (<button key={tab.id} type="button" onClick={() => setActiveTab(tab.id)} className={[
                "px-5 py-3 text-base font-semibold transition-colors -mb-px border-b-2",
                activeTab === tab.id
                    ? "text-[#09268E] border-[#09268E]"
                    : "text-slate-500 border-transparent hover:text-[#1A2B5E] hover:border-slate-300",
            ].join(" ")}>
            {tab.label}
          </button>))}
      </div>

      
      {activeTab === "usuarios" && <UsersPage />}
      {activeTab === "especialidades" && isAdmin && <EspecialidadesPage />}
      {activeTab === "areas" && isAdmin && <AreasPage />}
      {activeTab === "hospitales" && isSuperAdmin && <HospitalsPage />}
      {activeTab === "auditoria" && <AuditPage />}
    </div>);
}
