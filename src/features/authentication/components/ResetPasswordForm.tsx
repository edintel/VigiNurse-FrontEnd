"use client";
import { useState } from "react";
import { resetPassword } from "@/features/authentication/services/authService";
import { isValidPassword } from "@/features/authentication/utils/passwordValidation";
import { PasswordInput } from "@/features/authentication/components/PasswordInput";
import { PasswordRequirements } from "@/features/authentication/components/PasswordRequirements";
import { toast } from "@/lib/toast";
interface ResetPasswordFormProps {
  token: string;
  onSuccess: () => void;
}
// Componente de formulario para restablecer contraseña.
export function ResetPasswordForm({
  token,
  onSuccess,
}: ResetPasswordFormProps) {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const passwordMismatch = confirm.length > 0 && password !== confirm;
  const canSubmit = isValidPassword(password) && password === confirm;
  // Maneja envio.
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setLoading(true);
    setApiError(null);
    const result = await resetPassword(token, password);
    setLoading(false);
    if (result.success) {
      toast.success("Contraseña restablecida exitosamente.");
      onSuccess();
    } else {
      setApiError(result.error ?? "No se pudo restablecer la contraseña.");
    }
  }
  return (
    <div className="flex flex-col w-full max-w-[448px] gap-[clamp(24px,5vw,40px)]">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold leading-9 text-slate-900 m-0">
          Nueva contraseña
        </h1>
        <p className="text-base leading-6 text-slate-500 m-0">
          Cree una contraseña segura para su cuenta.
        </p>
      </div>

      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
        {apiError && (
          <div role="alert" className="alert alert-error alert-soft text-sm">
            <span>{apiError}</span>
          </div>
        )}

        <div className="flex flex-col">
          <PasswordInput
            id="new-password"
            label="Nueva contraseña"
            value={password}
            onChange={(v) => {
              setPassword(v);
              setApiError(null);
            }}
            disabled={loading}
          />
          <PasswordRequirements password={password} />
        </div>

        <PasswordInput
          id="confirm-password"
          label="Confirmar contraseña"
          value={confirm}
          onChange={(v) => {
            setConfirm(v);
            setApiError(null);
          }}
          disabled={loading}
          hasError={passwordMismatch}
          errorMessage="Las contraseñas no coinciden."
        />

        <button
          type="submit"
          disabled={loading || !canSubmit}
          className="btn btn-block mt-1 text-white bg-[#092168] border-[#092168] hover:bg-[#0b2d80] hover:border-[#0b2d80] shadow-[0px_10px_15px_-3px_rgba(30,58,138,0.2),0px_4px_6px_-4px_rgba(30,58,138,0.2)] font-bold text-base disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {loading && <span className="loading loading-spinner loading-sm" />}
          {loading ? "Restableciendo..." : "Restablecer contraseña"}
        </button>
      </form>
    </div>
  );
}
