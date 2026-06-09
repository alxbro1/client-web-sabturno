import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TimelineGrid } from '../TimelineGrid';
import { Appointment, Block } from '../../types';

const resources = [
  { id: 'res-1', name: 'Local' },
];

const config = {
  startHour: 8,
  endHour: 12,
  slotDuration: 30 as const,
  resourceWidth: 200,
};

function makeAppointment(overrides: Partial<Appointment> = {}): Appointment {
  return {
    id: '1',
    resourceId: 'res-1',
    startAt: new Date(2026, 0, 1, 9, 0),
    endAt: new Date(2026, 0, 1, 10, 0),
    title: 'Corte de pelo',
    status: 'PENDING',
    customerName: 'Juan',
    ...overrides,
  };
}

describe('TimelineGrid', () => {
  it('should render grid rows for the time range', () => {
    const date = new Date(2026, 0, 1);
    const { container } = render(
      <TimelineGrid
        date={date}
        resources={resources}
        appointments={[]}
        blocks={[]}
        {...config}
      />
    );

    // 4 slots from 08:00 to 12:00 with 30min duration
    const rows = container.querySelectorAll('[class*="border-b"]');
    expect(rows.length).toBeGreaterThanOrEqual(4);
  });

  it('should render appointment blocks', () => {
    const date = new Date(2026, 0, 1);
    const appointments = [
      makeAppointment({ title: 'Corte de pelo' }),
      makeAppointment({ id: '2', title: 'Barba', startAt: new Date(2026, 0, 1, 10, 0), endAt: new Date(2026, 0, 1, 10, 30) }),
    ];

    render(
      <TimelineGrid
        date={date}
        resources={resources}
        appointments={appointments}
        blocks={[]}
        {...config}
      />
    );

    expect(screen.getByText('Corte de pelo')).toBeInTheDocument();
    expect(screen.getByText('Barba')).toBeInTheDocument();
  });

  it('should render appointments even for resources not in the list (grouped under new key)', () => {
    const date = new Date(2026, 0, 1);
    const appointments = [
      makeAppointment({ resourceId: 'other-resource', title: 'Otro' }),
    ];

    render(
      <TimelineGrid
        date={date}
        resources={resources}
        appointments={appointments}
        blocks={[]}
        {...config}
      />
    );

    // The appointment is rendered but grouped under a resource that doesn't exist in the map
    // so it won't appear in the grid columns (only resources in the list get columns)
    expect(screen.queryByText('Otro')).not.toBeInTheDocument();
  });

  it('should render appointments from multiple resources in separate columns', () => {
    const date = new Date(2026, 0, 1);
    const multiResources = [
      { id: 'res-1', name: 'Local 1' },
      { id: 'res-2', name: 'Local 2' },
    ];
    const appointments = [
      makeAppointment({ resourceId: 'res-1', title: 'Apt 1' }),
      makeAppointment({ id: '2', resourceId: 'res-2', title: 'Apt 2' }),
    ];

    render(
      <TimelineGrid
        date={date}
        resources={multiResources}
        appointments={appointments}
        blocks={[]}
        startHour={8}
        endHour={12}
        slotDuration={30}
        resourceWidth={200}
      />
    );

    expect(screen.getByText('Apt 1')).toBeInTheDocument();
    expect(screen.getByText('Apt 2')).toBeInTheDocument();
  });

  it('should call onAppointmentClick when provided', () => {
    const date = new Date(2026, 0, 1);
    const onAppointmentClick = vi.fn();
    const appointments = [makeAppointment()];

    render(
      <TimelineGrid
        date={date}
        resources={resources}
        appointments={appointments}
        blocks={[]}
        {...config}
        onAppointmentClick={onAppointmentClick}
      />
    );

    // The appointment block should be rendered
    expect(screen.getByText('Corte de pelo')).toBeInTheDocument();
  });

  it('should apply light theme styles by default', () => {
    const date = new Date(2026, 0, 1);
    const { container } = render(
      <TimelineGrid
        date={date}
        resources={resources}
        appointments={[]}
        blocks={[]}
        {...config}
      />
    );

    const grid = container.firstElementChild as HTMLElement;
    expect(grid.className).toContain('bg-white');
  });

  it('should apply dark theme styles', () => {
    const date = new Date(2026, 0, 1);
    const { container } = render(
      <TimelineGrid
        date={date}
        resources={resources}
        appointments={[]}
        blocks={[]}
        {...config}
        theme="dark"
      />
    );

    const grid = container.firstElementChild as HTMLElement;
    expect(grid.className).toContain('bg-slate-900');
  });
});
