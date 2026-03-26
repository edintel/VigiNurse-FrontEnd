import { PASSWORD_RULES } from "@/features/authentication/utils/passwordValidation";
interface PasswordRequirementsProps {
  password: string;
}
// Componente que muestra los requisitos de la contraseña y si se cumplen o no, basado en las reglas definidas en PASSWORD_RULES
export function PasswordRequirements({ password }: PasswordRequirementsProps) {
  if (password.length === 0) return null;
  return (
    <div className="flex flex-col gap-1.5 mt-1 p-3 bg-slate-50 border border-slate-100 rounded-lg">
      {PASSWORD_RULES.map((rule) => {
        const met = rule.test(password);
        return (
          <div key={rule.id} className="flex items-center gap-2">
            {met ? (
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                strokeWidth="2.5"
                className="stroke-success shrink-0"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
            ) : (
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                strokeWidth="2.5"
                className="stroke-slate-300 shrink-0"
              >
                <circle cx="12" cy="12" r="10" />
              </svg>
            )}
            <span
              className={`text-xs ${met ? "text-success font-semibold" : "text-slate-400"}`}
            >
              {rule.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}
