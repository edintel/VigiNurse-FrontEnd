"use client";
import { useState } from "react";
import dynamic from "next/dynamic";

// Importacion dinamica de los tabs para evitar cargar componentes innecesarios en el servidor y mejorar el rendimiento de la página.
const AreasWithGatewaysTab = dynamic(
  () => import("@/features/administration/areasAndZones/components/tabs/AreasWithGatewaysTab"),
  { ssr: false }
);
const ZonesWithGatewaysTab = dynamic(
  () => import("@/features/administration/areasAndZones/components/tabs/ZonesWithGatewaysTab"),
  { ssr: false }
);
const GatewaysBleAdminTab = dynamic(
  () => import("@/features/administration/areasAndZones/components/tabs/GatewaysBleAdminTab"),
  { ssr: false }
);

// Definición de los sub-tabs disponibles en la página de administración de áreas y zonas, 
// cada uno con su identificador y etiqueta correspondiente.
type SubTab = "areas" | "zonas" | "gateways";

const SUB_TABS: { id: SubTab; label: string }[] = [
  { id: "areas", label: "Áreas" },
  { id: "zonas", label: "Zonas" },
  { id: "gateways", label: "Gateways BLE" },
];

// Componente principal de la página de administración de áreas y zonas, 
// que maneja la navegación entre los diferentes sub-tabs y renderiza el contenido correspondiente a cada uno.
export default function AreasAndZonesPage() {
  const [activeTab, setActiveTab] = useState<SubTab>("areas");

  return (
    <div className="space-y-2">
      <div className="flex gap-0.5 border-b border-[#e2e8f0]">
        {SUB_TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={[
              "px-4 py-2.5 text-sm font-semibold transition-colors -mb-px border-b-2 whitespace-nowrap",
              activeTab === tab.id
                ? "text-[#09268E] border-[#09268E]"
                : "text-slate-500 border-transparent hover:text-[#1A2B5E] hover:border-slate-300",
            ].join(" ")}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "areas" && <AreasWithGatewaysTab />}
      {activeTab === "zonas" && <ZonesWithGatewaysTab />}
      {activeTab === "gateways" && <GatewaysBleAdminTab />}
    </div>
  );
}
