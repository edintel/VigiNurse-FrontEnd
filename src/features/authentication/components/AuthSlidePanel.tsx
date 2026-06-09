"use client";
import { useState } from "react";
import Image from "next/image";
import { LoginForm } from "@/features/authentication/components/LoginForm";
import { ForgotPasswordForm } from "@/features/authentication/components/ForgotPasswordForm";
type Step = "login" | "forgot";
// Componente del panel deslizante de autenticación
export function AuthSlidePanel() {
  const [step, setStep] = useState<Step>("login");
  return (
    <div className="flex-1 bg-white flex flex-col min-h-screen">
      <div className="lg:hidden flex items-center justify-center px-6 pt-4 pb-0 shrink-0">
        <Image
          src="/Logo-transparent.png"
          alt="VigiNurse"
          width={300}
          height={300}
          priority
          style={{ width: "auto", height: "auto", maxHeight: "28vh", maxWidth: "80vw" }}
        />
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
          <div className="w-1/2 flex items-start lg:items-center justify-center overflow-y-auto p-4 sm:p-10 lg:px-16 lg:py-12">
            <LoginForm onForgotPassword={() => setStep("forgot")} />
          </div>

          <div className="w-1/2 flex items-start lg:items-center justify-center overflow-y-auto p-4 sm:p-10 lg:px-16 lg:py-12">
            <ForgotPasswordForm onBack={() => setStep("login")} />
          </div>
        </div>
      </div>
    </div>
  );
}
