import type { Metadata } from "next";
import PersonalMedicoPage from "@/features/staff-monitoring/components/PersonalMedicoPage";

export const metadata: Metadata = { title: "Monitoreo de Personal" };

export default function StaffMonitoringPage() {
  return <PersonalMedicoPage />;
}
