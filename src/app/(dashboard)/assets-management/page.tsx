import type { Metadata } from "next";
export const metadata: Metadata = { title: "Gestión de Activos" };
// Muestra la pagina de assets management.
export default function AssetsManagementPage() {
    return <h1 className="text-2xl font-semibold">Gestión de Activos</h1>;
}
