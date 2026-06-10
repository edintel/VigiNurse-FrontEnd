// Utilidades para mostrar nombres de pacientes y bebés que pueden no estar identificados aún.

export function hasName(
  nombre?: string | null,
  apellidos?: string | null,
): boolean {
  return !!(nombre?.trim() || apellidos?.trim());
}

// "Nombre Apellidos" o el fallback si ambos están vacíos.
export function formatFullName(
  nombre?: string | null,
  apellidos?: string | null,
  fallback = "---",
): string {
  if (!hasName(nombre, apellidos)) return fallback;
  return `${nombre ?? ""} ${apellidos ?? ""}`.trim();
}

// "Apellidos, Nombre" o el fallback si ambos están vacíos.
export function formatApellidosNombre(
  nombre?: string | null,
  apellidos?: string | null,
  fallback = "---",
): string {
  if (!hasName(nombre, apellidos)) return fallback;
  if (apellidos?.trim() && nombre?.trim()) return `${apellidos}, ${nombre}`;
  return (apellidos || nombre)!.trim();
}

// Nombre del bebé, o "Bebé de [madre]" / "Bebé sin nombre" si aún no se identifica.
export function formatBabyName(
  nombre?: string | null,
  apellidos?: string | null,
  nombreMadre?: string | null,
  apellidosMadre?: string | null,
): string {
  if (hasName(nombre, apellidos)) return formatFullName(nombre, apellidos);
  if (hasName(nombreMadre, apellidosMadre)) {
    return `Bebé de ${formatFullName(nombreMadre, apellidosMadre)}`;
  }
  return "Bebé sin nombre";
}
