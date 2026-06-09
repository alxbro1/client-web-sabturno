export type SlotDuration = 15 | 20 | 30 | 60;

export type AppointmentStatus = 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED';

export type ViewMode = 'day' | 'week';

export interface Resource {
  id: string;
  name: string;
  avatar?: string;
  color?: string;
}

export interface Block {
  id: string;
  resourceId: string;
  startAt: Date;
  endAt: Date;
  notes?: string;
}

export interface Appointment {
  id: string;
  resourceId: string;
  startAt: Date;
  endAt: Date;
  title: string;
  status: AppointmentStatus;
  customerName?: string;
  customerEmail?: string;
  serviceName?: string;
}

export interface TimelineConfig {
  slotDuration: SlotDuration;
  startHour: number;
  endHour: number;
  resourceWidth?: number;
  timeColumnWidth?: number;
}

export interface TimelineProps {
  date: Date;
  resources: Resource[];
  appointments: Appointment[];
  blocks: Block[];
  config: TimelineConfig;
  theme?: 'light' | 'dark';
  viewMode?: ViewMode;
  onAppointmentClick?: (appointment: Appointment) => void;
  onAppointmentHover?: (appointment: Appointment | null) => void;
  onSlotClick?: (resourceId: string, startAt: Date, endAt: Date) => void;
  onDateChange?: (date: Date) => void;
  onViewModeChange?: (mode: ViewMode) => void;
}