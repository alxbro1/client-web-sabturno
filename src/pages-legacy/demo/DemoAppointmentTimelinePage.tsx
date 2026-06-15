import { useState } from 'react';
import { addHours, addDays, startOfDay, startOfWeek } from 'date-fns';
import { AppointmentTimeline } from '@/features/appointment-timeline';
import type { Appointment, Block, Resource, ViewMode } from '@/features/appointment-timeline';

const today = startOfDay(new Date());
const weekStart = startOfWeek(today, { weekStartsOn: 1 });

function dayOffset(days: number, hour: number): Date {
  return addHours(addDays(weekStart, days), hour);
}

const sampleResources: Resource[] = [
  { id: 'emp-1', name: 'Ana López', color: '#3daaf4' },
  { id: 'emp-2', name: 'Carlos Ruiz', color: '#10b981' },
  { id: 'emp-3', name: 'Laura García', color: '#f59e0b' },
];

const sampleAppointments: Appointment[] = [
  // Monday - Ana
  { id: '1', resourceId: 'emp-1', startAt: dayOffset(0, 8), endAt: dayOffset(0, 9),
    title: 'María García', status: 'CONFIRMED', customerName: 'María García', serviceName: 'Corte de pelo' },
  { id: '2', resourceId: 'emp-1', startAt: dayOffset(0, 10), endAt: dayOffset(0, 11),
    title: 'Juan Pérez', status: 'PENDING', customerName: 'Juan Pérez', serviceName: 'Tintura' },
  // Monday - Carlos
  { id: '3', resourceId: 'emp-2', startAt: dayOffset(0, 9), endAt: dayOffset(0, 10),
    title: 'Pedro López', status: 'CONFIRMED', customerName: 'Pedro López', serviceName: 'Corte barba' },
  // Tuesday - Ana
  { id: '4', resourceId: 'emp-1', startAt: dayOffset(1, 9), endAt: dayOffset(1, 10),
    title: 'Sofía Martínez', status: 'CONFIRMED', customerName: 'Sofía Martínez', serviceName: 'Peinado' },
  // Tuesday - Laura
  { id: '5', resourceId: 'emp-3', startAt: dayOffset(1, 10), endAt: dayOffset(1, 12),
    title: 'Lucía Díaz', status: 'PENDING', customerName: 'Lucía Díaz', serviceName: 'Mechas' },
  // Wednesday - Carlos
  { id: '6', resourceId: 'emp-2', startAt: dayOffset(2, 8), endAt: dayOffset(2, 9),
    title: 'Martín Torres', status: 'COMPLETED', customerName: 'Martín Torres', serviceName: 'Corte de pelo' },
  { id: '7', resourceId: 'emp-2', startAt: dayOffset(2, 11), endAt: dayOffset(2, 12),
    title: 'Diego Moreno', status: 'CONFIRMED', customerName: 'Diego Moreno', serviceName: 'Barba' },
  // Thursday - Laura
  { id: '8', resourceId: 'emp-3', startAt: dayOffset(3, 9), endAt: dayOffset(3, 10),
    title: 'Valentina Ríos', status: 'CONFIRMED', customerName: 'Valentina Ríos', serviceName: 'Corte mujer' },
  // Friday - Ana
  { id: '9', resourceId: 'emp-1', startAt: dayOffset(4, 14), endAt: dayOffset(4, 15),
    title: 'Camila Herrera', status: 'PENDING', customerName: 'Camila Herrera', serviceName: 'Tintura' },
  // Saturday - all three
  { id: '10', resourceId: 'emp-1', startAt: dayOffset(5, 9), endAt: dayOffset(5, 10),
    title: 'Turno sábado 1', status: 'CONFIRMED', serviceName: 'Corte' },
  { id: '11', resourceId: 'emp-2', startAt: dayOffset(5, 10), endAt: dayOffset(5, 11),
    title: 'Turno sábado 2', status: 'CONFIRMED', serviceName: 'Barba' },
  { id: '12', resourceId: 'emp-3', startAt: dayOffset(5, 11), endAt: dayOffset(5, 12),
    title: 'Turno sábado 3', status: 'PENDING', serviceName: 'Mechas' },
];

const sampleBlocks: Block[] = [
  // Tuesday maintenance - Ana
  { id: 'block-1', resourceId: 'emp-1', startAt: dayOffset(1, 13), endAt: dayOffset(1, 14),
    notes: 'Mantenimiento' },
  // Thursday lunch - Laura
  { id: 'block-2', resourceId: 'emp-3', startAt: dayOffset(3, 12), endAt: dayOffset(3, 13),
    notes: 'Almuerzo' },
  // Friday evening - Carlos
  { id: 'block-3', resourceId: 'emp-2', startAt: dayOffset(4, 17), endAt: dayOffset(4, 19),
    notes: 'Evento privado' },
];

export function DemoAppointmentTimelinePage() {
  const [viewMode, setViewMode] = useState<ViewMode>('day');

  return (
    <div className="min-h-screen bg-slate-100 p-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-900">
          AppointmentTimeline - Demo Multi-Recurso
        </h1>
        <p className="text-slate-600">
          Vista multi-empleado con 3 recursos. Usá el toggle para cambiar entre vista de día y semana.
        </p>
      </div>

      <div className="bg-white rounded-xl shadow-lg p-6" style={{ height: '600px' }}>
        <AppointmentTimeline
          date={today}
          resources={sampleResources}
          appointments={sampleAppointments}
          blocks={sampleBlocks}
          config={{
            slotDuration: 30,
            startHour: 8,
            endHour: 20,
          }}
          theme="light"
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          onAppointmentClick={(apt) => {
            console.log('Appointment clicked:', apt);
          }}
        />
      </div>

      <div className="mt-6 flex flex-wrap gap-4">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-amber-100 border border-amber-300" />
          <span className="text-sm text-slate-600">Pending</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-blue-100 border border-blue-300" />
          <span className="text-sm text-slate-600">Confirmed</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-green-100 border border-green-300" />
          <span className="text-sm text-slate-600">Completed</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-red-100 border border-red-300" />
          <span className="text-sm text-slate-600">Cancelled</span>
        </div>
        <div className="flex items-center gap-2">
          <div
            className="w-4 h-4 rounded border border-slate-300"
            style={{
              backgroundColor: 'rgba(226, 232, 240, 0.7)',
              backgroundImage: 'repeating-linear-gradient(-45deg, transparent, transparent 2px, rgba(148, 163, 184, 0.3) 2px, rgba(148, 163, 184, 0.3) 4px)',
            }}
          />
          <span className="text-sm text-slate-600">Blocked</span>
        </div>
        <div className="ml-4 border-l border-slate-300 pl-4 flex items-center gap-4">
          {sampleResources.map((r) => (
            <div key={r.id} className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: r.color }} />
              <span className="text-sm text-slate-600">{r.name}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
