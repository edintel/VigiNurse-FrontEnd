"use client";
import { useState } from "react";
interface PasswordInputProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  hasError?: boolean;
  errorMessage?: string;
}
// Componente de entrada de contraseña con funcionalidad de mostrar/ocultar y manejo de errores
export function PasswordInput({
  id,
  label,
  value,
  onChange,
  disabled,
  hasError,
  errorMessage,
}: PasswordInputProps) {
  const [show, setShow] = useState(false);
  return (
    <fieldset className="fieldset p-0 gap-2 border-0">
      <label
        className="label text-sm font-semibold text-slate-700"
        htmlFor={id}
      >
        {label}
      </label>

      <label
        className={`input w-full bg-white border-slate-300 focus-within:border-[#092168] focus-within:outline-none ${hasError ? "input-error" : ""}`}
      >
        <input
          id={id}
          type={show ? "text" : "password"}
          autoComplete="new-password"
          required
          disabled={disabled}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          className={`swap ${show ? "swap-active" : ""} opacity-40 hover:opacity-70 transition-opacity`}
          tabIndex={-1}
          aria-label={show ? "Ocultar contraseña" : "Mostrar contraseña"}
        >
          <svg
            className="swap-on"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
            <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
            <line x1="1" y1="1" x2="23" y2="23" />
          </svg>

          <svg
            className="swap-off"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
        </button>
      </label>

      {hasError && errorMessage && (
        <p className="text-xs text-error m-0">{errorMessage}</p>
      )}
    </fieldset>
  );
}
