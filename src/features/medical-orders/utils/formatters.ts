/** Formatea un string ISO a "dd/mm/yyyy hh:mm". Devuelve "—" si el valor es null. */
export function formatDate(s: string | null): string {
  if (!s) return "—";
  try {
    const d = new Date(s);
    return (
      d.toLocaleDateString("es-ES", { day: "2-digit", month: "2-digit", year: "numeric" }) +
      " " +
      d.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit", hour12: false })
    );
  } catch {
    return s;
  }
}

/** Formatea bytes a una representación legible (B, KB, MB). */
export function formatBytes(b: number): string {
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / (1024 * 1024)).toFixed(1)} MB`;
}
