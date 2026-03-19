"use client";
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

// Define los elementos de navegación para la barra lateral.
const NAV_ITEMS = [
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
    label: "Control de Activos",
    href: "/assets-management",
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
    label: "Control de Bebés",
    href: "/baby-monitoring",
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
    label: "Llamado de Enfermeras",
    href: "/nurse-calls",
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
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
        <path d="M13.73 21a2 2 0 0 1-3.46 0" />
      </svg>
    ),
  },
  {
    label: "Monitores de Pacientes",
    href: "/vitals-monitoring",
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
    label: "Monitores de Personal",
    href: "/staff-monitoring",
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
    href: "/administracion",
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
    label: "Configuración",
    href: "/settings",
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
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
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
          "flex flex-col bg-white border-r border-slate-200 overflow-hidden flex-shrink-0",
          "fixed inset-y-0 left-0 z-50 w-64",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
          "md:relative md:inset-auto md:z-auto md:translate-x-0 md:h-screen",
          collapsed ? "md:w-16" : "md:w-64",
          "transition-all duration-300 ease-in-out",
        ].join(" ")}
      >
        <div
          className={[
            "border-b border-slate-100 py-3 flex flex-col gap-3 flex-shrink-0",
            collapsed ? "px-2" : "px-3",
          ].join(" ")}
        >
          <div className="flex items-center justify-between gap-2">
            <div
              className={[
                "flex items-center gap-3",
                collapsed ? "justify-center w-full" : "min-w-0",
              ].join(" ")}
            >
              <div className="bg-[#092168] rounded-lg p-1.5 flex-shrink-0 flex items-center justify-center">
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#fff"
                  strokeWidth="2.5"
                >
                  <path d="M8 2H16V8H22V16H16V22H8V16H2V8H8z" />
                </svg>
              </div>

              {!collapsed && (
                <span className="text-xl font-bold text-slate-900 tracking-tight whitespace-nowrap">
                  VigiNurse
                </span>
              )}
            </div>

            <button
              aria-label={collapsed ? "Expandir menú" : "Colapsar menú"}
              className={[
                "hidden md:flex items-center justify-center w-7 h-7 rounded-md text-[#092168] hover:bg-blue-50 hover:text-[#061447] transition-colors",
                collapsed ? "mt-1" : "",
              ].join(" ")}
              onClick={() => setCollapsed(!collapsed)}
            >
              {collapsed ? (
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              ) : (
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="15 18 9 12 15 6" />
                </svg>
              )}
            </button>

            <button
              aria-label="Cerrar menú"
              className="md:hidden flex items-center justify-center w-7 h-7 rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors flex-shrink-0"
              onClick={() => setMobileOpen(false)}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          {!collapsed && (
            <div className="flex items-center gap-2 text-xs font-medium text-slate-500 tabular-nums">
              <span>{now ? formatDate(now) : "—"}</span>

              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#64748b"
                strokeWidth="2"
              >
                <rect x="3" y="4" width="18" height="18" rx="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>

              <span>{now ? formatTime(now) : "—"}</span>
            </div>
          )}
        </div>

        <nav className="flex-1 py-6 flex flex-col gap-1 overflow-y-auto">
          {NAV_ITEMS.filter(
            (item) =>
              !item.permission || userPermissions.includes(item.permission),
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
                  "flex items-center gap-3 py-3 text-sm font-medium transition-colors",
                  collapsed ? "px-[14px] justify-center" : "px-6",
                  isActive
                    ? "bg-blue-50 text-[#092168] border-r-4 border-[#092168]"
                    : "text-slate-500 hover:bg-blue-50 hover:text-[#092168]",
                ].join(" ")}
              >
                <span className="flex-shrink-0">{item.icon}</span>
                {!collapsed && <span className="truncate">{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        <div
          className={[
            "border-t border-slate-100 py-6 flex flex-col gap-4 flex-shrink-0",
            collapsed ? "px-3 items-center" : "px-6",
          ].join(" ")}
        >
          <Link
            href="/perfil"
            title={collapsed ? userName : undefined}
            className="flex items-center gap-3"
            onClick={() => setMobileOpen(false)}
          >
            <div className="w-10 h-10 rounded-full border border-slate-200 bg-slate-200 flex-shrink-0 flex items-center justify-center font-semibold text-sm text-[#092168]">
              {userInitials}
            </div>

            {!collapsed && (
              <div className="flex flex-col overflow-hidden">
                <span className="text-xs font-semibold text-slate-900 truncate">
                  {userName}
                </span>
                <span className="text-[10px] uppercase tracking-wide text-slate-500 truncate">
                  {userRole}
                </span>
              </div>
            )}
          </Link>

          {!collapsed && (
            <button
              className="flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-slate-600 transition-colors"
              onClick={() => logoutDialogRef.current?.showModal()}
            >
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
              >
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
              Cerrar Sesión
            </button>
          )}

          {collapsed && (
            <button
              title="Cerrar Sesión"
              className="flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors"
              onClick={() => logoutDialogRef.current?.showModal()}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
              >
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
            </button>
          )}
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
