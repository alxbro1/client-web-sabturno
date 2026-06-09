import { useMemo, useCallback } from 'react';
import { format, addDays, subDays, startOfWeek, endOfWeek } from 'date-fns';
import { es } from 'date-fns/locale/es';
import type { ViewMode } from '../types';

interface WeekDateSelectorProps {
  date: Date;
  viewMode: ViewMode;
  onDateChange: (date: Date) => void;
  onViewModeChange: (mode: ViewMode) => void;
  theme?: 'light' | 'dark';
}

export function WeekDateSelector({
  date,
  viewMode,
  onDateChange,
  onViewModeChange,
  theme = 'light',
}: WeekDateSelectorProps) {
  const isDark = theme === 'dark';
  const bgColor = isDark ? 'bg-slate-800' : 'bg-white';
  const textColor = isDark ? 'text-slate-100' : 'text-slate-800';
  const textMuted = isDark ? 'text-slate-400' : 'text-slate-500';
  const borderColor = isDark ? 'border-slate-600' : 'border-slate-200';
  const hoverBg = isDark ? 'hover:bg-slate-700' : 'hover:bg-slate-100';
  const activeBg = 'bg-[#055a9d] text-white';
  const inactiveBg = isDark ? 'bg-slate-700 text-slate-300' : 'bg-slate-100 text-slate-600';

  const weekStart = useMemo(() => startOfWeek(date, { weekStartsOn: 1 }), [date]);
  const weekEnd = useMemo(() => endOfWeek(date, { weekStartsOn: 1 }), [date]);

  const weekLabel = useMemo(() => {
    const startStr = format(weekStart, "d 'de' MMM", { locale: es });
    const endStr = format(weekEnd, "d 'de' MMM 'de' yyyy", { locale: es });
    return `${startStr} – ${endStr}`;
  }, [weekStart, weekEnd]);

  const handlePrev = useCallback(() => {
    if (viewMode === 'week') {
      onDateChange(subDays(date, 7));
    } else {
      onDateChange(subDays(date, 1));
    }
  }, [date, viewMode, onDateChange]);

  const handleNext = useCallback(() => {
    if (viewMode === 'week') {
      onDateChange(addDays(date, 7));
    } else {
      onDateChange(addDays(date, 1));
    }
  }, [date, viewMode, onDateChange]);

  const handleToday = useCallback(() => {
    onDateChange(new Date());
  }, [onDateChange]);

  return (
    <div className={`flex items-center justify-between px-4 py-2 border-b ${borderColor} ${bgColor}`}>
      <div className="flex items-center gap-3">
        <button
          onClick={handlePrev}
          className={`p-1.5 rounded-md transition-colors ${hoverBg} ${textColor}`}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>

        <button
          onClick={handleToday}
          className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${hoverBg} ${textMuted}`}
        >
          Hoy
        </button>

        <button
          onClick={handleNext}
          className={`p-1.5 rounded-md transition-colors ${hoverBg} ${textColor}`}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 18l6-6-6-6" />
          </svg>
        </button>

        <span className={`text-sm font-medium capitalize ${textColor}`}>
          {viewMode === 'week' ? weekLabel : format(date, "EEEE, d 'de' MMMM 'de' yyyy", { locale: es })}
        </span>
      </div>

      <div className={`flex rounded-md overflow-hidden border ${borderColor}`}>
        <button
          onClick={() => onViewModeChange('day')}
          className={`px-3 py-1 text-xs font-medium transition-colors ${viewMode === 'day' ? activeBg : inactiveBg} hover:opacity-90`}
        >
          Día
        </button>
        <button
          onClick={() => onViewModeChange('week')}
          className={`px-3 py-1 text-xs font-medium transition-colors ${viewMode === 'week' ? activeBg : inactiveBg} hover:opacity-90`}
        >
          Semana
        </button>
      </div>
    </div>
  );
}
