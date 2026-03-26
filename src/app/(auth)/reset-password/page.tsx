import type { Metadata } from "next";
import { Montserrat } from "next/font/google";
import { BrandPanel } from "@/features/authentication/components/BrandPanel";
import { ResetPasswordContent } from "@/features/authentication/components/ResetPasswordContent";
const montserrat = Montserrat({
    subsets: ["latin"],
    weight: ["400", "500", "600", "700"],
});
export const metadata: Metadata = {
    title: "Restablecer contraseña",
};
// Muestra la pagina de restablecimiento contrasena.
export default async function ResetPasswordPage({ searchParams, }: {
    searchParams: Promise<{
        token?: string;
    }>;
}) {
    const { token } = await searchParams;
    return (<main className={`${montserrat.className} flex min-h-screen w-full`} style={{ backgroundColor: "#f9fafb" }}>
      
      <BrandPanel />

      
      <div className="flex-1 bg-white flex flex-col min-h-screen">
        
        <div className="lg:hidden flex items-center gap-3 px-6 py-4 border-b border-slate-100 shrink-0">
          <div className="flex items-center justify-center rounded-lg p-1.5" style={{ backgroundColor: "#092168" }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5">
              <path d="M8 2H16V8H22V16H16V22H8V16H2V8H8z"/>
            </svg>
          </div>
          <span className="text-lg font-bold text-slate-900" style={{ fontFamily: "Montserrat, sans-serif", letterSpacing: "-0.4px" }}>
            VigiNurse
          </span>
        </div>

        
        <div className="flex-1 flex items-center justify-center p-6 sm:p-12 lg:p-24">
          <ResetPasswordContent token={token ?? ""}/>
        </div>
      </div>
    </main>);
}
