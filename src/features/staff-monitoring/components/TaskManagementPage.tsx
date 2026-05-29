"use client";
import React, { useState } from "react";
import { TasksTab } from "./tasks/TasksTab";
import { TaskTypesTab } from "./tasks/TaskTypesTab";

type SubTab = "tasks" | "tipos";

const SUB_TABS: { key: SubTab; label: string; icon: React.ReactNode }[] = [
  {
    key: "tasks",
    label: "Tareas",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
      </svg>
    ),
  },
  {
    key: "tipos",
    label: "Tipos de tarea",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 0 0 3 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 0 0 5.223-5.223c.542-.827.369-1.908-.33-2.607L9.568 3Z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6Z" />
      </svg>
    ),
  },
];

// Pagina principal de gestion de tasks, con sub-tabs para tasks y tipos de tarea
export default function TaskManagementPage() {
  const [subTab, setSubTab] = useState<SubTab>("tasks");

  return (
    <div className="space-y-5">
      {/* Sub-tabs */}
      <div className="flex items-center gap-1 overflow-x-auto pb-0.5 scrollbar-none">
        {SUB_TABS.map(({ key, label, icon }) => (
          <button
            key={key}
            type="button"
            onClick={() => setSubTab(key)}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition shrink-0 ${
              subTab === key
                ? "bg-[#09268E] text-white shadow-sm"
                : "text-slate-500 hover:text-[#09268E] hover:bg-[#eff6ff]"
            }`}
          >
            {icon}
            {label}
          </button>
        ))}
      </div>

      {subTab === "tasks" && <TasksTab />}
      {subTab === "tipos" && <TaskTypesTab />}
    </div>
  );
}
