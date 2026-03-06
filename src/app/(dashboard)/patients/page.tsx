import type { Metadata } from "next";

export const metadata: Metadata = { title: "Pacientes" };

export default function PatientsPage() {
  return <h1 className="text-2xl font-semibold">Pacientes</h1>;
}
