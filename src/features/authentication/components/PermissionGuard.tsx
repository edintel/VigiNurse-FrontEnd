"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAppSelector } from "@/store/hooks";
import {
  selectIsAuthenticated,
  selectSessionRestored,
  selectPermissions,
} from "@/store/slices/authSlice";
interface PermissionGuardProps {
  permission: string;
  redirectTo?: string;
  children: React.ReactNode;
}
// Componente que protege rutas basadas en permisos. Si el usuario no tiene el permiso requerido, se redirige a la ruta especificada.
export function PermissionGuard({
  permission,
  redirectTo = "/dashboard",
  children,
}: PermissionGuardProps) {
  const router = useRouter();
  const sessionRestored = useAppSelector(selectSessionRestored);
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const permissions = useAppSelector(selectPermissions);
  const hasPermission = permissions.includes(permission);
  useEffect(() => {
    if (sessionRestored && isAuthenticated && !hasPermission) {
      router.replace(redirectTo);
    }
  }, [sessionRestored, isAuthenticated, hasPermission, redirectTo, router]);
  if (!sessionRestored || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <span className="loading loading-spinner loading-lg text-[#09268E]" />
      </div>
    );
  }
  if (!hasPermission) {
    return null;
  }
  return <>{children}</>;
}
