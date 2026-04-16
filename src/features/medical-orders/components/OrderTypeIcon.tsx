import { TipoOrden } from "@/features/patients/types";

export function getOrderTypeIconBg(tipo: TipoOrden): string {
  const map: Record<TipoOrden, string> = {
    [TipoOrden.Laboratorio]: "#eff6ff",
    [TipoOrden.Imagen]: "#f3e8ff",
    [TipoOrden.Medicamento]: "#ecfdf5",
    [TipoOrden.Procedimiento]: "#fff7ed",
    [TipoOrden.Interconsulta]: "#f0fdfa",
    [TipoOrden.Otro]: "#f1f5f9",
  };
  return map[tipo] ?? "#f1f5f9";
}

export function getOrderTypeIconColor(tipo: TipoOrden): string {
  const map: Record<TipoOrden, string> = {
    [TipoOrden.Laboratorio]: "#2563eb",
    [TipoOrden.Imagen]: "#7e22ce",
    [TipoOrden.Medicamento]: "#059669",
    [TipoOrden.Procedimiento]: "#ea580c",
    [TipoOrden.Interconsulta]: "#0d9488",
    [TipoOrden.Otro]: "#64748b",
  };
  return map[tipo] ?? "#64748b";
}

export function OrderTypeIcon({ tipo }: { tipo: TipoOrden }) {
  const color = getOrderTypeIconColor(tipo);
  const p = {
    xmlns: "http://www.w3.org/2000/svg",
    fill: "none",
    viewBox: "0 0 24 24",
    strokeWidth: "1.8",
    stroke: color,
    className: "size-6",
  };
  switch (tipo) {
    case TipoOrden.Laboratorio:
      return (
        <svg {...p}>
          <path strokeLinecap="round" strokeLinejoin="round"
            d="M9.75 3.104v5.714a2.25 2.25 0 0 1-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 0 1 4.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0 1 12 15a9.065 9.065 0 0 1-6.23-.693L4.2 15.3m15.6 0-1.58 5.583A2.25 2.25 0 0 1 15.94 22H8.06a2.25 2.25 0 0 1-2.18-1.117L4.2 15.3" />
        </svg>
      );
    case TipoOrden.Imagen:
      return (
        <svg {...p}>
          <path strokeLinecap="round" strokeLinejoin="round"
            d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z" />
          <path strokeLinecap="round" strokeLinejoin="round"
            d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0ZM18.75 10.5h.008v.008h-.008V10.5Z" />
        </svg>
      );
    case TipoOrden.Medicamento:
      return (
        <svg {...p}>
          <path strokeLinecap="round" strokeLinejoin="round"
            d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
        </svg>
      );
    case TipoOrden.Procedimiento:
      return (
        <svg {...p}>
          <path strokeLinecap="round" strokeLinejoin="round"
            d="M11.42 15.17 17.25 21A2.652 2.652 0 0 0 21 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 1 1-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 0 0 4.486-6.336l-3.276 3.277a3.004 3.004 0 0 1-2.25-2.25l3.276-3.276a4.5 4.5 0 0 0-6.336 4.486c.091 1.076-.071 2.264-.904 2.95l-.102.085m-1.745 1.437L5.909 7.5H4.5L2.25 3.75l1.5-1.5L7.5 4.5v1.409l4.26 4.26m-1.745 1.437 1.745-1.437m6.615 8.206L15.75 15.75M4.867 19.125h.008v.008h-.008v-.008Z" />
        </svg>
      );
    case TipoOrden.Interconsulta:
      return (
        <svg {...p}>
          <path strokeLinecap="round" strokeLinejoin="round"
            d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z" />
        </svg>
      );
    default:
      return (
        <svg {...p}>
          <path strokeLinecap="round" strokeLinejoin="round"
            d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
        </svg>
      );
  }
}
