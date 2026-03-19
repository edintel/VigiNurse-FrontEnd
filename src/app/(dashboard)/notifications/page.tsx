import type { Metadata } from "next";
export const metadata: Metadata = { title: "Notificaciones" };
// Muestra la pagina de notifications.
export default function NotificationsPage() {
    return <h1 className="text-2xl font-semibold">Notificaciones</h1>;
}
