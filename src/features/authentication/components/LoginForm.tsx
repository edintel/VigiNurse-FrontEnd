"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { login } from "@/features/authentication/services/authService";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  loginStart,
  loginSuccess,
  loginFailure,
  clearError,
  selectAuthLoading,
  selectAuthError,
} from "@/store/slices/authSlice";
import { generatePermissions } from "@/lib/permissions";
import { saveSession } from "@/lib/session";
import { toast } from "@/lib/toast";
import type { AuthRole, AuthUser } from "@/types";
const MAX_FAILED_ATTEMPTS = 5;
interface LoginFormProps {
  onForgotPassword: () => void;
}
// Componente de formulario de inicio de sesión con manejo de estado, validación y bloqueo tras múltiples intentos fallidos.
export function LoginForm({ onForgotPassword }: LoginFormProps) {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const isLoading = useAppSelector(selectAuthLoading);
  const authError = useAppSelector(selectAuthError);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const isLocked = failedAttempts >= MAX_FAILED_ATTEMPTS;
  // Maneja envio.
  async function handleSubmit(e: { preventDefault: () => void }) {
    e.preventDefault();
    if (isLocked || isLoading) return;
    dispatch(loginStart());
    const result = await login({ email, password });
    if (result.success) {
      const { token, user: rawUser, expiracion } = result.data;
      const VALID_ROLES: AuthRole[] = [
        "SUPER_ADMIN",
        "ADMIN",
        "SUPERVISOR",
        "ENFERMERO",
        "TECNICO",
        "GESTOR",
        "DOCTOR",
        "RECEPCIONISTA",
        "AUDITOR",
        "PACIENTE",
      ];
      const role: AuthRole = (VALID_ROLES as string[]).includes(rawUser.role)
        ? (rawUser.role as AuthRole)
        : "PACIENTE";
      const user: AuthUser = {
        id: rawUser.id,
        email: rawUser.email,
        name: rawUser.name,
        role,
      };
      const permissions = generatePermissions(role);
      saveSession({ token, user, permissions, expiracion });
      dispatch(loginSuccess({ user, token, permissions }));
      setFailedAttempts(0);
      toast.success(`¡Bienvenido, ${user.name}!`);
      router.replace("/dashboard");
    } else {
      setFailedAttempts((prev) => prev + 1);
      dispatch(loginFailure(result.error ?? "Email o contraseña incorrectos."));
    }
  }
  return (
    <div className="flex flex-col w-full max-w-[560px] gap-[clamp(24px,5vw,40px)]">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold leading-9 text-slate-900 m-0">
          Iniciar sesión
        </h1>
        <p className="text-base leading-6 text-slate-500 m-0">
          Acceda con sus credenciales institucionales
        </p>
      </div>

      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-6">
        {authError && (
          <div
            role="alert"
            className={`alert alert-soft text-sm ${isLocked ? "alert-warning" : "alert-error"}`}
          >
            <span>{authError}</span>
          </div>
        )}

        <fieldset className="fieldset p-0 gap-2 border-0">
          <label
            className="label text-sm font-semibold text-slate-700"
            htmlFor="email"
          >
            Correo electrónico
          </label>
          <label className="input w-full bg-white border-slate-300 focus-within:border-[#092168] focus-within:outline-none">
            <svg
              className="h-[1em] opacity-40"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
            >
              <g
                strokeLinejoin="round"
                strokeLinecap="round"
                strokeWidth="2.5"
                fill="none"
                stroke="currentColor"
              >
                <rect width="20" height="16" x="2" y="4" rx="2" />
                <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
              </g>
            </svg>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              disabled={isLocked || isLoading}
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                dispatch(clearError());
              }}
              placeholder="usuario@hospital.com"
            />
          </label>
        </fieldset>

        <fieldset className="fieldset p-0 gap-2 border-0">
          <label
            className="label text-sm font-semibold text-slate-700"
            htmlFor="password"
          >
            Contraseña
          </label>
          <label className="input w-full bg-white border-slate-300 focus-within:border-[#092168] focus-within:outline-none">
            <svg
              className="h-[1em] opacity-40"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
            >
              <g
                strokeLinejoin="round"
                strokeLinecap="round"
                strokeWidth="2.5"
                fill="none"
                stroke="currentColor"
              >
                <path d="M2.586 17.414A2 2 0 0 0 2 18.828V21a1 1 0 0 0 1 1h3a1 1 0 0 0 1-1v-1a1 1 0 0 1 1-1h1a1 1 0 0 0 1-1v-1a1 1 0 0 1 1-1h.172a2 2 0 0 0 1.414-.586l.814-.814a6.5 6.5 0 1 0-4-4z" />
                <circle cx="16.5" cy="7.5" r=".5" fill="currentColor" />
              </g>
            </svg>
            <input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              required
              disabled={isLocked || isLoading}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                dispatch(clearError());
              }}
              placeholder="••••••••"
            />
            <button
              type="button"
              onClick={() => setShowPassword((s) => !s)}
              className={`swap ${showPassword ? "swap-active" : ""} opacity-40 hover:opacity-70 transition-opacity`}
              tabIndex={-1}
              aria-label={
                showPassword ? "Ocultar contraseña" : "Mostrar contraseña"
              }
            >
              <svg
                className="swap-on"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                <line x1="1" y1="1" x2="23" y2="23" />
              </svg>

              <svg
                className="swap-off"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            </button>
          </label>

          <div className="flex justify-end">
            <button
              type="button"
              onClick={onForgotPassword}
              className="btn btn-ghost btn-xs text-[#092168] font-medium px-0 hover:bg-transparent hover:underline"
            >
              ¿Olvidó su contraseña?
            </button>
          </div>
        </fieldset>

        <button
          type="submit"
          disabled={isLocked || isLoading}
          className="btn btn-block text-white bg-[#092168] border-[#092168] hover:bg-[#0b2d80] hover:border-[#0b2d80] shadow-[0px_10px_15px_-3px_rgba(30,58,138,0.2),0px_4px_6px_-4px_rgba(30,58,138,0.2)] font-bold text-base disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isLoading && <span className="loading loading-spinner loading-sm" />}
          {isLoading ? "Iniciando sesión..." : "Iniciar sesión"}
        </button>
      </form>

      <div className="bg-slate-50 border border-slate-100 rounded-lg px-[17px] pt-[25px] pb-[17px]">
        <p className="text-xs leading-[19.5px] text-slate-500 text-center m-0">
          <strong className="text-slate-600">Acceso restringido:</strong> Esta
          plataforma es exclusivamente para personal clínico y administrativo
          autorizado de VigiNurse. El uso no autorizado está sujeto a
          supervisión y medidas disciplinarias.
        </p>
      </div>
    </div>
  );
}
