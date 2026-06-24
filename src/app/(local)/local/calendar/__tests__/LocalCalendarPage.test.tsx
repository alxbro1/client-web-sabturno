import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import LocalCalendarPage from '../page';
import type { Appointment, Block, Resource } from '@/features/appointment-timeline/types';

vi.mock('@/stores/auth', () => ({
  useAuthStore: vi.fn(),
}));

vi.mock('@/features/appointment-timeline/hooks/useTimelineData', () => ({
  useTimelineData: vi.fn(),
}));

vi.mock('@/features/appointment-timeline/hooks/useEmployees', () => ({
  useEmployees: vi.fn(),
}));

vi.mock('@/components/shadcn-big-calendar/shadcn-big-calendar', () => ({
  default: ({ events, eventPropGetter, components }: any) => (
    <div data-testid="mock-calendar">
      <span data-testid="event-count">{events?.length ?? 0}</span>
      {events?.map((evt: any) => {
        const propResult = eventPropGetter?.(evt) ?? {};
        return (
          <div
            key={evt.id}
            data-testid={evt.isBlock ? 'block-event' : 'appointment-event'}
            data-event-id={evt.id}
            className={propResult.className}
            style={propResult.style}
          >
            {components?.event ? (
              <components.event event={evt} />
            ) : (
              evt.title
            )}
          </div>
        );
      })}
    </div>
  ),
}));

vi.mock('@/components/EmployeeSidebar', () => ({
  EmployeeSidebar: ({ resources, selectedId, onSelect, appointmentCounts }: any) => (
    <div data-testid="mock-sidebar">
      <span data-testid="selected-id">{selectedId ?? 'null'}</span>
      {resources?.map((r: any) => (
        <button
          key={r.id}
          data-testid={`sidebar-btn-${r.id}`}
          onClick={() => onSelect(r.id === selectedId ? null : r.id)}
        >
          {r.name}
        </button>
      ))}
      <span data-testid="appointment-counts">{JSON.stringify(appointmentCounts)}</span>
    </div>
  ),
}));

const { useAuthStore } = await import('@/stores/auth');
const { useTimelineData } = await import('@/features/appointment-timeline/hooks/useTimelineData');
const { useEmployees } = await import('@/features/appointment-timeline/hooks/useEmployees');

const mockUseAuthStore = vi.mocked(useAuthStore);
const mockUseTimelineData = vi.mocked(useTimelineData);
const mockUseEmployees = vi.mocked(useEmployees);

const LOCAL_ID = 'local-1';

function makeResource(overrides: Partial<Resource> = {}): Resource {
  return { id: 'emp-1', name: 'Lucía', color: '#ff0000', ...overrides };
}

function makeAppointment(overrides: Partial<Appointment> = {}): Appointment {
  return {
    id: 'apt-1',
    resourceId: 'emp-1',
    startAt: new Date(2026, 5, 20, 10, 0),
    endAt: new Date(2026, 5, 20, 11, 0),
    title: 'Corte de pelo',
    status: 'CONFIRMED',
    customerName: 'Juan',
    serviceName: 'Corte de pelo',
    ...overrides,
  };
}

function makeBlock(overrides: Partial<Block> = {}): Block {
  return {
    id: 'block-1',
    resourceId: 'emp-1',
    startAt: new Date(2026, 5, 20, 12, 0),
    endAt: new Date(2026, 5, 20, 13, 0),
    notes: 'Almuerzo',
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  mockUseAuthStore.mockReturnValue({ user: { id: LOCAL_ID, isLocal: true } } as any);
  mockUseEmployees.mockReturnValue({
    employees: [],
    isLoading: false,
    error: null,
    refetch: vi.fn(),
  });
  mockUseTimelineData.mockReturnValue({
    appointments: [],
    blocks: [],
    resources: [makeResource({ id: LOCAL_ID, name: 'Mi Local' })],
    isLoading: false,
    error: null,
    refetch: vi.fn(),
  });
});

