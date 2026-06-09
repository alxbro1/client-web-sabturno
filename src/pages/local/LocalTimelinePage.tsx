import { useState } from 'react';
import { useAuthStore } from '@/stores/auth';
import { AppointmentTimeline } from '@/features/appointment-timeline/components/AppointmentTimeline';
import { useTimelineData } from '@/features/appointment-timeline/hooks/useTimelineData';
import { useTimelineActions } from '@/features/appointment-timeline/hooks/useTimelineActions';
import { useEmployees } from '@/features/appointment-timeline/hooks/useEmployees';
import type { Appointment, ViewMode } from '@/features/appointment-timeline/types';

export function LocalTimelinePage() {
  const user = useAuthStore((s) => s.user);
  const [date, setDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>('day');

  const entityId = user?.id ?? '';

  const { employees } = useEmployees({
    localId: entityId,
    enabled: !!entityId,
  });

  const { appointments, blocks, resources, isLoading, error, refetch } = useTimelineData({
    entityId,
    date,
    viewMode,
    enabled: !!entityId,
    employees,
  });

  const { blockSlot, unblockSlot } = useTimelineActions({
    localId: entityId,
    onSuccess: refetch,
    onError: (msg) => console.error(msg),
  });

  const config = { slotDuration: 30 as const, startHour: 8, endHour: 20 };

  const handleAppointmentClick = (appointment: Appointment) => {
    console.log('Appointment clicked:', appointment);
  };

  const handleDateChange = (newDate: Date) => {
    setDate(newDate);
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-slate-500">Iniciá sesión para ver el calendario</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full p-4">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-slate-800">Calendario de Turnos</h1>
        {isLoading && (
          <span className="text-sm text-slate-500 animate-pulse">Cargando...</span>
        )}
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      <div className="flex-1 min-h-0">
        <AppointmentTimeline
          date={date}
          resources={resources}
          appointments={appointments}
          blocks={blocks}
          config={config}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          onAppointmentClick={handleAppointmentClick}
          onDateChange={handleDateChange}
        />
      </div>
    </div>
  );
}
