import type { Local } from '@/lib/types/local';

export type { Local } from '@/lib/types/local';

export interface LocalAppointment {
  id: number;
  clientName: string;
  clientEmail: string;
  serviceName: string;
  startDateTime: string;
  endDateTime: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  price: number;
}

export interface LocalDashboardStats {
  todayAppointments: number;
  weekAppointments: number;
  monthlyRevenue: number;
  totalClients: number;
}

export interface LocalNextAppointment {
  id: number;
  clientName: string;
  serviceName: string;
  startDateTime: string;
  estimatedDuration: number;
}

export interface LocalImage {
  id: number;
  url: string;
  image: string;
  description?: string;
  uploadedAt: string;
  localId: string;
}

export interface LocalWithImages extends Local {
  images: LocalImage[];
}

export interface ImageUploadRequest {
  uri: string;
  description?: string;
}

export interface LocalImageFormData {
  description: string;
}