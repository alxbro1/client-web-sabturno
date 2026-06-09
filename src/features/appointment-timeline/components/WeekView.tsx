import { useMemo, useRef, useState, useCallback } from 'react';
import { format, addDays, startOfWeek, isSameDay } from 'date-fns';
import { es } from 'date-fns/locale/es';
import { generateTimeSlots, getTotalHeight, calculateAppointmentPosition } from '../utils';
import { Appointment, Block, SlotDuration, Resource } from '../types';
import { SLOT_HEIGHTS } from '../constants';
import { TimeSidebar } from './TimeSidebar';
import { AppointmentBlock } from './AppointmentBlock';
import { BlockOverlay } from './BlockOverlay';
import { TimeIndicator } from './TimeIndicator';

interface WeekViewProps {
  date: Date;
  resources: Resource[];
  appointments: Appointment[];
  blocks: Block[];
  startHour: number;
  endHour: number;
  slotDuration: SlotDuration;
  resourceWidth: number;
  theme?: 'light' | 'dark';
  onAppointmentClick?: (appointment: Appointment) => void;
}

const DAY_LABELS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

export function WeekView({
  date,
  resources,
  appointments,
  blocks,
  startHour,
  endHour,
  slotDuration,
  resourceWidth,
  theme = 'light',
  onAppointmentClick,
}: WeekViewProps) {
  const [scrollLeft, setScrollLeft] = useState(0);
  const [scrollTop, setScrollTop] = useState(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const weekStart = useMemo(() => startOfWeek(date, { weekStartsOn: 1 }), [date]);

  const weekDays = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)),
    [weekStart],
  );

  const slots = useMemo(
    () => generateTimeSlots(date, startHour, endHour, slotDuration),
    [date, startHour, endHour, slotDuration],
  );

  const totalHeight = useMemo(
    () => getTotalHeight(startHour, endHour, slotDuration),
    [startHour, endHour, slotDuration],
  );

  const slotHeight = SLOT_HEIGHTS[slotDuration];
  const headerHeight = 40;
  const dayHeaderHeight = 32;
  const resourceHeaderHeight = resources.length > 1 ? 24 : 0;
  const today = new Date();

  const isMultiResource = resources.length > 1;
  const resourceColWidth = isMultiResource ? Math.max(120, resourceWidth / resources.length) : resourceWidth;
  const dayColumnWidth = isMultiResource ? resourceColWidth * resources.length : resourceWidth;

  const appointmentsByDayAndResource = useMemo(() => {
    const map = new Map<string, Appointment[]>();
    weekDays.forEach((d) => {
      resources.forEach((r) => map.set(`${d.toDateString()}|${r.id}`, []));
    });
    appointments.forEach((apt) => {
      const key = `${apt.startAt.toDateString()}|${apt.resourceId}`;
      const arr = map.get(key) || [];
      arr.push(apt);
      map.set(key, arr);
    });
    return map;
  }, [appointments, weekDays, resources]);

  const blocksByDayAndResource = useMemo(() => {
    const map = new Map<string, Block[]>();
    weekDays.forEach((d) => {
      resources.forEach((r) => map.set(`${d.toDateString()}|${r.id}`, []));
    });
    blocks.forEach((block) => {
      const key = `${block.startAt.toDateString()}|${block.resourceId}`;
      const arr = map.get(key) || [];
      arr.push(block);
      map.set(key, arr);
    });
    return map;
  }, [blocks, weekDays, resources]);

  const isDark = theme === 'dark';
  const bgColor = isDark ? 'bg-slate-900' : 'bg-white';
  const headerBg = isDark ? 'bg-slate-800' : 'bg-slate-50';
  const textColor = isDark ? 'text-slate-200' : 'text-slate-700';
  const textMuted = isDark ? 'text-slate-400' : 'text-slate-500';
  const borderColor = isDark ? 'border-slate-700' : 'border-slate-200';
  const rowBg = isDark ? 'bg-slate-800/30' : 'bg-slate-50/50';
  const lineColor = isDark ? 'border-slate-700/30' : 'border-slate-200';
  const todayBg = isDark ? 'bg-blue-900/20' : 'bg-blue-50/50';

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    setScrollLeft(target.scrollLeft);
    setScrollTop(target.scrollTop);
  }, []);

  const totalHeaderHeight = headerHeight + dayHeaderHeight + resourceHeaderHeight;
  const totalGridWidth = dayColumnWidth * 7;

  return (
    <div className="flex flex-1 overflow-hidden">
      <TimeSidebar
        date={date}
        startHour={startHour}
        endHour={endHour}
        slotDuration={slotDuration}
        theme={theme}
        scrollTop={scrollTop}
        headerHeight={totalHeaderHeight}
      />

      <div className="flex flex-col flex-1 overflow-hidden">
        <div className={`sticky top-0 z-30 border-b ${borderColor} ${headerBg}`}>
          {/* Resource name row */}
          <div
            className="flex"
            style={{ height: headerHeight, transform: `translateX(-${scrollLeft}px)`, minWidth: totalGridWidth }}
          >
            {resources.map((resource) => (
              <div
                key={resource.id}
                className={`flex-shrink-0 flex items-center justify-center font-semibold text-sm border-r ${borderColor} ${textColor}`}
                style={{ width: dayColumnWidth, height: headerHeight }}
              >
                {resource.name}
              </div>
            ))}
          </div>

          {/* Day names row */}
          <div
            className="flex"
            style={{ height: dayHeaderHeight, transform: `translateX(-${scrollLeft}px)`, minWidth: totalGridWidth }}
          >
            {weekDays.map((day, idx) => {
              const isToday = isSameDay(day, today);
              return (
                <div
                  key={idx}
                  className={`flex-shrink-0 flex flex-col items-center justify-center text-xs border-r last:border-r-0 ${borderColor} ${
                    isToday ? `${todayBg} font-semibold` : ''
                  } ${isToday ? 'text-[#055a9d]' : textMuted}`}
                  style={{ width: dayColumnWidth, height: dayHeaderHeight }}
                >
                  <span className="font-medium">{DAY_LABELS[idx]}</span>
                  <span className={`text-[10px] ${isToday ? 'text-[#055a9d]' : textMuted}`}>
                    {format(day, 'd', { locale: es })}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Resource sub-headers (only in multi-resource mode) */}
          {isMultiResource && (
            <div
              className="flex"
              style={{ height: resourceHeaderHeight, transform: `translateX(-${scrollLeft}px)`, minWidth: totalGridWidth }}
            >
              {weekDays.map((_, dayIdx) => (
                <div
                  key={dayIdx}
                  className="flex-shrink-0 flex border-r last:border-r-0"
                  style={{ width: dayColumnWidth }}
                >
                  {resources.map((resource) => (
                    <div
                      key={resource.id}
                      className={`flex-shrink-0 flex items-center justify-center text-[10px] border-r last:border-r-0 ${borderColor} ${textMuted}`}
                      style={{ width: resourceColWidth, height: resourceHeaderHeight }}
                    >
                      <span
                        className="w-2 h-2 rounded-full mr-1 flex-shrink-0"
                        style={{ backgroundColor: resource.color || '#94a3b8' }}
                      />
                      <span className="truncate">{resource.name}</span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Grid area */}
        <div
          ref={scrollContainerRef}
          className="flex-1 overflow-auto"
          onScroll={handleScroll}
        >
          <div
            className="relative"
            style={{ width: totalGridWidth, minHeight: totalHeight }}
          >
            {slots.map((slot, idx) => (
              <div
                key={idx}
                className={`border-b ${lineColor} ${idx % 2 === 0 ? rowBg : ''}`}
                style={{ height: slotHeight }}
              />
            ))}

            {weekDays.map((_, idx) => (
              <div
                key={`divider-${idx}`}
                className={`absolute top-0 border-r ${borderColor}`}
                style={{
                  left: (idx + 1) * dayColumnWidth,
                  height: totalHeight,
                }}
              />
            ))}

            {isMultiResource && weekDays.map((_, dayIdx) =>
              resources.slice(1).map((_, resIdx) => (
                <div
                  key={`subdivider-${dayIdx}-${resIdx}`}
                  className={`absolute top-0 border-r ${borderColor} opacity-30`}
                  style={{
                    left: dayIdx * dayColumnWidth + (resIdx + 1) * resourceColWidth,
                    height: totalHeight,
                  }}
                />
              )),
            )}

            <TimeIndicator
              date={date}
              startHour={startHour}
              slotDuration={slotDuration}
              resourceCount={7}
              resourceWidth={dayColumnWidth}
            />

            {weekDays.map((day, dayIdx) => {
              const dayLeft = dayIdx * dayColumnWidth;

              return (
                <div
                  key={dayIdx}
                  className="absolute top-0"
                  style={{ left: dayLeft, width: dayColumnWidth, height: totalHeight }}
                >
                  {resources.map((resource, resIdx) => {
                    const key = `${day.toDateString()}|${resource.id}`;
                    const dayResAppointments = appointmentsByDayAndResource.get(key) || [];
                    const dayResBlocks = blocksByDayAndResource.get(key) || [];
                    const resLeft = resIdx * resourceColWidth;

                    return (
                      <div
                        key={resource.id}
                        className="absolute top-0"
                        style={{ left: resLeft, width: resourceColWidth, height: totalHeight }}
                      >
                        {dayResBlocks.map((block) => {
                          const position = calculateAppointmentPosition(block.startAt, block.endAt, {
                            slotDuration,
                            startHour,
                          });
                          return (
                            <BlockOverlay
                              key={block.id}
                              block={block}
                              top={position.top}
                              height={position.height}
                              width={resourceColWidth - 8}
                              theme={theme}
                            />
                          );
                        })}

                        {dayResAppointments.map((apt) => {
                          const position = calculateAppointmentPosition(apt.startAt, apt.endAt, {
                            slotDuration,
                            startHour,
                          });
                          return (
                            <AppointmentBlock
                              key={apt.id}
                              appointment={apt}
                              top={position.top}
                              height={position.height}
                              width={resourceColWidth - 16}
                              theme={theme}
                              onClick={() => onAppointmentClick?.(apt)}
                            />
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
