"use client";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

// Tipado de las etiquetas web de Cally para poder usarlas en JSX sin errores de TypeScript.
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
  max?: string;
  variant?: "modal" | "filter";
  inputClassName?: string;
  labelClassName?: string;
}

const MESES = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];

// Genera un rango de años desde 120 años atrás hasta 10 años en el futuro.
function buildYearRange(): number[] {
  const current = new Date().getFullYear();
  const years: number[] = [];
  for (let y = current + 10; y >= current - 120; y--) {
    years.push(y);
  }
  return years;
}

const YEAR_RANGE = buildYearRange();

// Obtiene el año desde un valor YYYY-MM-DD, o el año actual como fallback.
function yearFrom(val: string): number {
  if (val) {
    const y = parseInt(val.split("-")[0]);
    if (!isNaN(y)) return y;
  }
  return new Date().getFullYear();
}

// Obtiene el mes (1-12) desde un valor YYYY-MM-DD, o el mes actual como fallback.
function monthFrom(val: string): number {
  if (val) {
    const m = parseInt(val.split("-")[1]);
    if (!isNaN(m)) return m;
  }
  return new Date().getMonth() + 1;
}

// Convierte YYYY-MM-DD a DD/MM/YYYY para mostrarlo en el botón.
// Si no hay valor válido, muestra el placeholder.
function formatDisplay(val: string, placeholder: string): string {
  if (!val) return placeholder;
  const parts = val.split("-");
  if (parts.length !== 3) return val;
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

// Componente principal que renderiza un botón para abrir el calendario y el calendario en un dropdown posicionado.
// Incluye selectores de mes y año para navegar rápidamente sin ir mes a mes.
export function CallyDatePicker({
  id,
  label,
  value,
  onChange,
  required,
  error,
  placeholder = "Seleccionar fecha",
  min,
  max,
  variant = "modal",
  inputClassName,
  labelClassName,
}: CallyDatePickerProps) {
  const [open, setOpen] = useState(false);
  const [dropCoords, setDropCoords] = useState<{
    top: number;
    left: number;
    width: number;
  } | null>(null);
  const [dropMaxHeight, setDropMaxHeight] = useState<number | null>(null);
  const [portalTarget, setPortalTarget] = useState<Element | null>(null);

  // Estado de navegación del calendario (mes/año mostrado)
  const [viewYear, setViewYear] = useState<number>(() => yearFrom(value));
  const [viewMonth, setViewMonth] = useState<number>(() => monthFrom(value));

  // Valor que se sincroniza con el web component de cally.
  // Puede ser la fecha seleccionada o una fecha de navegación (primer día del mes).
  const [calValue, setCalValue] = useState<string>(value || "");

  const triggerRef = useRef<HTMLButtonElement>(null);
  const dropRef = useRef<HTMLDivElement>(null);
  const calRef = useRef<HTMLElement>(null);

  // Evita que el dropdown se salga de la pantalla: clamp horizontal, flip vertical y max-height con scroll.
  useLayoutEffect(() => {
    if (!open) {
      setDropMaxHeight(null);
      return;
    }

    const MARGIN = 8;
    const GAP = 4;
    const MIN_WIDTH = 280;

    function clamp(n: number, min: number, max: number) {
      return Math.min(Math.max(n, min), max);
    }

    function updatePosition() {
      const triggerEl = triggerRef.current;
      const dropEl = dropRef.current;
      if (!triggerEl || !dropEl) return;

      const tRect = triggerEl.getBoundingClientRect();
      const vw = window.innerWidth || document.documentElement.clientWidth;
      const vh = window.innerHeight || document.documentElement.clientHeight;

      const desiredWidth = Math.max(
        MIN_WIDTH,
        Math.min(tRect.width, vw - MARGIN * 2),
      );

      // El dropdown ya está renderizado: usamos su tamaño real.
      const dRect = dropEl.getBoundingClientRect();

      const maxLeft = Math.max(MARGIN, vw - desiredWidth - MARGIN);
      const nextLeft = clamp(tRect.left, MARGIN, maxLeft);

      const spaceBelow = vh - (tRect.bottom + GAP) - MARGIN;
      const spaceAbove = tRect.top - GAP - MARGIN;
      const shouldFlip = dRect.height > spaceBelow && spaceAbove > spaceBelow;

      const nextTop = shouldFlip
        ? Math.max(MARGIN, tRect.top - GAP - dRect.height)
        : tRect.bottom + GAP;

      const available = Math.max(0, shouldFlip ? spaceAbove : spaceBelow);
      const nextMaxHeight = Math.max(80, available);

      setDropCoords((prev) => {
        const prevTop = prev?.top;
        const prevLeft = prev?.left;
        const prevWidth = prev?.width;
        const changed =
          prevTop == null ||
          prevLeft == null ||
          prevWidth == null ||
          Math.abs(prevTop - nextTop) >= 1 ||
          Math.abs(prevLeft - nextLeft) >= 1 ||
          Math.abs(prevWidth - desiredWidth) >= 1;
        if (!changed) return prev;
        return { top: nextTop, left: nextLeft, width: desiredWidth };
      });

      setDropMaxHeight((prev) => (prev === nextMaxHeight ? prev : nextMaxHeight));
    }

    const raf = window.requestAnimationFrame(updatePosition);
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    return () => {
      window.cancelAnimationFrame(raf);
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [open, viewMonth, viewYear]);

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
        setCalValue(target.value);
        setViewYear(yearFrom(target.value));
        setViewMonth(monthFrom(target.value));
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

  // Sincroniza calValue con el web component interno.
  useEffect(() => {
    const el = calRef.current as (HTMLElement & { value?: string }) | null;
    if (el && el.value !== calValue) el.value = calValue;
  }, [calValue]);

  // Cuando el valor externo cambia, actualiza calValue y la navegación.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    setCalValue(value || "");
    if (value) {
      setViewYear(yearFrom(value));
      setViewMonth(monthFrom(value));
    }
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

      // Al abrir, posicionar la vista en la fecha seleccionada o en el mes actual.
      if (value) {
        setViewYear(yearFrom(value));
        setViewMonth(monthFrom(value));
        setCalValue(value);
      } else {
        const now = new Date();
        setViewYear(now.getFullYear());
        setViewMonth(now.getMonth() + 1);
        setCalValue("");
      }
    }
    setOpen((v) => !v);
  }

  // Navega a un año específico manteniendo el mes actual.
  function handleYearChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const year = parseInt(e.target.value);
    setViewYear(year);
    const nav = `${year}-${String(viewMonth).padStart(2, "0")}-01`;
    setCalValue(nav);
  }

  // Navega a un mes específico manteniendo el año actual.
  function handleMonthChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const month = parseInt(e.target.value);
    setViewMonth(month);
    const nav = `${viewYear}-${String(month).padStart(2, "0")}-01`;
    setCalValue(nav);
  }

  const isFilter = variant === "filter";

  const labelEl = isFilter ? (
    <span className={`text-xs font-semibold text-slate-500 uppercase tracking-[0.5px] leading-none ${labelClassName ?? ""}`}>
      {label}
    </span>
  ) : (
    <span className={`text-sm font-medium ${labelClassName ?? ""}`} style={{ color: "#1A2B5E" }}>
      {label} {required && <span className="text-red-500">*</span>}
    </span>
  );

  const btnCls = isFilter
    ? [
        "bg-white border border-[#e2e8f0] rounded py-2 px-3 text-sm focus:outline-none focus:border-[#09268E] transition-colors w-full flex items-center justify-between gap-2",
        error ? "border-red-400" : "",
        inputClassName ?? "",
      ].join(" ")
    : [
        "input input-bordered h-12 w-full border-[#B0B0B0] text-left flex items-center justify-between gap-2 focus:border-[#09268E] focus:outline-none",
        error ? "input-error" : "",
        inputClassName ?? "",
      ].join(" ");

  const textCls = isFilter
    ? value
      ? "text-slate-900"
      : "text-gray-400"
    : value
      ? "text-[#1A2B5E] text-sm"
      : "text-[#B0B0B0] text-sm";

  const navSelectCls =
    "text-xs font-semibold border border-[#e2e8f0] rounded px-2 py-1 bg-white text-[#1A2B5E] focus:outline-none focus:border-[#09268E] cursor-pointer";

  return (
    <div className={`flex flex-col w-full ${isFilter ? "gap-1" : "gap-1.5"}`}>
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
	              width: dropCoords.width,
	              zIndex: 9999,
	              maxHeight: dropMaxHeight ?? undefined,
	              overflowY: dropMaxHeight ? "auto" : undefined,
	            }}
	            className="bg-base-100 rounded-box shadow-lg border border-[#E2E8F0]"
	          >
            {/* Selectores de mes y año para navegación rápida */}
            <div className="flex items-center gap-2 px-3 py-2 border-b border-[#f1f5f9]">
              <select
                className={navSelectCls}
                value={viewMonth}
                onChange={handleMonthChange}
                onMouseDown={(e) => e.stopPropagation()}
              >
                {MESES.map((m, i) => (
                  <option key={i + 1} value={i + 1}>
                    {m}
                  </option>
                ))}
              </select>
              <select
                className={navSelectCls}
                value={viewYear}
                onChange={handleYearChange}
                onMouseDown={(e) => e.stopPropagation()}
              >
                {YEAR_RANGE.filter((y) =>
                  max ? y <= parseInt(max.split("-")[0]) : true,
                ).map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>

            <calendar-date
              ref={calRef}
              class="cally"
              value={calValue || undefined}
              min={min}
              max={max}
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
