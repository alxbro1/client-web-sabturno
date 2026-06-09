import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { AppointmentBlock } from '../AppointmentBlock';
import { Appointment } from '../../types';

function makeAppointment(overrides: Partial<Appointment> = {}): Appointment {
  return {
    id: '1',
    resourceId: 'res-1',
    startAt: new Date(2026, 0, 1, 9, 0),
    endAt: new Date(2026, 0, 1, 10, 0),
    title: 'Corte de pelo',
    status: 'PENDING',
    customerName: 'Juan Pérez',
    customerEmail: 'juan@test.com',
    serviceName: 'Corte',
    ...overrides,
  };
}

describe('AppointmentBlock', () => {
  it('should render appointment title', () => {
    const apt = makeAppointment({ title: 'Corte de pelo' });
    render(<AppointmentBlock appointment={apt} top={0} height={50} width={180} theme="light" />);
    expect(screen.getByText('Corte de pelo')).toBeInTheDocument();
  });

  it('should render customerName as fallback when title is empty', () => {
    const apt = makeAppointment({ title: '', customerName: 'Juan Pérez' });
    render(<AppointmentBlock appointment={apt} top={0} height={50} width={180} theme="light" />);
    const elements = screen.getAllByText('Juan Pérez');
    expect(elements.length).toBeGreaterThanOrEqual(1);
  });

  it('should render "Sin título" when title and customerName are empty', () => {
    const apt = makeAppointment({ title: '', customerName: undefined });
    render(<AppointmentBlock appointment={apt} top={0} height={50} width={180} theme="light" />);
    expect(screen.getByText('Sin título')).toBeInTheDocument();
  });

  it('should render serviceName when provided', () => {
    const apt = makeAppointment({ serviceName: 'Corte masculino' });
    render(<AppointmentBlock appointment={apt} top={0} height={50} width={180} theme="light" />);
    expect(screen.getByText('Corte masculino')).toBeInTheDocument();
  });

  it('should render customerName as third line', () => {
    const apt = makeAppointment({ customerName: 'Juan Pérez' });
    render(<AppointmentBlock appointment={apt} top={0} height={50} width={180} theme="light" />);
    const elements = screen.getAllByText('Juan Pérez');
    expect(elements.length).toBeGreaterThanOrEqual(1);
  });

  it('should render customerEmail as fallback for third line', () => {
    const apt = makeAppointment({ customerName: undefined, customerEmail: 'juan@test.com' });
    render(<AppointmentBlock appointment={apt} top={0} height={50} width={180} theme="light" />);
    expect(screen.getByText('juan@test.com')).toBeInTheDocument();
  });

  it('should call onClick when clicked', () => {
    const apt = makeAppointment();
    const onClick = vi.fn();
    render(<AppointmentBlock appointment={apt} top={0} height={50} width={180} theme="light" onClick={onClick} />);
    fireEvent.click(screen.getByText('Corte de pelo').closest('div')!);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('should apply correct styles for PENDING status in light theme', () => {
    const apt = makeAppointment({ status: 'PENDING' });
    render(
      <AppointmentBlock appointment={apt} top={0} height={50} width={180} theme="light" />
    );
    const div = screen.getByText('Corte de pelo').closest('div[class*="absolute"]') as HTMLElement;
    expect(div.className).toContain('bg-amber-100');
    expect(div.className).toContain('border-amber-300');
    expect(div.className).toContain('text-amber-800');
  });

  it('should apply correct styles for CONFIRMED status in light theme', () => {
    const apt = makeAppointment({ status: 'CONFIRMED' });
    render(
      <AppointmentBlock appointment={apt} top={0} height={50} width={180} theme="light" />
    );
    const div = screen.getByText('Corte de pelo').closest('div[class*="absolute"]') as HTMLElement;
    expect(div.className).toContain('bg-blue-100');
    expect(div.className).toContain('border-blue-300');
  });

  it('should apply correct styles for COMPLETED status in light theme', () => {
    const apt = makeAppointment({ status: 'COMPLETED' });
    render(
      <AppointmentBlock appointment={apt} top={0} height={50} width={180} theme="light" />
    );
    const div = screen.getByText('Corte de pelo').closest('div[class*="absolute"]') as HTMLElement;
    expect(div.className).toContain('bg-green-100');
    expect(div.className).toContain('border-green-300');
  });

  it('should apply correct styles for CANCELLED status in light theme', () => {
    const apt = makeAppointment({ status: 'CANCELLED' });
    render(
      <AppointmentBlock appointment={apt} top={0} height={50} width={180} theme="light" />
    );
    const div = screen.getByText('Corte de pelo').closest('div[class*="absolute"]') as HTMLElement;
    expect(div.className).toContain('bg-red-100');
    expect(div.className).toContain('border-red-300');
  });

  it('should apply dark theme styles for PENDING', () => {
    const apt = makeAppointment({ status: 'PENDING' });
    render(
      <AppointmentBlock appointment={apt} top={0} height={50} width={180} theme="dark" />
    );
    const div = screen.getByText('Corte de pelo').closest('div[class*="absolute"]') as HTMLElement;
    expect(div.className).toContain('bg-amber-900/40');
    expect(div.className).toContain('text-amber-300');
  });

  it('should have cursor-pointer when onClick is provided', () => {
    const apt = makeAppointment();
    const onClick = vi.fn();
    render(
      <AppointmentBlock appointment={apt} top={0} height={50} width={180} theme="light" onClick={onClick} />
    );
    const div = screen.getByText('Corte de pelo').closest('div[class*="absolute"]') as HTMLElement;
    expect(div.className).toContain('cursor-pointer');
  });

  it('should have cursor-default when onClick is not provided', () => {
    const apt = makeAppointment();
    render(
      <AppointmentBlock appointment={apt} top={0} height={50} width={180} theme="light" />
    );
    const div = screen.getByText('Corte de pelo').closest('div[class*="absolute"]') as HTMLElement;
    expect(div.className).toContain('cursor-default');
  });

  it('should apply correct position styles', () => {
    const apt = makeAppointment();
    render(
      <AppointmentBlock appointment={apt} top={100} height={88} width={184} theme="light" />
    );
    const div = screen.getByText('Corte de pelo').closest('div[class*="absolute"]') as HTMLElement;
    expect(div.style.top).toBe('100px');
    expect(div.style.height).toBe('88px');
    expect(div.style.width).toBe('184px');
    expect(div.style.minHeight).toBe('30px');
  });
});
