export interface Employee {
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

export interface CreateEmployeeRequest {
  name: string;
  email?: string;
  phone?: string;
  color?: string;
}

export interface UpdateEmployeeRequest {
  name?: string;
  email?: string;
  phone?: string;
  color?: string;
}
