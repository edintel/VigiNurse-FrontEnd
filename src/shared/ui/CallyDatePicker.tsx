"use client";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

// TIpado de las etiquetas web de Cally para poder usarlas en JSX sin errores de TypeScript.
declare global {
  namespace React {
    namespace JSX {
      interface IntrinsicElements {
        "calendar-date": React.DetailedHTMLProps<
          React.HTMLAttributes<HTMLElement> & {
            value?: string;
            class?: string;
            min?: string;
            max?: string;
          },
          HTMLElement
        >;
        "calendar-month": React.DetailedHTMLProps<
          React.HTMLAttributes<HTMLElement> & { class?: string },
          HTMLElement
        >;
      }
    }
  }
}

// Interface de props para el componente CallyDatePicker, con valor controlado en formato YYYY-MM-DD y opciones de configuración para estilos y validación.
interface CallyDatePickerProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  error?: string;
  placeholder?: string;
  min?: string;
  variant?: "modal" | "filter";
}

// Convierte YYYY-MM-DD a DD/MM/YYYY para mostrarlo en el botón.
// Si no hay valor válido, muestra el placeholder.
function formatDisplay(val: string, placeholder: string): string {
  if (!val) return placeholder;
  const parts = val.split("-");
  if (parts.length !== 3) return val;
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

// Componente principal que renderiza un botón para abrir el calendario y el calendario en un dropdown posicionado. Maneja la lógica de apertura/cierre, sincronización del valor controlado y propagación de cambios al padre.
export function CallyDatePicker({
  id,
  label,
  value,
  onChange,
  required,
  error,
  placeholder = "Seleccionar fecha",
  min,
  variant = "modal",
}: CallyDatePickerProps) {
  const [open, setOpen] = useState(false);
  const [dropCoords, setDropCoords] = useState<{
    top: number;
    left: number;
    width: number;
  } | null>(null);
  const [portalTarget, setPortalTarget] = useState<Element | null>(null);

  const triggerRef = useRef<HTMLButtonElement>(null);
  const dropRef = useRef<HTMLDivElement>(null);
  const calRef = useRef<HTMLElement>(null);

  // Carga dinámicamente la librería del web component solo en cliente.
  useEffect(() => {
    import("cally").catch(() => {});
  }, []);

  // Escucha el evento "change" del web component para propagar el valor al padre.
  // Cuando hay selección válida, también cerramos el calendario.
  useEffect(() => {
    const el = calRef.current;
    if (!el) return;
    function handleChange(e: Event) {
      const target = e.target as HTMLElement & { value?: string };
      if (target.value) {
        onChange(target.value);
        setOpen(false);
      }
    }
    el.addEventListener("change", handleChange);
    return () => el.removeEventListener("change", handleChange);
  });

  // Cierra el dropdown al hacer click fuera del botón disparador y del calendario.
  useEffect(() => {
    function handleOutside(e: MouseEvent) {
      const target = e.target as Node;
      const insideTrigger = triggerRef.current?.contains(target) ?? false;
      const insideDrop = dropRef.current?.contains(target) ?? false;
      if (!insideTrigger && !insideDrop) setOpen(false);
    }
    if (open) document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, [open]);

  // Mantiene sincronizado el valor controlado externo con el web component interno.
  useEffect(() => {
    const el = calRef.current as (HTMLElement & { value?: string }) | null;
    if (el && el.value !== value) el.value = value;
  }, [value]);

  // Abre/cierra el calendario y calcula posición fija para renderizar el dropdown.
  // El portal se monta en <dialog> si existe para respetar el top-layer de modales.
  function handleToggle() {
    if (!open && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setDropCoords({
        top: rect.bottom + 4,
        left: rect.left,
        width: rect.width,
      });
      const dialog = triggerRef.current.closest("dialog");
      setPortalTarget(dialog ?? document.body);
    }
    setOpen((v) => !v);
  }

  const isFilter = variant === "filter";

  const labelEl = isFilter ? (
    <span className="text-xs font-semibold text-slate-500 uppercase tracking-[0.5px] leading-none">
      {label}
    </span>
  ) : (
    <span className="text-sm font-medium" style={{ color: "#1A2B5E" }}>
      {label} {required && <span className="text-red-500">*</span>}
    </span>
  );

  const btnCls = isFilter
    ? [
        "bg-white border border-[#e2e8f0] rounded py-2 px-3 text-sm focus:outline-none focus:border-[#09268E] transition-colors w-full flex items-center justify-between gap-2",
        error ? "border-red-400" : "",
      ].join(" ")
    : [
        "input input-bordered h-12 w-full bg-[#EEEEEE] border-[#B0B0B0] text-left flex items-center justify-between gap-2 focus:border-[#09268E] focus:outline-none",
        error ? "input-error" : "",
      ].join(" ");

  const textCls = isFilter
    ? value
      ? "text-slate-900"
      : "text-gray-400"
    : value
      ? "text-[#1A2B5E] text-sm"
      : "text-[#B0B0B0] text-sm";

  return (
    <div className={`flex flex-col w-full ${isFilter ? "gap-1" : "gap-2"}`}>
      {labelEl}

      <button
        ref={triggerRef}
        id={id}
        type="button"
        onClick={handleToggle}
        className={btnCls}
      >
        <span className={textCls}>{formatDisplay(value, placeholder)}</span>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth="1.5"
          stroke="currentColor"
          className="size-4 text-[#B0B0B0] shrink-0"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5"
          />
        </svg>
      </button>

      {/* Renderizamos el calendario en un portal para evitar recortes por overflow y problemas de z-index. */}
      {open &&
        dropCoords &&
        portalTarget &&
        createPortal(
          <div
            ref={dropRef}
            style={{
              position: "fixed",
              top: dropCoords.top,
              left: dropCoords.left,
              zIndex: 9999,
            }}
            className="bg-base-100 rounded-box shadow-lg border border-[#E2E8F0]"
          >
            <calendar-date
              ref={calRef}
              class="cally"
              value={value || undefined}
              min={min}
            >
              <svg
                aria-label="Previous"
                className="fill-current size-4"
                slot="previous"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
              >
                <path d="M15.75 19.5 8.25 12l7.5-7.5" />
              </svg>
              <svg
                aria-label="Next"
                className="fill-current size-4"
                slot="next"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
              >
                <path d="m8.25 4.5 7.5 7.5-7.5 7.5" />
              </svg>
              <calendar-month />
            </calendar-date>
          </div>,
          portalTarget,
        )}

      {error && <span className="text-xs text-red-500 mt-0.5">{error}</span>}
    </div>
  );
}
