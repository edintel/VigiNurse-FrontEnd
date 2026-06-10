"use client";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  logout,
  selectCurrentUser,
  selectPermissions,
} from "@/store/slices/authSlice";
import { clearSession } from "@/lib/session";
import { toast } from "@/lib/toast";
import { ROLES } from "@/constants/roles";
import { NotificationBell } from "@/features/notifications/components/NotificationBell";
import { useBleAlerts } from "@/features/baby-monitoring/context/BleAlertsContext";

// Define los elementos de navegación para la barra lateral.
const NAV_ITEMS: {
  label: string;
  href: string;
  icon: React.ReactNode;
  permission?: string;
  hideForRoles?: string[];
}[] = [
  {
    label: "Inicio",
    href: "/dashboard",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M3 10.5 12 3l9 7.5" />
        <path d="M5 9.5V21h14V9.5" />
        <path d="M10 21v-6h4v6" />
      </svg>
    ),
  },
  {
    label: "Gestión de Pacientes",
    href: "/patients",
    permission: "patients.view",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
  {
    label: "Órdenes Médicas",
    href: "/medical-orders",
    permission: "patients.episodesView",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
        <rect x="9" y="3" width="6" height="4" rx="1" />
        <path d="M9 12h6M9 16h4" />
      </svg>
    ),
  },
  {
    label: "Control de Activos",
    href: "/assets-management",
    permission: "assetsManagement.view",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
        <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
        <line x1="12" y1="22.08" x2="12" y2="12" />
      </svg>
    ),
  },
  {
    label: "Gestión de Neonatos",
    href: "/baby-monitoring",
    permission: "babyMonitoring.view",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M9 12h.01" />
        <path d="M15 12h.01" />
        <path d="M10 16c.5.3 1.2.5 2 .5s1.5-.2 2-.5" />
        <path d="M19 6.3a9 9 0 0 1 1.8 3.9 2 2 0 0 1 0 3.6 9 9 0 0 1-17.6 0 2 2 0 0 1 0-3.6A9 9 0 0 1 12 3c2 0 3.5 1.1 3.5 2.5s-.9 2.5-2 2.5c-.8 0-1.5-.4-1.5-1" />
      </svg>
    ),
  },
  {
    label: "Monitores de Pacientes",
    href: "/vitals-monitoring",
    permission: "vitalsMonitoring.view",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
      </svg>
    ),
  },
  {
    label: "Gestión de Personal",
    href: "/staff-monitoring",
    permission: "staffMonitoring.view",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
        <polyline points="16 11 18 13 22 9" />
      </svg>
    ),
  },
  {
    label: "Administración",
    href: "/administration",
    permission: "users.view",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="-translate-y-0.5"
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      </svg>
    ),
  },
  {
    label: "VigiChat",
    href: "/chat",
    hideForRoles: ["PACIENTE"],
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        <path d="M8 10h8M8 14h5" />
      </svg>
    ),
  },
];
// Da formato a la fecha.
function formatDate(d: Date) {
  return d.toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}
