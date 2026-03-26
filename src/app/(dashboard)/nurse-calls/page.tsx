import type { Metadata } from "next";
export const metadata: Metadata = { title: "Llamadas de Enfermería" };
// Muestra la pagina de enfermeria llamados.
export default function NurseCallsPage() {
    return <h1 className="text-2xl font-semibold">Llamadas de Enfermería</h1>;
}
