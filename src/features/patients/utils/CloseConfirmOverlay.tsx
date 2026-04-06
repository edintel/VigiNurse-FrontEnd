// Componente de overlay para confirmar si el usuario desea salir sin guardar los cambios al finalizar un episodio.

export function CloseConfirmOverlay({
  onContinuar,
  onConfirmar,
}: {
  onContinuar: () => void;
  onConfirmar: () => void;
}) {
  return (
    <div className="absolute inset-0 z-10 flex items-center justify-center rounded-xl bg-white/95 backdrop-blur-sm p-8">
      <div className="text-center space-y-4 max-w-xs">
        <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center mx-auto">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth="1.8"
            stroke="#d97706"
            className="size-6"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
            />
          </svg>
        </div>
        <div>
          <h4 className="text-base font-bold text-[#0f172a]">¿Desea salir?</h4>
          <p className="text-sm text-[#64748b] mt-1.5 leading-relaxed">
            Se perderán los datos ingresados, incluyendo el motivo de salida y la receta de alta.
          </p>
        </div>
        <div className="flex gap-3 justify-center pt-1">
          <button
            type="button"
            className="btn btn-sm border-[#e2e8f0] bg-white text-[#64748b]"
            onClick={onContinuar}
          >
            Continuar editando
          </button>
          <button
            type="button"
            className="btn btn-sm text-white"
            style={{ backgroundColor: "#ff627d", borderColor: "#ff627d" }}
            onClick={onConfirmar}
          >
            Sí, salir
          </button>
        </div>
      </div>
    </div>
  );
}
