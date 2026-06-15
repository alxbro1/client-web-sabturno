"use client";

import type { Resource } from "@/features/appointment-timeline/types";

interface EmployeeSidebarProps {
  resources: Resource[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  appointmentCounts?: Record<string, number>;
  className?: string;
}

export function EmployeeSidebar({
  resources,
  selectedId,
  onSelect,
  appointmentCounts,
  className = "",
}: EmployeeSidebarProps) {
  return (
    <nav
      className={`flex md:flex-col gap-1 md:w-48 shrink-0 overflow-x-auto md:overflow-x-visible ${className}`}
    >
      <button
        type="button"
        onClick={() => onSelect(null)}
        className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
          selectedId === null
            ? "bg-[#00f068]/10 text-[#00f068]"
            : "text-white/70 hover:bg-white/5 hover:text-white"
        }`}
      >
        <span
          className="w-2.5 h-2.5 rounded-full shrink-0"
          style={{
            background:
              "linear-gradient(135deg, #f59e0b 0%, #3b82f6 50%, #22c55e 100%)",
          }}
        />
        Todos
        {appointmentCounts && (
          <span className="ml-auto text-xs text-white/40">
            {Object.values(appointmentCounts).reduce((a, b) => a + b, 0)}
          </span>
        )}
      </button>

      {resources.map((resource) => {
        const count = appointmentCounts?.[resource.id];
        return (
          <button
            type="button"
            key={resource.id}
            onClick={() => onSelect(resource.id)}
            className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
              selectedId === resource.id
                ? "bg-[#00f068]/10 text-[#00f068]"
                : "text-white/70 hover:bg-white/5 hover:text-white"
            }`}
          >
            <span
              className="w-2.5 h-2.5 rounded-full shrink-0"
              style={{ backgroundColor: resource.color || "#3daaf4" }}
            />
            {resource.name}
            {count !== undefined && (
              <span className="ml-auto text-xs text-white/40">{count}</span>
            )}
          </button>
        );
      })}
    </nav>
  );
}