describe('LocalCalendarPage', () => {
  it('shows login prompt when user is not authenticated', () => {
    mockUseAuthStore.mockReturnValue({ user: null } as any);
    render(<LocalCalendarPage />);
    expect(screen.getByText(/Iniciá sesion/)).toBeTruthy();
  });

  it('shows loading state', () => {
    mockUseTimelineData.mockReturnValue({
      appointments: [],
      blocks: [],
      resources: [],
      isLoading: true,
      error: null,
      refetch: vi.fn(),
    });
    render(<LocalCalendarPage />);
    expect(screen.getByText('Cargando...')).toBeTruthy();
  });

  it('renders the calendar with events', () => {
    const appointments = [
      makeAppointment({ id: 'apt-1' }),
      makeAppointment({ id: 'apt-2', resourceId: 'emp-2' }),
    ];
    const blocks = [makeBlock({ id: 'block-1' })];

    mockUseTimelineData.mockReturnValue({
      appointments,
      blocks,
      resources: [makeResource()],
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });

    render(<LocalCalendarPage />);

    expect(screen.getByTestId('mock-calendar')).toBeTruthy();
    expect(screen.getByTestId('event-count').textContent).toBe('3');
  });

  it('renders appointment events with HH:mm title format', () => {
    const appointments = [
      makeAppointment({
        id: 'apt-1',
        startAt: new Date(2026, 5, 20, 14, 30),
        title: 'Corte de barba',
      }),
    ];

    mockUseTimelineData.mockReturnValue({
      appointments,
      blocks: [],
      resources: [makeResource()],
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });

    render(<LocalCalendarPage />);

    const aptEvent = screen.getByTestId('appointment-event');
    expect(aptEvent.textContent).toContain('14:30');
    expect(aptEvent.textContent).toContain('Corte de barba');
  });

  it('renders block events with isBlock=true and notes as title', () => {
    const blocks = [makeBlock({ id: 'block-1', notes: 'Reunión interna' })];

    mockUseTimelineData.mockReturnValue({
      appointments: [],
      blocks,
      resources: [makeResource()],
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });

    render(<LocalCalendarPage />);

    const blockEvent = screen.getByTestId('block-event');
    expect(blockEvent).toBeTruthy();
    expect(blockEvent.textContent).toContain('Reunión interna');
  });

  it('renders block with "Bloqueado" when notes is missing', () => {
    const blocks = [makeBlock({ id: 'block-1', notes: undefined })];

    mockUseTimelineData.mockReturnValue({
      appointments: [],
      blocks,
      resources: [makeResource()],
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });

    render(<LocalCalendarPage />);

    const blockEvent = screen.getByTestId('block-event');
    expect(blockEvent.textContent).toContain('Bloqueado');
  });

  it('applies event-variant-blocked class to block events', () => {
    const blocks = [makeBlock({ id: 'block-1' })];

    mockUseTimelineData.mockReturnValue({
      appointments: [],
      blocks,
      resources: [makeResource()],
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });

    render(<LocalCalendarPage />);

    const blockEvent = screen.getByTestId('block-event');
    expect(blockEvent.className).toContain('event-variant-blocked');
  });

  it('applies employee color to appointments when no employee filter is selected', () => {
    const appointments = [makeAppointment({ id: 'apt-1', resourceId: 'emp-1' })];

    mockUseTimelineData.mockReturnValue({
      appointments,
      blocks: [],
      resources: [makeResource({ id: 'emp-1', color: '#ff5500' })],
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });

    render(<LocalCalendarPage />);

    const aptEvent = screen.getByTestId('appointment-event');
    expect(aptEvent.style.backgroundColor).toBe('rgb(255, 85, 0)');
    expect(aptEvent.style.borderColor).toBe('rgb(255, 85, 0)');
  });

  it('applies status class to appointments when employee is selected', () => {
    const appointments = [makeAppointment({ id: 'apt-1', status: 'CONFIRMED', resourceId: 'emp-1' })];

    mockUseTimelineData.mockReturnValue({
      appointments,
      blocks: [],
      resources: [makeResource({ id: 'emp-1' })],
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });

    render(<LocalCalendarPage />);

    // Simulate selecting an employee via sidebar
    fireEvent.click(screen.getByTestId('sidebar-btn-emp-1'));

    const aptEvent = screen.getByTestId('appointment-event');
    expect(aptEvent.className).toContain('event-variant-confirmed');
  });

  it('renders the sidebar with resources and appointment counts', () => {
    const appointments = [
      makeAppointment({ id: 'apt-1', resourceId: 'emp-1' }),
      makeAppointment({ id: 'apt-2', resourceId: 'emp-1' }),
      makeAppointment({ id: 'apt-3', resourceId: 'emp-2' }),
    ];

    mockUseTimelineData.mockReturnValue({
      appointments,
      blocks: [],
      resources: [
        makeResource({ id: 'emp-1', name: 'Lucía' }),
        makeResource({ id: 'emp-2', name: 'Carlos' }),
      ],
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });

    render(<LocalCalendarPage />);

    expect(screen.getByTestId('mock-sidebar')).toBeTruthy();
    expect(screen.getByText('Lucía')).toBeTruthy();
    expect(screen.getByText('Carlos')).toBeTruthy();

    const counts = JSON.parse(screen.getByTestId('appointment-counts').textContent!);
    expect(counts['emp-1']).toBe(2);
    expect(counts['emp-2']).toBe(1);
  });
});
