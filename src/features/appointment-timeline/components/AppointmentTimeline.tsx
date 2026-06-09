import { useState, useRef, useCallback } from 'react';
import { TimelineProps, ViewMode } from '../types';
import { TIMELINE_CONSTANTS } from '../constants';
import { getTotalHeight } from '../utils';
import { DateSelector } from './DateSelector';
import { WeekDateSelector } from './WeekDateSelector';
import { TimelineHeader } from './TimelineHeader';
import { TimeSidebar } from './TimeSidebar';
import { TimelineGrid } from './TimelineGrid';
import { WeekView } from './WeekView';

export function AppointmentTimeline({
  date: initialDate,
  resources,
  appointments,
  blocks,
  config,
  theme = 'light',
  viewMode: controlledViewMode,
  onAppointmentClick,
  onSlotClick,
  onDateChange,
  onViewModeChange,
}: TimelineProps) {
  const [date, setDate] = useState(initialDate);
  const [internalViewMode, setInternalViewMode] = useState<ViewMode>('day');
  const [scrollLeft, setScrollLeft] = useState(0);
  const [scrollTop, setScrollTop] = useState(0);

  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const viewMode = controlledViewMode ?? internalViewMode;

  const resourceWidth = config.resourceWidth || TIMELINE_CONSTANTS.DEFAULT_RESOURCE_WIDTH;
  const totalHeight = getTotalHeight(config.startHour, config.endHour, config.slotDuration);

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    setScrollLeft(target.scrollLeft);
    setScrollTop(target.scrollTop);
  }, []);

  const handleDateChange = useCallback(
    (newDate: Date) => {
      setDate(newDate);
      onDateChange?.(newDate);
    },
    [onDateChange],
  );

  const handleViewModeChange = useCallback(
    (mode: ViewMode) => {
      if (controlledViewMode === undefined) {
        setInternalViewMode(mode);
      }
      onViewModeChange?.(mode);
    },
    [controlledViewMode, onViewModeChange],
  );

  const gridWidth = resources.length * resourceWidth;
  const isDark = theme === 'dark';
  const borderColor = isDark ? 'border-slate-700' : 'border-slate-200';

  if (viewMode === 'week') {
    return (
      <div className="flex flex-col h-full w-full overflow-hidden rounded-lg border">
        <WeekDateSelector
          date={date}
          viewMode={viewMode}
          onDateChange={handleDateChange}
          onViewModeChange={handleViewModeChange}
          theme={theme}
        />

        <WeekView
          date={date}
          resources={resources}
          appointments={appointments}
          blocks={blocks}
          startHour={config.startHour}
          endHour={config.endHour}
          slotDuration={config.slotDuration}
          resourceWidth={resourceWidth}
          theme={theme}
          onAppointmentClick={onAppointmentClick}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full w-full overflow-hidden rounded-lg border">
      <WeekDateSelector
        date={date}
        viewMode={viewMode}
        onDateChange={handleDateChange}
        onViewModeChange={handleViewModeChange}
        theme={theme}
      />

      <div className="flex flex-1 overflow-hidden">
        <TimeSidebar
          date={date}
          startHour={config.startHour}
          endHour={config.endHour}
          slotDuration={config.slotDuration}
          theme={theme}
          scrollTop={scrollTop}
          headerHeight={40}
        />

        <div className="flex flex-col flex-1 overflow-hidden">
          <TimelineHeader
            resources={resources}
            resourceWidth={resourceWidth}
            theme={theme}
            scrollLeft={scrollLeft}
          />

          <div
            ref={scrollContainerRef}
            className="flex-1 overflow-auto"
            onScroll={handleScroll}
          >
            <div style={{ width: gridWidth }}>
              <TimelineGrid
                date={date}
                resources={resources}
                appointments={appointments}
                blocks={blocks}
                startHour={config.startHour}
                endHour={config.endHour}
                slotDuration={config.slotDuration}
                resourceWidth={resourceWidth}
                theme={theme}
                onAppointmentClick={onAppointmentClick}
                scrollContainerRef={scrollContainerRef}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
