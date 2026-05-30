import { useCallback, useEffect, useState } from 'react';
import { blockingService } from '../services/blocking.service';
import {
    BlockedTimeSlot,
    CreateBlockedTimeSlotRequest
} from '../types/blocking.types';

export const useBlocking = (localId: string) => {
  const [blockedTimeSlots, setBlockedTimeSlots] = useState<BlockedTimeSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBlockedTimeSlots = useCallback(async () => {
    if (!localId) return;
    try {
      setLoading(true);
      setError(null);
      const data = await blockingService.getBlockedTimeSlots(localId);
      setBlockedTimeSlots(data);
    } catch (err) {
      setError('Error fetching blocked time slots');
      console.error('Error in useBlocking:', err);
    } finally {
      setLoading(false);
    }
  }, [localId]);

  const createBlockedTimeSlot = useCallback(async (
    data: CreateBlockedTimeSlotRequest & { localId: string; date: string; notes?: string }
  ) => {
    try {
      setError(null);
      const newBlockedTimeSlot = await blockingService.createBlockedTimeSlot(data);
      setBlockedTimeSlots(prev => [...prev, newBlockedTimeSlot]);
      return newBlockedTimeSlot;
    } catch (err) {
      setError('Error creating blocked time slot');
      throw err;
    }
  }, []);

  const cancelBlockedDate = useCallback(async (id: string) => {
    try {
      setError(null);
      await blockingService.cancelBlockedDate(id);
      setBlockedTimeSlots(prev => prev.filter(item => item.id !== id));
    } catch (err) {
      setError('Error canceling blocked time slot');
      throw err;
    }
  }, []);

  useEffect(() => {
    fetchBlockedTimeSlots();
  }, [fetchBlockedTimeSlots]);

  return {
    blockedTimeSlots,
    loading,
    error,
    refresh: fetchBlockedTimeSlots,
    createBlockedTimeSlot,
    cancelBlockedDate,
  };
};