// Da formato al tiempo.
function formatTime(d: Date) {
  return d.toLocaleTimeString("es-ES", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}
// Obtiene los datos iniciales.
function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "US";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}
// Da formato a rol.
function formatRole(role: string): string {
  return ROLES[role.trim().toUpperCase() as keyof typeof ROLES] ?? role;
}
// Muestra el componente de barra lateral.
export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const currentUser = useAppSelector(selectCurrentUser);
  const userPermissions = useAppSelector(selectPermissions);
  const logoutDialogRef = useRef<HTMLDialogElement>(null);
  const [now, setNow] = useState<Date | null>(null);
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { openCount: bleOpenCount } = useBleAlerts();
  const sessionUser = currentUser;
  const userName = sessionUser?.name?.trim() || "Usuario";
  const userRole = sessionUser?.role ? formatRole(sessionUser.role) : "Sin rol";
  const userInitials = getInitials(userName);
  // Maneja cierre de sesion.
  function handleLogoutConfirm() {
    clearSession();
    dispatch(logout());
    toast.info("Sesión cerrada. ¡Hasta pronto!");
    router.replace("/login");
  }
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  return (
    <>
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {!mobileOpen && (
        <button
          aria-label="Abrir menú"
          className="fixed top-4 left-4 z-40 md:hidden flex items-center justify-center w-10 h-10 rounded-lg bg-white border border-slate-200 shadow-sm text-slate-600 hover:bg-slate-50 transition-colors"
          onClick={() => setMobileOpen(true)}
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>
      )}

      <aside
        className={[
          "flex flex-col bg-white border-r border-slate-200 overflow-visible flex-shrink-0",
          "fixed inset-y-0 left-0 z-50 w-64",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
          "md:relative md:inset-auto md:z-30 md:translate-x-0 md:h-screen",
          collapsed ? "md:w-20" : "md:w-64",
          "transition-[width,transform] duration-300 ease-in-out will-change-[width]",
        ].join(" ")}
      >
        <button
          aria-label={collapsed ? "Expandir menú" : "Colapsar menú"}
          title={collapsed ? "Expandir menú" : "Colapsar menú"}
          className={[
            "hidden md:flex absolute right-0 top-12 z-20 h-9 w-9 translate-x-[62%] -translate-y-1/2 items-center justify-center rounded-full",
            "border border-slate-200 bg-white text-[#092168] shadow-[0_8px_18px_rgba(15,23,42,0.14)]",
            "transition-[background-color,color,box-shadow,transform] duration-300 ease-out",
            "hover:-translate-y-1/2 hover:translate-x-[62%] hover:scale-105 hover:border-blue-100 hover:bg-blue-50 hover:text-[#061447] hover:shadow-[0_12px_24px_rgba(9,33,104,0.2)]",
            "active:-translate-y-1/2 active:translate-x-[62%] active:scale-95",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#092168]/30 focus-visible:ring-offset-2",
          ].join(" ")}
          onClick={() => setCollapsed((value) => !value)}
        >
          <svg
            className={[
              "transition-transform duration-300 ease-out",
              collapsed ? "rotate-180" : "rotate-0",
            ].join(" ")}
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>

        <div
          className={[
            "border-b border-slate-100 bg-gradient-to-b from-white to-slate-50/70 py-3 flex flex-col gap-2 flex-shrink-0 transition-[padding] duration-300 ease-in-out",
            collapsed ? "px-0" : "px-4",
          ].join(" ")}
        >
          <div className="flex min-h-16 items-center justify-between gap-3">
            <div
              className={[
                "relative h-16 flex-shrink-0 overflow-hidden transition-[width] duration-300 ease-in-out",
                collapsed ? "w-full" : "w-[190px]",
              ].join(" ")}
            >
              <Image
                src="/Logo-transparent.png"
                alt="VigiNurse"
                width={576}
                height={576}
                priority
                className={[
                  "absolute left-1/2 top-0 h-56 w-56 max-w-none -translate-x-1/2 -translate-y-[78px] object-contain drop-shadow-sm transition-opacity duration-200 ease-in-out",
                  collapsed ? "opacity-0" : "opacity-100",
                ].join(" ")}
              />
              <Image
                src="/LogoSmall.png"
                alt="VigiNurse"
                width={345}
                height={447}
                className={[
                  "absolute left-1/2 top-1/2 h-[60px] w-[46px] -translate-x-1/2 -translate-y-1/2 object-contain drop-shadow-sm transition-opacity duration-200 ease-in-out",
                  collapsed ? "opacity-100" : "opacity-0",
                ].join(" ")}
              />
            </div>
            <div className="flex items-center gap-1 flex-shrink-0 md:hidden">
              <button
                aria-label="Cerrar menú"
                className="md:hidden flex items-center justify-center w-7 h-7 rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
                onClick={() => setMobileOpen(false)}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
          </div>
          <div
            className={[
              "grid min-h-0 transition-[grid-template-rows,opacity] duration-300 ease-in-out",
              collapsed ? "grid-rows-[0fr] opacity-0" : "grid-rows-[1fr] opacity-100",
            ].join(" ")}
          >
            <div className="overflow-hidden">
              <div className="flex min-w-0 items-center justify-between gap-3 pl-1 text-[11px] font-medium text-slate-500 tabular-nums">
                <div className="flex min-w-0 items-center gap-2">
                  <span>{now ? formatDate(now) : "—"}</span>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2">
                    <rect x="3" y="4" width="18" height="18" rx="2" />
                    <line x1="16" y1="2" x2="16" y2="6" />
                    <line x1="8" y1="2" x2="8" y2="6" />
                    <line x1="3" y1="10" x2="21" y2="10" />
                  </svg>
                  <span>{now ? formatTime(now) : "—"}</span>
                </div>
                <NotificationBell />
              </div>
            </div>
          </div>
        </div>

        <nav className="flex-1 py-5 flex flex-col gap-1 overflow-y-auto">
          {NAV_ITEMS.filter(
            (item) =>
              (!item.permission || userPermissions.includes(item.permission)) &&
              (!item.hideForRoles ||
                !item.hideForRoles.includes(
                  sessionUser?.role?.trim().toUpperCase() ?? "",
                )),
          ).map((item) => {
            const isActive =
              pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                title={collapsed ? item.label : undefined}
                onClick={() => setMobileOpen(false)}
                className={[
                  "flex items-center py-3 text-sm font-medium transition-[background-color,color,gap,padding] duration-300 ease-in-out",
                  collapsed ? "px-[14px] justify-center gap-0" : "px-6 gap-3",
                  isActive
                    ? "bg-blue-50 text-[#092168] border-r-4 border-[#092168]"
                    : "text-slate-500 hover:bg-blue-50 hover:text-[#092168]",
                ].join(" ")}
              >
                <span className="flex-shrink-0 relative">
                  {item.icon}
                  {item.href === "/baby-monitoring" && bleOpenCount > 0 && collapsed && (
                    <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-red-500 border border-white" />
                  )}
                </span>
                <span
                  className={[
                    "grid min-w-0 transition-[grid-template-columns,opacity] duration-300 ease-in-out",
                    collapsed ? "grid-cols-[0fr] opacity-0" : "grid-cols-[1fr] opacity-100",
                  ].join(" ")}
                >
                  <span className="overflow-hidden">
                    <span className="truncate flex items-center gap-1.5">
                      {item.label}
                      {item.href === "/baby-monitoring" && bleOpenCount > 0 && (
                        <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] rounded-full bg-red-500 text-white text-[10px] font-bold px-1 animate-pulse flex-shrink-0">
                          {bleOpenCount > 99 ? "99+" : bleOpenCount}
                        </span>
                      )}
                    </span>
                  </span>
                </span>
              </Link>
            );
          })}
        </nav>

        <div
          className={[
            "border-t border-slate-100 py-6 flex flex-col gap-4 flex-shrink-0 transition-[padding] duration-300 ease-in-out",
            collapsed ? "px-3 items-center" : "px-6",
          ].join(" ")}
        >
          <Link
            href="/profile"
            title={collapsed ? userName : undefined}
            className={[
              "flex items-center transition-[gap] duration-300 ease-in-out",
              collapsed ? "gap-0" : "gap-3",
            ].join(" ")}
            onClick={() => setMobileOpen(false)}
          >
            <div className="w-10 h-10 rounded-full border border-slate-200 bg-slate-200 flex-shrink-0 flex items-center justify-center font-semibold text-sm text-[#092168]">
              {userInitials}
            </div>

            <div
              className={[
                "grid min-w-0 transition-[grid-template-columns,opacity] duration-300 ease-in-out",
                collapsed ? "grid-cols-[0fr] opacity-0" : "grid-cols-[1fr] opacity-100",
              ].join(" ")}
            >
              <div className="overflow-hidden flex flex-col">
                <span className="text-xs font-semibold text-slate-900 truncate">
                  {userName}
                </span>
                <span className="text-[10px] uppercase tracking-wide text-slate-500 truncate">
                  {userRole}
                </span>
              </div>
            </div>
          </Link>

          <button
            title={collapsed ? "Cerrar Sesión" : undefined}
            className={[
              "flex items-center text-xs font-semibold text-slate-400 hover:text-slate-600 transition-[color,gap] duration-300 ease-in-out",
              collapsed ? "justify-center gap-0" : "gap-2",
            ].join(" ")}
            onClick={() => logoutDialogRef.current?.showModal()}
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              className="flex-shrink-0"
            >
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            <span
              className={[
                "grid min-w-0 transition-[grid-template-columns,opacity] duration-300 ease-in-out",
                collapsed ? "grid-cols-[0fr] opacity-0" : "grid-cols-[1fr] opacity-100",
              ].join(" ")}
            >
              <span className="overflow-hidden whitespace-nowrap">Cerrar Sesión</span>
            </span>
          </button>
        </div>
      </aside>

      <dialog ref={logoutDialogRef} className="modal">
        <div className="modal-box max-w-sm">
          <form method="dialog">
            <button className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2">
              ✕
            </button>
          </form>

          <div className="flex justify-center mb-3">
            <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="#dc2626"
                className="w-7 h-7"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"
                />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
            </div>
          </div>

          <h3 className="text-lg font-bold text-center text-[#1A2B5E]">
            ¿Cerrar sesión?
          </h3>
          <p className="text-sm text-slate-500 text-center mt-2">
            Será redirigido a la pantalla de inicio de sesión.
          </p>

          <div className="modal-action justify-center gap-3 mt-4">
            <form method="dialog">
              <button className="btn btn-ghost btn-sm">Cancelar</button>
            </form>
            <button
              className="btn btn-sm btn-error"
              onClick={handleLogoutConfirm}
            >
              Sí, cerrar sesión
            </button>
          </div>
        </div>
        <form method="dialog" className="modal-backdrop">
          <button>close</button>
        </form>
      </dialog>
    </>
  );
}
