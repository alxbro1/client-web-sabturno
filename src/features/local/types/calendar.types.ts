export enum DayStatus {
  BLOCKED = 'BLOCKED',
  NON_WORKING = 'NON_WORKING',
  LOW_TRAFFIC = 'LOW_TRAFFIC',
  MEDIUM_TRAFFIC = 'MEDIUM_TRAFFIC',
  HIGH_TRAFFIC = 'HIGH_TRAFFIC',
  AVAILABLE = 'AVAILABLE'
}

export interface CalendarDay {
  date: Date;
  status: DayStatus;
  appointmentCount: number;
  isBlocked: boolean;
  isWorkingDay: boolean;
  blockReason?: string;
  maxCapacity?: number;
  occupancyPercentage?: number;
}

export interface BlockedDateRange {
  id?: string;
  startDate: Date;
  endDate: Date;
  reason: string;
  isRecurring?: boolean;
  recurrencePattern?: 'weekly' | 'monthly' | 'yearly';
  localId: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface WorkingDayTemplate {
  dayOfWeek: number;
  isActive: boolean;
  startTime: string;
  endTime: string;
  maxAppointments?: number;
  slotDuration?: number;
}

export interface CalendarData {
  month: number;
  year: number;
  days: CalendarDay[];
  blockedDates: BlockedDateRange[];
  workingDayTemplates: WorkingDayTemplate[];
}

export interface CalendarFilters {
  showBlocked: boolean;
  showNonWorking: boolean;
  showAvailable: boolean;
  showLowTraffic: boolean;
  showMediumTraffic: boolean;
  showHighTraffic: boolean;
}

export interface CalendarViewMode {
  type: 'month' | 'week';
  showLegend: boolean;
  compactView: boolean;
}