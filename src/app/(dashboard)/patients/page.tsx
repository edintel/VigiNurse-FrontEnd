import type { Metadata } from "next";
export const metadata: Metadata = { title: "Pacientes" };
// Muestra la pagina de patients.
export default function PatientsPage() {
    return <h1 className="text-2xl font-semibold">Pacientes</h1>;
}
