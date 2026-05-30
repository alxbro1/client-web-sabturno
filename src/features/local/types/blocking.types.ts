export interface BaseBlocking {
  id: string;
  localId: string;
  date: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface BaseCreateBlockingRequest {
  localId: string;
  date: string;
  notes?: string;
}

export type BlockedDate = BaseBlocking;

export interface BlockedTimeSlot extends BaseBlocking {
  moduleStartTime: string;
  moduleEndTime: string;
  notes?: string;
}

export type CreateBlockedDateRequest = BaseCreateBlockingRequest;

export interface CreateBlockedTimeSlotRequest extends BaseCreateBlockingRequest {
  startTime: string;
  endTime: string;
}

export interface BlockedDatesResponse {
  blockedDates: BlockedDate[];
  blockedTimeSlots: BlockedTimeSlot[];
}

export type BlockingType = 'full-day' | 'time-slot';

export interface BlockingFormData {
  type: BlockingType;
  date: string;
  startTime?: string;
  endTime?: string;
  notes?: string;
  timezone: string;
}