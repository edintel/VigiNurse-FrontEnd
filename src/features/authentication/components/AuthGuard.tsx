"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAppSelector } from "@/store/hooks";
import {
  selectIsAuthenticated,
  selectSessionRestored,
} from "@/store/slices/authSlice";
interface AuthGuardProps {
  children: React.ReactNode;
}
// Componente que protege las rutas que requieren autenticación
export function AuthGuard({ children }: AuthGuardProps) {
  const router = useRouter();
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const sessionRestored = useAppSelector(selectSessionRestored);
  useEffect(() => {
    if (sessionRestored && !isAuthenticated) {
      router.replace("/login");
    }
  }, [isAuthenticated, sessionRestored, router]);
  if (!sessionRestored || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <span className="loading loading-spinner loading-lg text-[#09268E]" />
      </div>
    );
  }
  return <>{children}</>;
}
