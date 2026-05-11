import type { Metadata } from "next";
import BabiesPage from "@/features/baby-monitoring/components/BabiesPage";

export const metadata: Metadata = { title: "Control de Bebés" };

export default function BabyMonitoringPage() {
  return <BabiesPage />;
}
