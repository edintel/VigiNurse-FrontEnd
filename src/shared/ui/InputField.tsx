"use client";
import { InputHTMLAttributes } from "react";
interface InputFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  id: string;
  error?: string;
}
// Componente para renderizar un campo de entrada con etiqueta y manejo de errores
export function InputField({
  label,
  id,
  error,
  required,
  className = "",
  ...props
}: InputFieldProps) {
  return (
    <div className="form-control w-full">
      <label className="label pb-1" htmlFor={id}>
        <span
          className="label-text text-sm font-medium"
          style={{ color: "#1A2B5E" }}
        >
          {label} {required && <span className="text-error">*</span>}
        </span>
      </label>
      <input
        id={id}
        className={`input input-bordered w-full bg-[#FFFFFF] border-[#B0B0B0] text-[#1A2B5E] placeholder:text-[#B0B0B0] focus:border-[#09268E] focus:outline-none ${error ? "input-error" : ""} ${className}`}
        required={required}
        {...props}
      />
      {error && (
        <label className="label pt-1">
          <span className="label-text-alt text-error">{error}</span>
        </label>
      )}
    </div>
  );
}
