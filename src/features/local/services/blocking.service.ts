import { apiService } from '@/lib/api';
import {
  BlockedDate,
  BlockedTimeSlot,
  CreateBlockedDateRequest,
  CreateBlockedTimeSlotRequest,
} from '../types/blocking.types';

export const blockingService = {
  getBlockedTimeSlots: async (localId: string): Promise<BlockedTimeSlot[]> => {
    try {
      const response = await apiService.get<BlockedTimeSlot[]>(
        `/local/${localId}/blocked-times`,
      );
      return response.data;
    } catch (error) {
      console.error("Error fetching blocked time slots:", error);
      return [];
    }
  },

  createBlockedDate: async (
    data: CreateBlockedDateRequest,
  ): Promise<BlockedDate> => {
    const response = await apiService.post<BlockedDate>(
      "/time_stock/block",
      data,
    );
    return response.data;
  },

  createBlockedTimeSlot: async (
    data: CreateBlockedTimeSlotRequest & {
      localId: string;
      date: string;
      notes?: string;
    },
  ): Promise<BlockedTimeSlot> => {
    const response = await apiService.post<BlockedTimeSlot>(
      "/time_stock/block",
      data,
    );
    return response.data;
  },

  cancelBlockedDate: async (id: string): Promise<void> => {
    await apiService.delete(`/time_stock/unblock/${id}`);
  },

  cancelBlockedTimeSlot: async (id: string): Promise<void> => {
    await apiService.delete(`/time_stock/unblock/${id}`);
  },
};