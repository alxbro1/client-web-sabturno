import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TimeSidebar } from '../TimeSidebar';

describe('TimeSidebar', () => {
  it('should render time labels for 30min slots from 08:00 to 10:00', () => {
    const date = new Date(2026, 0, 1);
    render(
      <TimeSidebar
        date={date}
        startHour={8}
        endHour={10}
        slotDuration={30}
        scrollTop={0}
        headerHeight={40}
      />
    );

    expect(screen.getByText('08:00')).toBeInTheDocument();
    expect(screen.getByText('08:30')).toBeInTheDocument();
    expect(screen.getByText('09:00')).toBeInTheDocument();
    expect(screen.getByText('09:30')).toBeInTheDocument();
  });

  it('should render time labels for 15min slots from 08:00 to 09:00', () => {
    const date = new Date(2026, 0, 1);
    render(
      <TimeSidebar
        date={date}
        startHour={8}
        endHour={9}
        slotDuration={15}
        scrollTop={0}
        headerHeight={40}
      />
    );

    expect(screen.getByText('08:00')).toBeInTheDocument();
    expect(screen.getByText('08:15')).toBeInTheDocument();
    expect(screen.getByText('08:30')).toBeInTheDocument();
    expect(screen.getByText('08:45')).toBeInTheDocument();
  });

  it('should render time labels for 60min slots from 08:00 to 12:00', () => {
    const date = new Date(2026, 0, 1);
    render(
      <TimeSidebar
        date={date}
        startHour={8}
        endHour={12}
        slotDuration={60}
        scrollTop={0}
        headerHeight={40}
      />
    );

    expect(screen.getByText('08:00')).toBeInTheDocument();
    expect(screen.getByText('09:00')).toBeInTheDocument();
    expect(screen.getByText('10:00')).toBeInTheDocument();
    expect(screen.getByText('11:00')).toBeInTheDocument();
  });

  it('should apply scrollTop transform to inner container', () => {
    const date = new Date(2026, 0, 1);
    const { container } = render(
      <TimeSidebar
        date={date}
        startHour={8}
        endHour={10}
        slotDuration={30}
        scrollTop={100}
        headerHeight={40}
      />
    );

    const innerDiv = container.querySelector('[style*="translateY"]');
    expect(innerDiv).toBeTruthy();
    expect((innerDiv as HTMLElement).style.transform).toBe('translateY(-100px)');
  });

  it('should render header spacer with correct height', () => {
    const date = new Date(2026, 0, 1);
    const { container } = render(
      <TimeSidebar
        date={date}
        startHour={8}
        endHour={10}
        slotDuration={30}
        scrollTop={0}
        headerHeight={50}
      />
    );

    const spacer = container.querySelector('[style*="height: 50px"]');
    expect(spacer).toBeTruthy();
  });

  it('should apply light theme styles by default', () => {
    const date = new Date(2026, 0, 1);
    const { container } = render(
      <TimeSidebar
        date={date}
        startHour={8}
        endHour={10}
        slotDuration={30}
        scrollTop={0}
        headerHeight={40}
      />
    );

    const wrapper = container.firstElementChild as HTMLElement;
    expect(wrapper.className).toContain('bg-white');
    expect(wrapper.className).toContain('border-slate-200');
  });

  it('should apply dark theme styles', () => {
    const date = new Date(2026, 0, 1);
    const { container } = render(
      <TimeSidebar
        date={date}
        startHour={8}
        endHour={10}
        slotDuration={30}
        scrollTop={0}
        headerHeight={40}
        theme="dark"
      />
    );

    const wrapper = container.firstElementChild as HTMLElement;
    expect(wrapper.className).toContain('bg-slate-900');
    expect(wrapper.className).toContain('border-slate-700');
  });
});
