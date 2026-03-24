import type { Metadata } from "next";
import AssetsPage from "@/features/assets-managment/inventory/components/AssetsPage";

export const metadata: Metadata = { title: "Gestión de Activos" };

// Muestra la pagina de inventario y gestión de activos médicos.
export default function AssetsManagementPage() {
    return <AssetsPage />;
}
