import { useEffect, useState, useMemo } from 'react';
import { startOfDay, differenceInMinutes, format } from 'date-fns';
import { SlotDuration } from '../types';
import { SLOT_HEIGHTS } from '../constants';

interface TimeIndicatorProps {
  date: Date;
  startHour: number;
  slotDuration: SlotDuration;
  resourceCount: number;
  resourceWidth: number;
}

export function TimeIndicator({
  date,
  startHour,
  slotDuration,
  resourceCount,
  resourceWidth,
}: TimeIndicatorProps) {
  const [now, setNow] = useState(new Date());
  const timeLabel = useMemo(() => format(now, 'HH:mm'), [now]);

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(interval);
  }, []);

  const dayStart = startOfDay(date);
  const configStart = new Date(dayStart);
  configStart.setHours(startHour, 0, 0, 0);

  const minutesFromStart = differenceInMinutes(now, configStart);

  if (minutesFromStart < 0 || minutesFromStart > (24 - startHour) * 60) {
    return null;
  }

  const slotHeight = SLOT_HEIGHTS[slotDuration];
  const top = (minutesFromStart / slotDuration) * slotHeight;
  const width = resourceCount * resourceWidth;

  return (
    <div
      className="absolute left-0 right-0 z-30 pointer-events-none"
      style={{ top }}
    >
      <div className="flex items-center">
        <div className="relative">
          <div className="w-2 h-2 rounded-full bg-red-500" />
          <span className="absolute right-full top-1/2 -translate-y-1/2 mr-1 px-1 py-0.5 text-[10px] font-semibold text-red-500 bg-white/90 dark:bg-slate-900/90 rounded whitespace-nowrap">
            {timeLabel}
          </span>
        </div>
        <div
          className="h-0.5 bg-red-500"
          style={{ width }}
        />
      </div>
    </div>
  );
}
