import type { Metadata } from "next";
import { Montserrat } from "next/font/google";
import { AppProviders } from "@/providers/AppProviders";
import "./globals.css";
const montserrat = Montserrat({
    subsets: ["latin"],
    weight: ["400", "500", "600", "700"],
    variable: "--font-montserrat",
});
export const metadata: Metadata = {
    title: {
        default: "VigiNurse - Edintel",
        template: "%s | VigiNurse - Edintel",
    },
    description: "Sistema de monitoreo hospitalario inteligente",
    icons: {
        icon: "/FaviconLogo.png",
    },
};
// Muestra el componente de root layout.
export default function RootLayout({ children, }: Readonly<{
    children: React.ReactNode;
}>) {
    return (<html lang="es" data-theme="light">
      <body className={`${montserrat.variable} antialiased bg-slate-50 text-slate-900`}>
          <AppProviders>{children}</AppProviders>
        </body>
    </html>);
}
