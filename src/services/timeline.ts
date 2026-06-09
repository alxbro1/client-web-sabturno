import { apiService } from '@/lib/api';

export interface BackendAppointment {
  id: number;
  startDateTime: string;
  endDateTime: string;
  state: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED';
  userName?: string;
  email?: string;
  phoneNumber?: string;
  serviceId: number;
  localId: string;
  userId?: string;
  employeeId?: string;
  timezone?: string;
  countryCode?: string;
  createdAt: string;
  updatedAt: string;
  service?: {
    id: number;
    name: string;
    description?: string;
    cost: number;
    duration: number;
    category?: string;
  };
  user?: {
    id: string;
    name: string;
    email: string;
    phone?: string;
  };
  local?: {
    name: string;
    address?: string;
    city?: string;
    province?: string;
  };
}

export interface BackendTimeStock {
  id: string;
  localId: string;
  moduleStartTime: string;
  moduleEndTime: string;
  status: 'AVAILABLE' | 'RESERVED' | 'BLOCKED';
  appointmentId?: number;
  templateId?: string;
  employeeId?: string;
  notes?: string;
  isTemplate: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface BackendEmployee {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  avatar?: string;
  color?: string;
  isActive: boolean;
  localId: string;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  nextCursor: string | null;
  hasMore: boolean;
}

export interface BlockTimePayload {
  localId: string;
  date: string;
  startTime?: string;
  endTime?: string;
  notes?: string;
  timezone?: string;
  employeeId?: string;
}

function withCacheBust(url: string) {
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}_cb=${Date.now()}`;
}

export const timelineService = {
  async getAppointmentsByEntity(
    entityId: string,
    params: { minDate?: string; maxDate?: string; status?: string[]; limit?: number; cursor?: string } = {},
  ) {
    const searchParams = new URLSearchParams();
    if (params.minDate) searchParams.set('minDate', params.minDate);
    if (params.maxDate) searchParams.set('maxDate', params.maxDate);
    if (params.status?.length) searchParams.set('status', params.status.join(','));
    if (params.limit) searchParams.set('limit', String(params.limit));
    if (params.cursor) searchParams.set('cursor', params.cursor);

    const query = searchParams.toString();
    const url = withCacheBust(`/appointments/by-entity/${entityId}${query ? `?${query}` : ''}`);

    const response = await apiService.get<PaginatedResponse<BackendAppointment>>(url);
    return response.data;
  },

  async getTodayAppointments(localId: string) {
    const response = await apiService.get<BackendAppointment[]>(
      withCacheBust(`/appointments/local/${localId}/today`),
    );
    return response.data;
  },

  async getNextAppointment(localId: string) {
    const response = await apiService.get<BackendAppointment | null>(
      withCacheBust(`/appointments/local/${localId}/next`),
    );
    return response.data;
  },

  async getAvailability(localId: string, date: string, serviceDuration: number) {
    const params = new URLSearchParams({
      date,
      serviceDuration: String(serviceDuration),
    });
    const response = await apiService.get<{ time: string; available: boolean }[]>(
      withCacheBust(`/time_stock/availability/${localId}?${params.toString()}`),
    );
    return response.data;
  },

  async getBlockedTimes(localId: string, startDate?: string, endDate?: string) {
    const params = new URLSearchParams();
    if (startDate) params.set('startDate', startDate);
    if (endDate) params.set('endDate', endDate);
    const query = params.toString();
    const url = withCacheBust(`/locals/${localId}/blocked-times${query ? `?${query}` : ''}`);
    const response = await apiService.get<BackendTimeStock[]>(url);
    return response.data;
  },

  async blockTimeSlot(payload: BlockTimePayload) {
    const response = await apiService.post('/time_stock/block', payload);
    return response.data;
  },

  async unblockTimeSlot(id: string) {
    const response = await apiService.delete(`/time_stock/unblock/${id}`);
    return response.data;
  },

  async createManualAppointment(payload: {
    localId: string;
    serviceId: number;
    startDateTime: string;
    timezone?: string;
    userName: string;
    employeeId?: string;
  }) {
    const response = await apiService.post('/appointments/manual', payload);
    return response.data;
  },

  async getEmployees(localId: string) {
    const response = await apiService.get<BackendEmployee[]>(
      withCacheBust(`/locals/${localId}/employees`),
    );
    return response.data;
  },

  async createEmployee(localId: string, data: { name: string; email?: string; phone?: string; color?: string }) {
    const response = await apiService.post<BackendEmployee>(`/locals/${localId}/employees`, data);
    return response.data;
  },

  async updateEmployee(localId: string, id: string, data: { name?: string; email?: string; phone?: string; color?: string }) {
    const response = await apiService.patch<BackendEmployee>(`/locals/${localId}/employees/${id}`, data);
    return response.data;
  },

  async deleteEmployee(localId: string, id: string) {
    const response = await apiService.delete(`/locals/${localId}/employees/${id}`);
    return response.data;
  },
};
