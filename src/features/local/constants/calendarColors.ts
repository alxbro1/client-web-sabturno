import { DayStatus } from '../types/calendar.types';

export const CALENDAR_COLORS = {
  [DayStatus.BLOCKED]: '#FF4444',
  [DayStatus.NON_WORKING]: '#E0E0E0',
  [DayStatus.LOW_TRAFFIC]: '#4CAF50',
  [DayStatus.MEDIUM_TRAFFIC]: '#FF9800',
  [DayStatus.HIGH_TRAFFIC]: '#F44336',
  [DayStatus.AVAILABLE]: '#FFFFFF'
} as const;

export const CALENDAR_TEXT_COLORS = {
  [DayStatus.BLOCKED]: '#FFFFFF',
  [DayStatus.NON_WORKING]: '#9E9E9E',
  [DayStatus.LOW_TRAFFIC]: '#FFFFFF',
  [DayStatus.MEDIUM_TRAFFIC]: '#FFFFFF',
  [DayStatus.HIGH_TRAFFIC]: '#FFFFFF',
  [DayStatus.AVAILABLE]: '#333333'
} as const;

export const CALENDAR_BORDER_COLORS = {
  [DayStatus.BLOCKED]: '#D32F2F',
  [DayStatus.NON_WORKING]: '#BDBDBD',
  [DayStatus.LOW_TRAFFIC]: '#388E3C',
  [DayStatus.MEDIUM_TRAFFIC]: '#F57C00',
  [DayStatus.HIGH_TRAFFIC]: '#D32F2F',
  [DayStatus.AVAILABLE]: '#E0E0E0'
} as const;

export const TRAFFIC_THRESHOLDS = {
  LOW: 33,
  MEDIUM: 66,
  HIGH: 100
} as const;

export const CALENDAR_CONSTANTS = {
  DAYS_PER_WEEK: 7,
  WEEKS_PER_MONTH: 6,
  MAX_WEEKS_TO_SHOW: 6,
  DEFAULT_SLOT_DURATION: 30,
  CACHE_DURATION: 5 * 60 * 1000,
} as const;

export const DAY_LABELS = {
  SHORT: ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'],
  LONG: ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']
} as const;

export const MONTH_LABELS = {
  SHORT: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'],
  LONG: ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']
} as const;

export const CALENDAR_LEGENDS = [
  { status: DayStatus.BLOCKED, label: 'Días Bloqueados', description: 'Fechas no disponibles' },
  { status: DayStatus.NON_WORKING, label: 'No Laborables', description: 'Días sin horarios' },
  { status: DayStatus.LOW_TRAFFIC, label: 'Baja Carga', description: '0-33% ocupación' },
  { status: DayStatus.MEDIUM_TRAFFIC, label: 'Media Carga', description: '34-66% ocupación' },
  { status: DayStatus.HIGH_TRAFFIC, label: 'Alta Carga', description: '67-100% ocupación' },
  { status: DayStatus.AVAILABLE, label: 'Disponible', description: 'Sin citas programadas' }
] as const;