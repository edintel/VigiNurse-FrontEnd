import type { Metadata } from "next";
export const metadata: Metadata = { title: "Monitoreo de Signos Vitales" };
// Muestra la pagina de signos vitales monitoring.
export default function VitalsMonitoringPage() {
    return <h1 className="text-2xl font-semibold">Monitoreo de Signos Vitales</h1>;
}
