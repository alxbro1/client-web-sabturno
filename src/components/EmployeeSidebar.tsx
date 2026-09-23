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
      className={`flex md:flex-col gap-1 md:w-48 shrink-0 overflow-x-auto md:overflow-x-visible rounded-xl border border-border bg-card p-3 ${className}`}
    >
      <button
        type="button"
        onClick={() => onSelect(null)}
        className={`flex min-h-11 items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 ${
          selectedId === null
            ? "bg-primary/10 text-primary"
            : "text-muted-foreground hover:bg-accent hover:text-foreground"
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
          <span className="ml-auto text-xs text-muted-foreground/70">
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
            className={`flex min-h-11 items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 ${
              selectedId === resource.id
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-accent hover:text-foreground"
            }`}
          >
            {resource.avatar ? (
              <img
                src={resource.avatar}
                alt={resource.name}
                className="size-5 shrink-0 rounded-full object-cover"
              />
            ) : (
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ backgroundColor: resource.color || "#3daaf4" }}
              />
            )}
            {resource.name}
            {count !== undefined && (
              <span className="ml-auto text-xs text-muted-foreground/70">{count}</span>
            )}
          </button>
        );
      })}
    </nav>
  );
}
