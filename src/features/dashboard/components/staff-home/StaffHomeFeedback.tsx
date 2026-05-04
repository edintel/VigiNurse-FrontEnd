import type React from "react";

export function LoadingSkeleton() {
  return (
    <div className="space-y-5 animate-pulse">
      <div className="bg-white rounded-2xl border border-[#e2e8f0] p-6 space-y-4">
        <div className="flex gap-4">
          <div className="flex-1 space-y-2">
            <div className="h-3 bg-[#f1f5f9] rounded w-20" />
            <div className="h-6 bg-[#f1f5f9] rounded w-48" />
            <div className="h-4 bg-[#f1f5f9] rounded w-16" />
          </div>
          <div className="h-9 w-28 bg-[#f1f5f9] rounded-lg" />
        </div>
        <div className="grid grid-cols-3 gap-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-[68px] bg-[#f1f5f9] rounded-xl" />
          ))}
        </div>
      </div>
      <div className="h-12 bg-[#f1f5f9] rounded-xl w-96" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-44 bg-[#f1f5f9] rounded-xl" />
        ))}
      </div>
    </div>
  );
}

export function EmptyState({
  icon,
  title,
  subtitle,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-[#e2e8f0] py-12 flex flex-col items-center gap-3">
      <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-300">
        {icon}
      </div>
      <div className="text-center">
        <p className="text-sm font-semibold text-[#0f172a]">{title}</p>
        {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
      </div>
    </div>
  );
}
