import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DateSelector } from '../DateSelector';

describe('DateSelector', () => {
  it('should render formatted date in Spanish', () => {
    const date = new Date(2026, 0, 5); // Monday Jan 5 2026
    render(<DateSelector date={date} onDateChange={vi.fn()} />);
    expect(screen.getByText(/lunes.*5.*enero.*2026/i)).toBeInTheDocument();
  });

  it('should call onDateChange with previous day when left arrow clicked', async () => {
    const date = new Date(2026, 0, 15);
    const onDateChange = vi.fn();
    render(<DateSelector date={date} onDateChange={onDateChange} />);

    const buttons = screen.getAllByRole('button');
    // First button is the left arrow
    await userEvent.click(buttons[0]);

    expect(onDateChange).toHaveBeenCalledTimes(1);
    const calledDate = onDateChange.mock.calls[0][0] as Date;
    expect(calledDate.getDate()).toBe(14);
    expect(calledDate.getMonth()).toBe(0);
  });

  it('should call onDateChange with next day when right arrow clicked', async () => {
    const date = new Date(2026, 0, 15);
    const onDateChange = vi.fn();
    render(<DateSelector date={date} onDateChange={onDateChange} />);

    const buttons = screen.getAllByRole('button');
    // Second button is "Hoy", third is right arrow
    await userEvent.click(buttons[2]);

    expect(onDateChange).toHaveBeenCalledTimes(1);
    const calledDate = onDateChange.mock.calls[0][0] as Date;
    expect(calledDate.getDate()).toBe(16);
  });

  it('should call onDateChange with today when "Hoy" button clicked', async () => {
    const date = new Date(2026, 0, 1);
    const onDateChange = vi.fn();
    render(<DateSelector date={date} onDateChange={onDateChange} />);

    const hoyButton = screen.getByText('Hoy');
    await userEvent.click(hoyButton);

    expect(onDateChange).toHaveBeenCalledTimes(1);
    const calledDate = onDateChange.mock.calls[0][0] as Date;
    const today = new Date();
    expect(calledDate.getDate()).toBe(today.getDate());
    expect(calledDate.getMonth()).toBe(today.getMonth());
    expect(calledDate.getFullYear()).toBe(today.getFullYear());
  });

  it('should open calendar popup when calendar button clicked', async () => {
    const date = new Date(2026, 0, 15);
    render(<DateSelector date={date} onDateChange={vi.fn()} />);

    // Calendar button is the last button (4th)
    const buttons = screen.getAllByRole('button');
    const calendarButton = buttons[buttons.length - 1];
    await userEvent.click(calendarButton);

    // Should show day names
    expect(screen.getByText('Lun')).toBeInTheDocument();
    expect(screen.getByText('Mar')).toBeInTheDocument();
    expect(screen.getByText('Mié')).toBeInTheDocument();
  });

  it('should show month and year in calendar popup', async () => {
    const date = new Date(2026, 5, 15); // June 2026
    render(<DateSelector date={date} onDateChange={vi.fn()} />);

    const buttons = screen.getAllByRole('button');
    const calendarButton = buttons[buttons.length - 1];
    await userEvent.click(calendarButton);

    const matches = screen.getAllByText(/junio.*2026/i);
    expect(matches.length).toBeGreaterThanOrEqual(2); // main date + popup month
  });

  it('should navigate months in calendar popup', async () => {
    const date = new Date(2026, 5, 15);
    render(<DateSelector date={date} onDateChange={vi.fn()} />);

    // Open calendar
    const buttons = screen.getAllByRole('button');
    await userEvent.click(buttons[buttons.length - 1]);

    // Find the month label in the popup (the one with font-semibold class)
    const monthLabels = screen.getAllByText(/junio.*2026/i);
    const popupMonthLabel = monthLabels.find(el => el.className.includes('font-semibold'))!;
    const nextButton = popupMonthLabel.parentElement!.querySelector('button:last-child')!;
    await userEvent.click(nextButton);

    expect(screen.getByText(/julio.*2026/i)).toBeInTheDocument();
  });

  it('should call onDateChange when a day is selected in calendar', async () => {
    const date = new Date(2026, 5, 15);
    const onDateChange = vi.fn();
    render(<DateSelector date={date} onDateChange={onDateChange} />);

    // Open calendar
    const buttons = screen.getAllByRole('button');
    await userEvent.click(buttons[buttons.length - 1]);

    // Click on day 20
    const day20 = screen.getByText('20');
    await userEvent.click(day20);

    expect(onDateChange).toHaveBeenCalledTimes(1);
    const calledDate = onDateChange.mock.calls[0][0] as Date;
    expect(calledDate.getDate()).toBe(20);
    expect(calledDate.getMonth()).toBe(5);
  });

  it('should close calendar after selecting a day', async () => {
    const date = new Date(2026, 5, 15);
    const onDateChange = vi.fn();
    render(<DateSelector date={date} onDateChange={onDateChange} />);

    // Open calendar
    const buttons = screen.getAllByRole('button');
    await userEvent.click(buttons[buttons.length - 1]);

    // Select a day
    const day20 = screen.getByText('20');
    await userEvent.click(day20);

    // Calendar should be closed - day names should not be visible
    expect(screen.queryByText('Lun')).not.toBeInTheDocument();
  });

  it('should apply light theme styles by default', () => {
    const date = new Date(2026, 0, 15);
    const { container } = render(<DateSelector date={date} onDateChange={vi.fn()} />);
    const wrapper = container.firstElementChild as HTMLElement;
    expect(wrapper.className).toContain('bg-white');
    expect(wrapper.className).toContain('border-slate-200');
  });

  it('should apply dark theme styles', () => {
    const date = new Date(2026, 0, 15);
    const { container } = render(<DateSelector date={date} onDateChange={vi.fn()} theme="dark" />);
    const wrapper = container.firstElementChild as HTMLElement;
    expect(wrapper.className).toContain('bg-slate-800');
    expect(wrapper.className).toContain('border-slate-600');
  });
});
