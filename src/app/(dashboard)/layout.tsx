import { Sidebar } from "@/features/dashboard/components/Sidebar";
import { AuthGuard } from "@/features/authentication/components/AuthGuard";
// Muestra el componente de tablero layout.
export default function DashboardLayout({ children, }: {
    children: React.ReactNode;
}) {
    return (<AuthGuard>
      <div className="flex h-screen overflow-hidden">
        <Sidebar />
        
        <main className="flex-1 min-w-0 h-full overflow-y-auto pt-16 md:pt-0 bg-[#EEEEEE]">
          {children}
        </main>
      </div>
    </AuthGuard>);
}
