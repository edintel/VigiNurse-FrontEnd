"use client";
import { useState } from "react";
import dynamic from "next/dynamic";

const AreasConGatewaysTab = dynamic(
  () => import("@/features/administration/areasYZonas/components/tabs/AreasConGatewaysTab"),
  { ssr: false }
);
const ZonasConGatewaysTab = dynamic(
  () => import("@/features/administration/areasYZonas/components/tabs/ZonasConGatewaysTab"),
  { ssr: false }
);
const GatewaysBleAdminTab = dynamic(
  () => import("@/features/administration/areasYZonas/components/tabs/GatewaysBleAdminTab"),
  { ssr: false }
);

type SubTab = "areas" | "zonas" | "gateways";

const SUB_TABS: { id: SubTab; label: string }[] = [
  { id: "areas", label: "Áreas" },
  { id: "zonas", label: "Zonas" },
  { id: "gateways", label: "Gateways BLE" },
];

export default function AreasYZonasPage() {
  const [activeTab, setActiveTab] = useState<SubTab>("areas");

  return (
    <div className="space-y-5">
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

      {activeTab === "areas" && <AreasConGatewaysTab />}
      {activeTab === "zonas" && <ZonasConGatewaysTab />}
      {activeTab === "gateways" && <GatewaysBleAdminTab />}
    </div>
  );
}
