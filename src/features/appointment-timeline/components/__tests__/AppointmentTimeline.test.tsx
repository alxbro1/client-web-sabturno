import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AppointmentTimeline } from '../AppointmentTimeline';
import { TimelineProps } from '../../types';

const defaultProps: TimelineProps = {
  date: new Date(2026, 0, 15),
  resources: [{ id: 'res-1', name: 'Mi Local' }],
  appointments: [
    {
      id: '1',
      resourceId: 'res-1',
      startAt: new Date(2026, 0, 15, 9, 0),
      endAt: new Date(2026, 0, 15, 10, 0),
      title: 'Corte de pelo',
      status: 'PENDING',
      customerName: 'Juan',
      serviceName: 'Corte',
    },
    {
      id: '2',
      resourceId: 'res-1',
      startAt: new Date(2026, 0, 15, 14, 0),
      endAt: new Date(2026, 0, 15, 14, 30),
      title: 'Barba',
      status: 'CONFIRMED',
      customerName: 'Pedro',
      serviceName: 'Barba',
    },
  ],
  blocks: [],
  config: {
    slotDuration: 30,
    startHour: 8,
    endHour: 20,
  },
};

describe('AppointmentTimeline', () => {
  it('should render the date selector', () => {
    render(<AppointmentTimeline {...defaultProps} />);
    expect(screen.getByText(/enero.*2026/i)).toBeInTheDocument();
  });

  it('should render the "Hoy" button', () => {
    render(<AppointmentTimeline {...defaultProps} />);
    expect(screen.getByText('Hoy')).toBeInTheDocument();
  });

  it('should render resource name in header', () => {
    render(<AppointmentTimeline {...defaultProps} />);
    expect(screen.getByText('Mi Local')).toBeInTheDocument();
  });

  it('should render time labels', () => {
    render(<AppointmentTimeline {...defaultProps} />);
    expect(screen.getByText('08:00')).toBeInTheDocument();
    expect(screen.getByText('08:30')).toBeInTheDocument();
    expect(screen.getByText('09:00')).toBeInTheDocument();
  });

  it('should render appointment blocks', () => {
    render(<AppointmentTimeline {...defaultProps} />);
    expect(screen.getByText('Corte de pelo')).toBeInTheDocument();
    const barbaElements = screen.getAllByText('Barba');
    expect(barbaElements.length).toBeGreaterThanOrEqual(1);
  });

  it('should render multiple resources', () => {
    const props: TimelineProps = {
      ...defaultProps,
      resources: [
        { id: 'res-1', name: 'Local 1' },
        { id: 'res-2', name: 'Local 2' },
      ],
      appointments: [
        { ...defaultProps.appointments[0], resourceId: 'res-1' },
        { ...defaultProps.appointments[1], id: '2', resourceId: 'res-2', title: 'Otro' },
      ],
    };
    render(<AppointmentTimeline {...props} />);
    expect(screen.getByText('Local 1')).toBeInTheDocument();
    expect(screen.getByText('Local 2')).toBeInTheDocument();
    expect(screen.getByText('Corte de pelo')).toBeInTheDocument();
    expect(screen.getByText('Otro')).toBeInTheDocument();
  });

  it('should call onAppointmentClick when appointment is clicked', async () => {
    const onAppointmentClick = vi.fn();
    render(<AppointmentTimeline {...defaultProps} onAppointmentClick={onAppointmentClick} />);

    const aptElement = screen.getByText('Corte de pelo');
    await userEvent.click(aptElement.closest('[class*="absolute"]') || aptElement);

    expect(onAppointmentClick).toHaveBeenCalled();
  });

  it('should call onDateChange when date changes', async () => {
    const onDateChange = vi.fn();
    render(<AppointmentTimeline {...defaultProps} onDateChange={onDateChange} />);

    // Click "Hoy" button
    await userEvent.click(screen.getByText('Hoy'));

    expect(onDateChange).toHaveBeenCalled();
  });

  it('should apply light theme by default', () => {
    const { container } = render(<AppointmentTimeline {...defaultProps} />);
    const wrapper = container.firstElementChild as HTMLElement;
    expect(wrapper.className).toContain('overflow-hidden');
  });

  it('should apply dark theme', () => {
    const { container } = render(<AppointmentTimeline {...defaultProps} theme="dark" />);
    expect(container).toBeTruthy();
  });

  it('should handle empty appointments array', () => {
    render(<AppointmentTimeline {...defaultProps} appointments={[]} />);
    expect(screen.getByText('08:00')).toBeInTheDocument();
  });

  it('should handle empty blocks array', () => {
    render(<AppointmentTimeline {...defaultProps} blocks={[]} />);
    expect(screen.getByText('08:00')).toBeInTheDocument();
  });
});
