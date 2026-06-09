import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  format,
  addDays,
  subDays,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameDay,
  isSameMonth,
  addMonths,
  subMonths,
} from 'date-fns';
import { es } from 'date-fns/locale/es';

interface DateSelectorProps {
  date: Date;
  onDateChange: (date: Date) => void;
  theme?: 'light' | 'dark';
}

const DAY_NAMES = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

export function DateSelector({ date, onDateChange, theme = 'light' }: DateSelectorProps) {
  const [showCalendar, setShowCalendar] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(date);
  const [buttonPosition, setButtonPosition] = useState<{ top: number; right: number } | null>(null);
  const popupRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const isDark = theme === 'dark';
  const bgColor = isDark ? 'bg-slate-800' : 'bg-white';
  const textColor = isDark ? 'text-slate-100' : 'text-slate-800';
  const textMuted = isDark ? 'text-slate-400' : 'text-slate-500';
  const borderColor = isDark ? 'border-slate-600' : 'border-slate-200';
  const hoverBg = isDark ? 'hover:bg-slate-700' : 'hover:bg-slate-100';
  const selectedBg = 'bg-[#055a9d] text-white';
  const todayBg = isDark ? 'bg-slate-600' : 'bg-slate-100';

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        popupRef.current &&
        !popupRef.current.contains(e.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(e.target as Node)
      ) {
        setShowCalendar(false);
      }
    };
    if (showCalendar) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showCalendar]);

  const handlePrevDay = useCallback(() => {
    onDateChange(subDays(date, 1));
  }, [date, onDateChange]);

  const handleNextDay = useCallback(() => {
    onDateChange(addDays(date, 1));
  }, [date, onDateChange]);

  const handleToday = useCallback(() => {
    onDateChange(new Date());
  }, [onDateChange]);

  const handleSelectDate = useCallback(
    (selected: Date) => {
      onDateChange(selected);
      setShowCalendar(false);
    },
    [onDateChange]
  );

  const formattedDate = format(date, "EEEE, d 'de' MMMM 'de' yyyy", { locale: es });

  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const calStart = startOfWeek(monthStart, { weekStartsOn: 1 });
    const calEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
    return eachDayOfInterval({ start: calStart, end: calEnd });
  }, [currentMonth]);

  const handlePrevMonth = useCallback(() => {
    setCurrentMonth(subMonths(currentMonth, 1));
  }, [currentMonth]);

  const handleNextMonth = useCallback(() => {
    setCurrentMonth(addMonths(currentMonth, 1));
  }, [currentMonth]);

  const monthLabel = format(currentMonth, 'MMMM yyyy', { locale: es });

  return (
    <div className={`flex items-center justify-between px-4 py-2 border-b ${borderColor} ${bgColor}`}>
      <div className="flex items-center gap-3">
        <button
          onClick={handlePrevDay}
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
          onClick={handleNextDay}
          className={`p-1.5 rounded-md transition-colors ${hoverBg} ${textColor}`}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 18l6-6-6-6" />
          </svg>
        </button>

        <span className={`text-sm font-medium capitalize ${textColor}`}>
          {formattedDate}
        </span>
      </div>

      <div className="relative" ref={popupRef}>
        <button
          ref={buttonRef}
          onClick={() => {
            if (!showCalendar && buttonRef.current) {
              const rect = buttonRef.current.getBoundingClientRect();
              setButtonPosition({
                top: rect.bottom + 8,
                right: window.innerWidth - rect.right,
              });
            }
            setShowCalendar(!showCalendar);
          }}
          className={`p-1.5 rounded-md transition-colors ${hoverBg} ${textColor}`}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
        </button>

        {showCalendar && buttonPosition && createPortal(
          <div
            ref={popupRef}
            className={`fixed z-[9999] w-72 rounded-xl shadow-xl border ${borderColor} ${bgColor} p-4`}
            style={{
              top: buttonPosition.top,
              right: buttonPosition.right,
            }}
          >
            <div className="flex items-center justify-between mb-3">
              <button
                onClick={handlePrevMonth}
                className={`p-1 rounded-md transition-colors ${hoverBg} ${textColor}`}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M15 18l-6-6 6-6" />
                </svg>
              </button>

              <span className={`text-sm font-semibold capitalize ${textColor}`}>
                {monthLabel}
              </span>

              <button
                onClick={handleNextMonth}
                className={`p-1 rounded-md transition-colors ${hoverBg} ${textColor}`}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 18l6-6-6-6" />
                </svg>
              </button>
            </div>

            <div className="grid grid-cols-7 mb-2">
              {DAY_NAMES.map((day) => (
                <div
                  key={day}
                  className={`text-center text-xs font-medium py-1 ${textMuted}`}
                >
                  {day}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-0.5">
              {calendarDays.map((day, idx) => {
                const isSelected = isSameDay(day, date);
                const isToday = isSameDay(day, new Date());
                const isCurrentMonth = isSameMonth(day, currentMonth);

                let cellClass = `text-center text-sm py-1.5 rounded-md cursor-pointer transition-colors ${hoverBg} ${textColor}`;

                if (isSelected) {
                  cellClass = `text-center text-sm py-1.5 rounded-md cursor-pointer ${selectedBg}`;
                } else if (isToday) {
                  cellClass = `text-center text-sm py-1.5 rounded-md cursor-pointer font-semibold ${todayBg} ${textColor}`;
                } else if (!isCurrentMonth) {
                  cellClass = `text-center text-sm py-1.5 rounded-md cursor-pointer ${textMuted}`;
                }

                return (
                  <button
                    key={idx}
                    onClick={() => handleSelectDate(day)}
                    className={cellClass}
                  >
                    {format(day, 'd')}
                  </button>
                );
              })}
            </div>
          </div>,
          document.body
        )}
      </div>
    </div>
  );
}