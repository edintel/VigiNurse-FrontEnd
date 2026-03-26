export const PASSWORD_RULES = [
  {
    id: "length",
    label: "Al menos 8 caracteres",
    test: (p: string) => p.length >= 8,
  },
  {
    id: "upper",
    label: "Al menos una letra mayúscula",
    test: (p: string) => /[A-Z]/.test(p),
  },
  {
    id: "number",
    label: "Al menos un número",
    test: (p: string) => /\d/.test(p),
  },
  {
    id: "special",
    label: "Al menos un carácter especial",
    test: (p: string) => /[^A-Za-z0-9]/.test(p),
  },
];
// Valida que la contraseña cumpla con todas las reglas definidas en PASSWORD_RULES
export function isValidPassword(p: string) {
  return PASSWORD_RULES.every((r) => r.test(p));
}
