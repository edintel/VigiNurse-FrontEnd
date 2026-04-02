import type { Metadata } from "next";
import PatientsPage from "@/features/patients/components/pacientes/PatientsPage";

export const metadata: Metadata = { title: "Gestión de Pacientes" };

// Muestra la página de gestión de pacientes.
export default function PatientsRoute() {
  return <PatientsPage />;
}
