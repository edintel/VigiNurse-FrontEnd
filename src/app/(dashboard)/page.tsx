import type { Metadata } from "next";
export const metadata: Metadata = {
    title: "Dashboard",
};
// Muestra la pagina de tablero.
export default function DashboardPage() {
    return (<div>
      <h1 className="text-2xl font-semibold">Dashboard</h1>
    </div>);
}
