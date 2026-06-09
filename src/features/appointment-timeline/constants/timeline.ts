import { SlotDuration } from '../types';

export const TIMELINE_CONSTANTS = {
  DEFAULT_SLOT_HEIGHT: 44,
  DEFAULT_RESOURCE_WIDTH: 200,
  DEFAULT_TIME_COLUMN_WIDTH: 60,
  DEFAULT_START_HOUR: 8,
  DEFAULT_END_HOUR: 20,
  DEFAULT_SLOT_DURATION: 30 as SlotDuration,
} as const;

export const SLOT_HEIGHTS: Record<SlotDuration, number> = {
  15: 44,
  20: 44,
  30: 44,
  60: 88,
};

export const STATUS_COLORS = {
  PENDING: {
    light: 'bg-amber-100 border-amber-300 text-amber-800',
    dark: 'bg-amber-900/40 border-amber-700/50 text-amber-300',
  },
  CONFIRMED: {
    light: 'bg-blue-100 border-blue-300 text-blue-800',
    dark: 'bg-blue-900/40 border-blue-700/50 text-blue-300',
  },
  COMPLETED: {
    light: 'bg-green-100 border-green-300 text-green-800',
    dark: 'bg-green-900/40 border-green-700/50 text-green-300',
  },
  CANCELLED: {
    light: 'bg-red-100 border-red-300 text-red-800',
    dark: 'bg-red-900/40 border-red-700/50 text-red-300',
  },
  BLOCKED: {
    light: 'border-slate-300 text-slate-600',
    dark: 'border-slate-600 text-slate-400',
    bgLight: 'rgba(226, 232, 240, 0.7)',
    bgDark: 'rgba(51, 65, 85, 0.5)',
    stripeLight: 'rgba(148, 163, 184, 0.3)',
    stripeDark: 'rgba(100, 116, 139, 0.3)',
  },
} as const;

export const GRID_LINE_COLORS = {
  light: 'border-slate-200',
  dark: 'border-slate-700/50',
} as const;