import type { Metadata } from "next";
import { Montserrat } from "next/font/google";
import { BrandPanel } from "@/features/authentication/components/BrandPanel";
import { AuthSlidePanel } from "@/features/authentication/components/AuthSlidePanel";
const montserrat = Montserrat({
    subsets: ["latin"],
    weight: ["400", "500", "600", "700"],
});
export const metadata: Metadata = {
    title: "Iniciar sesión",
};
// Muestra la pagina de inicio de sesion.
export default function LoginPage() {
    return (<main className={`${montserrat.className} flex min-h-screen w-full`} style={{ backgroundColor: "#f9fafb" }}>
      
      <BrandPanel />

      
      <AuthSlidePanel />
    </main>);
}
