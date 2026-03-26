"use client";
import { useState } from "react";
import { requestPasswordRecovery } from "@/features/authentication/services/authService";
interface ForgotPasswordFormProps {
  onBack: () => void;
}
type Step = "form" | "sent";
// Componente para recuperar contraseña.
export function ForgotPasswordForm({ onBack }: ForgotPasswordFormProps) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<Step>("form");
  const [apiError, setApiError] = useState<string | null>(null);
  // Maneja envio.
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || loading) return;
    setLoading(true);
    setApiError(null);
    const result = await requestPasswordRecovery(email.trim());
    setLoading(false);
    if (result.success) {
      setStep("sent");
    } else {
      setApiError(
        result.error ?? "No se pudo enviar el correo de recuperación.",
      );
    }
  }
  return (
    <div className="flex flex-col w-full max-w-[448px] gap-[clamp(24px,5vw,40px)]">
      <button
        type="button"
        onClick={onBack}
        className="btn btn-ghost btn-sm self-start gap-1.5 px-0 font-medium text-slate-500 hover:bg-transparent hover:text-slate-700"
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
          <polyline points="15 18 9 12 15 6" />
        </svg>
        Volver al inicio de sesión
      </button>

      {step === "form" ? (
        <>
          <div className="flex flex-col gap-2">
            <h1 className="text-3xl font-bold leading-9 text-slate-900 m-0">
              Recuperar contraseña
            </h1>
            <p className="text-base leading-6 text-slate-500 m-0">
              Ingrese su correo institucional y le enviaremos un enlace para
              restablecer su contraseña.
            </p>
          </div>

          <form
            onSubmit={handleSubmit}
            noValidate
            className="flex flex-col gap-6"
          >
            {apiError && (
              <div
                role="alert"
                className="alert alert-error alert-soft text-sm"
              >
                <span>{apiError}</span>
              </div>
            )}

            <fieldset className="fieldset p-0 gap-2 border-0">
              <label
                className="label text-sm font-semibold text-slate-700"
                htmlFor="recovery-email"
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
                  id="recovery-email"
                  type="email"
                  autoComplete="email"
                  required
                  disabled={loading}
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setApiError(null);
                  }}
                  placeholder="usuario@hospital.com"
                />
              </label>
            </fieldset>

            <button
              type="submit"
              disabled={loading || !email.trim()}
              className="btn btn-block text-white bg-[#092168] border-[#092168] hover:bg-[#0b2d80] hover:border-[#0b2d80] shadow-[0px_10px_15px_-3px_rgba(30,58,138,0.2),0px_4px_6px_-4px_rgba(30,58,138,0.2)] font-bold text-base disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading && (
                <span className="loading loading-spinner loading-sm" />
              )}
              {loading ? "Enviando..." : "Enviar enlace de recuperación"}
            </button>
          </form>
        </>
      ) : (
        <div className="flex flex-col items-center text-center gap-6">
          <div className="w-[72px] h-[72px] rounded-full bg-green-50 flex items-center justify-center">
            <svg
              width="36"
              height="36"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#16a34a"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
              <polyline points="22,6 12,13 2,6" />
            </svg>
          </div>

          <div className="flex flex-col gap-2">
            <p className="text-2xl font-bold leading-8 text-slate-900 m-0">
              Correo enviado
            </p>
            <p className="text-[15px] leading-6 text-slate-500 m-0">
              Si <strong className="text-slate-900">{email}</strong> está
              registrado en el sistema, recibirá un enlace para restablecer su
              contraseña en los próximos minutos.
            </p>
            <p className="text-[13px] leading-5 text-slate-400 m-0 mt-1">
              Revise también su carpeta de spam.
            </p>
          </div>

          <button
            type="button"
            onClick={onBack}
            className="btn btn-ghost btn-sm text-[#092168] underline font-semibold"
          >
            Volver al inicio de sesión
          </button>
        </div>
      )}
    </div>
  );
}
