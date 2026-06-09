import { Resource } from '../types';
import { TIMELINE_CONSTANTS } from '../constants';

interface ResourceSidebarProps {
  resources: Resource[];
  totalHeight: number;
  timeColumnWidth: number;
  theme: 'light' | 'dark';
  scrollTop: number;
}

export function ResourceSidebar({
  resources,
  totalHeight,
  timeColumnWidth,
  theme,
  scrollTop,
}: ResourceSidebarProps) {
  const headerHeight = 68;
  const bgColor = theme === 'light' ? 'bg-slate-50' : 'bg-slate-800';
  const borderColor = theme === 'light' ? 'border-slate-300' : 'border-slate-600';
  const textColor = theme === 'light' ? 'text-slate-700' : 'text-slate-200';
  const resourceBg = theme === 'light' ? 'bg-white' : 'bg-slate-700/50';

  return (
    <div
      className={`sticky left-0 z-10 flex-shrink-0 ${bgColor} border-r ${borderColor}`}
      style={{ width: timeColumnWidth }}
    >
      <div
        className={`flex items-center justify-center border-b-2 font-bold uppercase text-xs tracking-wide ${borderColor} ${textColor}`}
        style={{ height: 40 }}
      >
        <span className="transform -rotate-45 origin-center whitespace-nowrap">
          Recursos
        </span>
      </div>

      <div
        className={`flex items-center justify-center border-b font-medium text-xs ${borderColor} ${textColor}`}
        style={{ height: 28 }}
      >
        {resources.length > 1 ? `${resources.length} empleados` : 'Empleado'}
      </div>

      <div
        className="overflow-hidden"
        style={{ transform: `translateY(-${scrollTop}px)` }}
      >
        {resources.map((resource) => (
          <div
            key={resource.id}
            className={`flex items-center justify-center border-b last:border-b-0 ${borderColor} ${resourceBg}`}
            style={{ height: TIMELINE_CONSTANTS.DEFAULT_SLOT_HEIGHT }}
          >
            <span className={`text-sm font-medium truncate px-2 ${textColor}`}>
              {resource.name}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}