import type { ReactNode } from "react";

interface FieldProps {
  label: string;
  value: ReactNode;
}

export function Field({ label, value }: FieldProps) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[10px] font-bold uppercase tracking-[0.5px] text-[#94a3b8]">{label}</span>
      <span className="text-sm font-semibold text-[#334155]">{value ?? "—"}</span>
    </div>
  );
}
