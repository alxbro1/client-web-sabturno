interface ServiceCategoryTabsProps {
  categories: string[];
  active: string;
  onChange: (category: string) => void;
}

/** Segmented category filter for the service list. Hidden with ≤1 category. */
export function ServiceCategoryTabs({
  categories,
  active,
  onChange,
}: ServiceCategoryTabsProps) {
  if (categories.length <= 1) return null;

  return (
    <div
      role="tablist"
      aria-label="Categorías de servicios"
      className="flex gap-1 overflow-x-auto rounded-xl border border-border bg-card p-1"
    >
      {categories.map((category) => {
        const isActive = category === active;
        return (
          <button
            key={category}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(category)}
            className={`flex-1 shrink-0 whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-medium transition-colors outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 ${
              isActive
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {category}
          </button>
        );
      })}
    </div>
  );
}
