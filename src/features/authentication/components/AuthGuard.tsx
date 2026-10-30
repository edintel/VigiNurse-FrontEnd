"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  logout,
  selectCurrentRole,
  selectIsAuthenticated,
  selectSessionRestored,
} from "@/store/slices/authSlice";
import { clearSession } from "@/lib/session";
import { logoutRequest } from "@/features/authentication/services/authService";
interface AuthGuardProps {
  children: React.ReactNode;
}
// Componente que protege las rutas que requieren autenticación
export function AuthGuard({ children }: AuthGuardProps) {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const sessionRestored = useAppSelector(selectSessionRestored);
  const esPaciente = useAppSelector(selectCurrentRole) === "PACIENTE";
  useEffect(() => {
    if (!sessionRestored) return;
    // Los pacientes usan VigiCare: una sesión de paciente guardada en este navegador
    // (de antes de que se los rechazara en el login) se cierra.
    if (isAuthenticated && esPaciente) {
      void logoutRequest();
      clearSession();
      dispatch(logout());
      return;
    }
    if (!isAuthenticated) {
      router.replace("/login");
    }
  }, [isAuthenticated, sessionRestored, esPaciente, router, dispatch]);
  if (!sessionRestored || !isAuthenticated || esPaciente) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <span className="loading loading-spinner loading-lg text-[#09268E]" />
      </div>
    );
  }
  return <>{children}</>;
}
