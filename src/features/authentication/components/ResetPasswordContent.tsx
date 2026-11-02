"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { validateResetToken } from "@/features/authentication/services/authService";
import { ResetPasswordForm } from "@/features/authentication/components/ResetPasswordForm";
interface ResetPasswordContentProps {
  token: string;
}
type PageState = "loading" | "invalid" | "form" | "success";
const BTN_CLS =
  "btn btn-lg text-white bg-[#092168] border-[#092168] hover:bg-[#0b2d80] hover:border-[#0b2d80] shadow-[0px_10px_15px_-3px_rgba(30,58,138,0.2)] font-bold";
// Componente principal para la pantalla de restablecimiento de contraseña. Se encarga de validar el token y mostrar el formulario o mensajes de error según corresponda.
export function ResetPasswordContent({ token }: ResetPasswordContentProps) {
  const router = useRouter();
  const [validatedState, setPageState] = useState<PageState>("loading");
  const [validationError, setTokenError] = useState<string | null>(null);
  // Sin token no hay nada que validar: se resuelve en el render, sin pasar por el efecto.
  const pageState: PageState = token ? validatedState : "invalid";
  const tokenError = token ? validationError : "El enlace no contiene un token válido.";
  useEffect(() => {
    if (!token) return;
    validateResetToken(token).then((result) => {
      if (result.valid) {
        setPageState("form");
      } else {
        setTokenError(result.error ?? "El enlace ha expirado o no es válido.");
        setPageState("invalid");
      }
    });
  }, [token]);
  if (pageState === "loading") {
    return (
      <div className="flex flex-col items-center gap-6 w-full max-w-[448px]">
        <span className="loading loading-spinner loading-lg text-[#092168]" />
        <p className="text-[15px] text-slate-500 m-0">Validando enlace…</p>
      </div>
    );
  }
  if (pageState === "invalid") {
    return (
      <div className="flex flex-col items-center text-center w-full max-w-[448px] gap-6">
        <div className="w-[72px] h-[72px] rounded-full bg-red-50 flex items-center justify-center shrink-0">
          <svg
            width="36"
            height="36"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#dc2626"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        </div>
        <div className="flex flex-col gap-2">
          <p className="text-2xl font-bold text-slate-900 m-0">
            Enlace no válido
          </p>
          <p className="text-[15px] leading-6 text-slate-500 m-0">
            {tokenError}
          </p>
          <p className="text-sm text-slate-400 m-0">
            Solicite un nuevo enlace desde la pantalla de inicio de sesión.
          </p>
        </div>
        <button
          type="button"
          onClick={() => router.replace("/login")}
          className={BTN_CLS}
        >
          Ir al inicio de sesión
        </button>
      </div>
    );
  }
  if (pageState === "success") {
    return (
      <div className="flex flex-col items-center text-center w-full max-w-[448px] gap-6">
        <div className="w-[72px] h-[72px] rounded-full bg-green-50 flex items-center justify-center shrink-0">
          <svg
            width="36"
            height="36"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#16a34a"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M9 12l2 2 4-4" />
            <circle cx="12" cy="12" r="10" />
          </svg>
        </div>
        <div className="flex flex-col gap-2">
          <p className="text-2xl font-bold text-slate-900 m-0">
            Contraseña restablecida
          </p>
          <p className="text-[15px] leading-6 text-slate-500 m-0">
            Su contraseña fue actualizada exitosamente. Ya puede iniciar sesión
            con sus nuevas credenciales.
          </p>
        </div>
        <button
          type="button"
          onClick={() => router.replace("/login")}
          className={BTN_CLS}
        >
          Ir al inicio de sesión
        </button>
      </div>
    );
  }
  return (
    <ResetPasswordForm
      token={token}
      onSuccess={() => setPageState("success")}
    />
  );
}
