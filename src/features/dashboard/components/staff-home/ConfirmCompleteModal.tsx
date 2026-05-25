import type React from "react";


// Componente para mostrar un modal de confirmación al completar una tarea. 
// Se muestra un mensaje de advertencia y dos botones: "Cancelar" y "Sí, completar". El botón de confirmación muestra un spinner de carga mientras se está procesando la acción.
export function ConfirmCompleteModal({
  modalRef,
  confirming,
  onConfirm,
}: {
  modalRef: React.RefObject<HTMLDialogElement | null>;
  confirming: boolean;
  onConfirm: () => void;
}) {
  return (
    <dialog ref={modalRef} className="modal">
      <div className="modal-box max-w-sm p-0 overflow-hidden rounded-2xl">
        <div className="h-1" style={{ background: "linear-gradient(90deg, #10b981, #059669)" }} />
        <div className="px-6 pt-5 pb-4 flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="size-5 text-emerald-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.5}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-bold text-[#0f172a]">Completar tarea</h3>
            <p className="mt-1 text-xs text-slate-500 leading-relaxed">
              ¿Estás seguro de que deseas marcar esta tarea como completada?
            </p>
          </div>
        </div>
        <div className="px-6 py-4 bg-[#f8fafc] border-t border-[#f1f5f9] flex items-center justify-end gap-2">
          <button
            type="button"
            disabled={confirming}
            onClick={() => modalRef.current?.close()}
            className="px-4 py-2 rounded-lg text-sm font-semibold bg-white border border-[#e2e8f0] text-slate-700 hover:bg-slate-50 transition cursor-pointer disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            disabled={confirming}
            onClick={onConfirm}
            className="px-4 py-2 rounded-lg text-sm font-semibold bg-emerald-600 text-white hover:bg-emerald-700 transition cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
          >
            {confirming && <span className="loading loading-spinner loading-xs" />}
            Sí, completar
          </button>
        </div>
      </div>
      <form method="dialog" className="modal-backdrop">
        <button type="submit">close</button>
      </form>
    </dialog>
  );
}
