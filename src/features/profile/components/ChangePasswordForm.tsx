"use client";
import { useState } from "react";
import { InputField } from "@/shared/ui/InputField";
import { updatePassword } from "@/features/profile/services/userService";

// Reglas de validacion de contrasena.
const PASSWORD_RULES = [
  {
    id: "length",
    label: "Mínimo 8 caracteres",
    test: (v: string) => v.length >= 8,
  },
  {
    id: "uppercase",
    label: "Al menos una letra mayúscula",
    test: (v: string) => /[A-Z]/.test(v),
  },
  {
    id: "number",
    label: "Al menos un número",
    test: (v: string) => /[0-9]/.test(v),
  },
  {
    id: "special",
    label: "Al menos un carácter especial (!@#$%^&*…)",
    test: (v: string) => /[^A-Za-z0-9]/.test(v),
  },
] as const;
// Valida que la contrasena cumpla con las reglas.
function isPasswordValid(password: string) {
  return PASSWORD_RULES.every((rule) => rule.test(password));
}
// Componente para mostrar cada regla de validacion.
function RuleItem({ met, label }: { met: boolean; label: string }) {
  return (
    <li className="flex items-center gap-2 text-xs">
      {met ? (
        <svg
          className="w-4 h-4 text-green-500 shrink-0"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fillRule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
            clipRule="evenodd"
          />
        </svg>
      ) : (
        <svg
          className="w-4 h-4 text-slate-300 shrink-0"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fillRule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 000 16zm0-2a6 6 0 100-12 6 6 0 000 12z"
            clipRule="evenodd"
          />
        </svg>
      )}
      <span className={met ? "text-green-600 font-medium" : "text-slate-400"}>
        {label}
      </span>
    </li>
  );
}
// Componente principal para cambiar la contrasena del usuario.
export function ChangePasswordForm() {
  const [form, setForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [newPasswordTouched, setNewPasswordTouched] = useState(false);
  const [confirmError, setConfirmError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  // Maneja cambio.
  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setSubmitError(null);
    setSubmitSuccess(false);
    if (name === "newPassword") setNewPasswordTouched(true);
    if (name === "confirmPassword" || name === "newPassword") {
      setConfirmError(null);
    }
  }
  // Maneja envio.
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitError(null);
    setSubmitSuccess(false);
    setConfirmError(null);
    if (!isPasswordValid(form.newPassword)) return;
    if (form.newPassword !== form.confirmPassword) {
      setConfirmError("Las contraseñas no coinciden.");
      return;
    }
    setLoading(true);
    try {
      const result = await updatePassword({
        passwordActual: form.currentPassword,
        passwordNuevo: form.newPassword,
        confirmacionPassword: form.confirmPassword,
      });
      if (result.success) {
        setSubmitSuccess(true);
        setForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
        setNewPasswordTouched(false);
      } else {
        setSubmitError(result.error);
      }
    } finally {
      setLoading(false);
    }
  }
  const passwordValid = isPasswordValid(form.newPassword);
  const showRules = newPasswordTouched && form.newPassword.length > 0;
  return (
    <div className="card bg-white shadow-sm border border-slate-200">
      <div className="card-body p-6 gap-4">
        <div>
          <h2 className="card-title text-slate-800">Seguridad</h2>
          <p className="text-sm text-slate-500 mt-1">
            Cambiar contraseña de acceso al sistema.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-4"
          noValidate
        >
          <InputField
            label="Contraseña actual"
            id="currentPassword"
            name="currentPassword"
            type="password"
            autoComplete="current-password"
            value={form.currentPassword}
            onChange={handleChange}
            required
            placeholder="••••••••"
          />

          <div className="flex flex-col gap-2">
            <InputField
              label="Nueva contraseña"
              id="newPassword"
              name="newPassword"
              type="password"
              autoComplete="new-password"
              value={form.newPassword}
              onChange={handleChange}
              required
              placeholder="••••••••"
            />

            {showRules && (
              <ul className="flex flex-col gap-1.5 bg-white border border-slate-100 rounded-lg px-4 py-3">
                {PASSWORD_RULES.map((rule) => (
                  <RuleItem
                    key={rule.id}
                    met={rule.test(form.newPassword)}
                    label={rule.label}
                  />
                ))}
              </ul>
            )}
          </div>

          <InputField
            label="Confirmar nueva contraseña"
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
            value={form.confirmPassword}
            onChange={handleChange}
            required
            placeholder="••••••••"
            error={confirmError ?? undefined}
          />

          {submitError && (
            <div role="alert" className="alert alert-error text-sm py-3">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 shrink-0 stroke-current"
                fill="none"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span>{submitError}</span>
            </div>
          )}

          {submitSuccess && (
            <div role="alert" className="alert alert-success text-sm py-3">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 shrink-0 stroke-current"
                fill="none"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span>Contraseña actualizada correctamente.</span>
            </div>
          )}

          <div className="card-actions justify-end pt-2">
            <button
              type="submit"
              disabled={loading || (newPasswordTouched && !passwordValid)}
              className="btn btn-primary"
              style={{ backgroundColor: "#09268E", borderColor: "#09268E" }}
            >
              {loading && (
                <span className="loading loading-spinner loading-sm" />
              )}
              {loading ? "Actualizando..." : "Cambiar contraseña"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
