export interface LocalService {
  id: number;
  name: string;
  description: string;
  cost: number;
  duration: number;
  category: string;
  isActive: boolean;
  localId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateServiceRequest {
  name: string;
  description?: string;
  cost: number;
  duration: number;
  category?: string;
  localId: string;
}

export interface UpdateServiceRequest {
  name?: string;
  description?: string;
  cost?: number;
  duration?: number;
  category?: string;
}
