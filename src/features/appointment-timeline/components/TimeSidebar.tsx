import { useMemo } from 'react';
import { generateTimeSlots } from '../utils';
import { SlotDuration } from '../types';
import { SLOT_HEIGHTS } from '../constants';

interface TimeSidebarProps {
  date: Date;
  startHour: number;
  endHour: number;
  slotDuration: SlotDuration;
  theme?: 'light' | 'dark';
  scrollTop: number;
  headerHeight: number;
}

export function TimeSidebar({
  date,
  startHour,
  endHour,
  slotDuration,
  theme = 'light',
  scrollTop,
  headerHeight,
}: TimeSidebarProps) {
  const slots = useMemo(
    () => generateTimeSlots(date, startHour, endHour, slotDuration),
    [date, startHour, endHour, slotDuration]
  );

  const slotHeight = SLOT_HEIGHTS[slotDuration];
  const isDark = theme === 'dark';
  const bgColor = isDark ? 'bg-slate-900' : 'bg-white';
  const textColor = isDark ? 'text-slate-400' : 'text-slate-500';
  const borderColor = isDark ? 'border-slate-700' : 'border-slate-200';

  return (
    <div
      className={`sticky left-0 z-20 flex-shrink-0 w-16 border-r ${borderColor} ${bgColor}`}
    >
      <div style={{ height: headerHeight }} />

      <div
        className="relative overflow-hidden"
        style={{ height: `calc(100% - ${headerHeight}px)` }}
      >
        <div style={{ transform: `translateY(-${scrollTop}px)` }}>
          {slots.map((slot, idx) => (
            <div
              key={idx}
              className={`flex items-start justify-end pr-2 text-xs font-medium ${textColor}`}
              style={{ height: slotHeight }}
            >
              <span className="-mt-2">{slot.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
