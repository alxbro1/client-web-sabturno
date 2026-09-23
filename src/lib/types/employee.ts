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

/**
 * Public shape returned by `GET /locals/:localId/employees/public`. Never
 * carries email/phone — that endpoint has no auth guard.
 */
export interface PublicEmployee {
  id: string;
  name: string;
  color?: string;
  avatar?: string | null;
}
