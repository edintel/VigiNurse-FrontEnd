import type { Metadata } from "next";
import { MonitorsView } from "@/features/vitals-monitoring/components/MonitorsView";

export const metadata: Metadata = { title: "Monitores de Pacientes" };

export default function VitalsMonitoringPage() {
  return (
    <div className="py-6 px-8 xl:px-12">
      <MonitorsView />
    </div>
  );
}
