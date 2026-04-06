
// Iconos para los estados de verificación
function IconCheck() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="size-4">
      <path
        fillRule="evenodd"
        d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm3.857-9.809a.75.75 0 0 0-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 1 0-1.06 1.061l2.5 2.5a.75.75 0 0 0 1.137-.089l4-5.5Z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function IconWarning() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="size-4">
      <path
        fillRule="evenodd"
        d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495ZM10 5a.75.75 0 0 1 .75.75v3.5a.75.75 0 0 1-1.5 0v-3.5A.75.75 0 0 1 10 5Zm0 9a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z"
        clipRule="evenodd"
      />
    </svg>
  );
}

// Funcion para mostrar cada fila de verificación con su estado correspondiente

function VerificacionRow({
  label,
  loading,
  count,
}: {
  label: string;
  loading: boolean;
  count: number | null;
}) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-[#E2E8F0] px-4 py-2.5">
      <span className="text-sm text-[#334155]">{label}</span>
      {loading ? (
        <span className="loading loading-spinner loading-xs text-[#09268E]" />
      ) : count === null ? (
        <span className="text-xs text-[#94a3b8]">No disponible</span>
      ) : count === 0 ? (
        <span className="inline-flex items-center gap-1 text-xs font-semibold text-green-600">
          <IconCheck />
          Sin pendientes
        </span>
      ) : (
        <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-600">
          <IconWarning />
          {count} pendiente{count !== 1 ? "s" : ""}
        </span>
      )}
    </div>
  );
}

// Funcion principal para mostrar la sección de verificaciones pendientes con sus respectivas filas para órdenes médicas y medicación

export function VerificacionesPendientesSection({
  loadingOrdenes,
  ordenesPendientes,
  loadingMedicacion,
  medicacionPendiente,
}: {
  loadingOrdenes: boolean;
  ordenesPendientes: number | null;
  loadingMedicacion: boolean;
  medicacionPendiente: number | null;
}) {
  return (
    <div className="mx-6 mt-4 space-y-2">
      <p className="text-[11px] font-bold uppercase tracking-[0.5px] text-[#64748b]">
        Verificaciones pendientes
      </p>
      <VerificacionRow
        label="Órdenes médicas pendientes"
        loading={loadingOrdenes}
        count={ordenesPendientes}
      />
      <VerificacionRow
        label="Medicación"
        loading={loadingMedicacion}
        count={medicacionPendiente}
      />
    </div>
  );
}
