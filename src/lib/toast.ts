import Toastify from "toastify-js";
const BASE = {
  duration: 4000,
  gravity: "top" as const,
  position: "right" as const,
  stopOnFocus: true,
  style: {
    fontFamily: "Montserrat, sans-serif",
    fontSize: "14px",
    borderRadius: "8px",
    padding: "12px 16px",
    boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
  },
};
export const toast = {
  // Ejecuta la logica de success.
  success(message: string) {
    Toastify({
      ...BASE,
      text: message,
      style: { ...BASE.style, background: "#166534" },
    }).showToast();
  },
  // Ejecuta la logica de error.
  error(message: string) {
    Toastify({
      ...BASE,
      text: message,
      style: { ...BASE.style, background: "#991b1b" },
    }).showToast();
  },
  // Ejecuta la logica de info.
  info(message: string) {
    Toastify({
      ...BASE,
      text: message,
      style: { ...BASE.style, background: "#1A2B5E" },
    }).showToast();
  },
  // Ejecuta la logica de warning.
  warning(message: string) {
    Toastify({
      ...BASE,
      duration: 5000,
      text: message,
      style: { ...BASE.style, background: "#92400e" },
    }).showToast();
  },
};
