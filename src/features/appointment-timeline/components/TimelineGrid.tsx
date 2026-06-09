import { useMemo, RefObject } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { generateTimeSlots, getTotalHeight, calculateAppointmentPosition } from '../utils';
import { Appointment, Block, SlotDuration } from '../types';
import { SLOT_HEIGHTS } from '../constants';
import { AppointmentBlock } from './AppointmentBlock';
import { BlockOverlay } from './BlockOverlay';
import { TimeIndicator } from './TimeIndicator';

interface TimelineGridProps {
  date: Date;
  resources: { id: string; name: string }[];
  appointments: Appointment[];
  blocks: Block[];
  startHour: number;
  endHour: number;
  slotDuration: SlotDuration;
  resourceWidth: number;
  theme?: 'light' | 'dark';
  onAppointmentClick?: (appointment: Appointment) => void;
  scrollContainerRef?: RefObject<HTMLDivElement | null>;
}

export function TimelineGrid({
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
  scrollContainerRef,
}: TimelineGridProps) {
  const slots = useMemo(
    () => generateTimeSlots(date, startHour, endHour, slotDuration),
    [date, startHour, endHour, slotDuration]
  );

  const totalHeight = useMemo(
    () => getTotalHeight(startHour, endHour, slotDuration),
    [startHour, endHour, slotDuration]
  );

  const appointmentsByResource = useMemo(() => {
    const map = new Map<string, Appointment[]>();
    resources.forEach((r) => map.set(r.id, []));
    appointments.forEach((apt) => {
      const arr = map.get(apt.resourceId) || [];
      arr.push(apt);
      map.set(apt.resourceId, arr);
    });
    return map;
  }, [appointments, resources]);

  const blocksByResource = useMemo(() => {
    const map = new Map<string, Block[]>();
    resources.forEach((r) => map.set(r.id, []));
    blocks.forEach((block) => {
      const arr = map.get(block.resourceId) || [];
      arr.push(block);
      map.set(block.resourceId, arr);
    });
    return map;
  }, [blocks, resources]);

  const slotHeight = SLOT_HEIGHTS[slotDuration];
  const isDark = theme === 'dark';
  const bgColor = isDark ? 'bg-slate-900' : 'bg-white';
  const rowBg = isDark ? 'bg-slate-800/30' : 'bg-slate-50/50';
  const lineColor = isDark ? 'border-slate-700/30' : 'border-slate-200';

  const scrollElement = scrollContainerRef?.current ?? null;
  const useVirtual = scrollElement !== null;

  const virtualizer = useVirtualizer({
    count: slots.length,
    getScrollElement: () => scrollElement,
    estimateSize: () => slotHeight,
    overscan: 5,
    enabled: useVirtual,
  });

  const virtualItems = useVirtual ? virtualizer.getVirtualItems() : [];

  return (
    <div className={`relative flex-1 ${bgColor}`} style={{ minHeight: totalHeight }}>
      <div className="relative">
        {useVirtual ? (
          <div
            style={{
              height: virtualizer.getTotalSize(),
              width: '100%',
              position: 'relative',
            }}
          >
            {virtualItems.map((virtualRow) => {
              const idx = virtualRow.index;
              return (
                <div
                  key={virtualRow.key}
                  className={`absolute top-0 left-0 w-full border-b ${lineColor} ${idx % 2 === 0 ? rowBg : ''}`}
                  style={{
                    height: virtualRow.size,
                    transform: `translateY(${virtualRow.start}px)`,
                  }}
                />
              );
            })}
          </div>
        ) : (
          <>
            {slots.map((slot, idx) => (
              <div
                key={idx}
                className={`border-b ${lineColor} ${idx % 2 === 0 ? rowBg : ''}`}
                style={{ height: slotHeight }}
              />
            ))}
          </>
        )}

        <TimeIndicator
          date={date}
          startHour={startHour}
          slotDuration={slotDuration}
          resourceCount={resources.length}
          resourceWidth={resourceWidth}
        />

        {resources.map((resource, resourceIdx) => {
          const resourceAppointments = appointmentsByResource.get(resource.id) || [];
          const resourceBlocks = blocksByResource.get(resource.id) || [];
          const left = resourceIdx * resourceWidth;
          const width = resourceWidth;

          return (
            <div
              key={resource.id}
              className="absolute top-0"
              style={{
                left,
                width,
                height: totalHeight,
              }}
            >
              {resourceBlocks.map((block) => {
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
                    width={width - 8}
                    theme={theme}
                  />
                );
              })}

              {resourceAppointments.map((apt) => {
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
                    width={width - 16}
                    theme={theme}
                    onClick={() => onAppointmentClick?.(apt)}
                  />
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}
