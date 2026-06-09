import { useMemo } from 'react';
import { Resource } from '../types';

interface TimelineHeaderProps {
  resources: Resource[];
  resourceWidth: number;
  theme?: 'light' | 'dark';
  scrollLeft: number;
}

export function TimelineHeader({
  resources,
  resourceWidth,
  theme = 'light',
  scrollLeft,
}: TimelineHeaderProps) {
  const headerHeight = 40;
  const isDark = theme === 'dark';
  const bgColor = isDark ? 'bg-slate-800' : 'bg-slate-50';
  const textColor = isDark ? 'text-slate-200' : 'text-slate-700';
  const borderColor = isDark ? 'border-slate-700' : 'border-slate-200';

  return (
    <div
      className={`sticky top-0 z-30 flex border-b ${borderColor} ${bgColor}`}
      style={{ height: headerHeight }}
    >
      <div
        className="flex overflow-hidden"
        style={{ transform: `translateX(-${scrollLeft}px)` }}
      >
        {resources.map((resource) => (
          <div
            key={resource.id}
            className={`flex-shrink-0 flex items-center justify-center font-semibold text-sm border-r last:border-r-0 ${borderColor} ${textColor}`}
            style={{ width: resourceWidth, height: headerHeight }}
          >
            {resource.name}
          </div>
        ))}
      </div>
    </div>
  );
}