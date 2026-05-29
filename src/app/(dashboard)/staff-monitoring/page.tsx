import type { Metadata } from "next";
import MedicalStaffPage from "@/features/staff-monitoring/components/MedicalStaffPage";

export const metadata: Metadata = { title: "Monitoreo de Personal" };

export default function StaffMonitoringPage() {
  return <MedicalStaffPage />;
}
