"use client";
import { useState } from "react";
import { LoginForm } from "@/features/authentication/components/LoginForm";
import { ForgotPasswordForm } from "@/features/authentication/components/ForgotPasswordForm";
type Step = "login" | "forgot";
// Componente del panel deslizante de autenticación
export function AuthSlidePanel() {
  const [step, setStep] = useState<Step>("login");
  return (
    <div className="flex-1 bg-white flex flex-col min-h-screen">
      <div className="lg:hidden flex items-center gap-3 px-6 py-4 border-b border-slate-100 shrink-0">
        <div
          className="flex items-center justify-center rounded-lg p-1.5"
          style={{ backgroundColor: "#092168" }}
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#fff"
            strokeWidth="2.5"
          >
            <path d="M8 2H16V8H22V16H16V22H8V16H2V8H8z" />
          </svg>
        </div>
        <span
          className="text-lg font-bold text-slate-900"
          style={{
            fontFamily: "Montserrat, sans-serif",
            letterSpacing: "-0.4px",
          }}
        >
          VigiNurse
        </span>
      </div>

      <div className="flex-1 relative overflow-hidden min-h-0">
        <div
          className="absolute inset-0 flex"
          style={{
            width: "200%",
            transform: step === "login" ? "translateX(0)" : "translateX(-50%)",
            transition: "transform 0.45s cubic-bezier(0.4, 0, 0.2, 1)",
          }}
        >
          <div className="w-1/2 flex items-center justify-center overflow-y-auto p-6 sm:p-12 lg:p-24">
            <LoginForm onForgotPassword={() => setStep("forgot")} />
          </div>

          <div className="w-1/2 flex items-center justify-center overflow-y-auto p-6 sm:p-12 lg:p-24">
            <ForgotPasswordForm onBack={() => setStep("login")} />
          </div>
        </div>
      </div>
    </div>
  );
}
