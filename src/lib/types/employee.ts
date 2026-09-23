export interface EmployeeServiceRef {
  id: number;
  name: string;
}

export interface Employee {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  avatar?: string;
  color?: string;
  isActive: boolean;
  localId: string;
  /** Servicios que atiende. Vacio o ausente = atiende todos (regla de dominio 5). */
  services?: EmployeeServiceRef[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateEmployeeRequest {
  name: string;
  email?: string;
  phone?: string;
  color?: string;
  /** Reemplazo completo. Omitir deja el actual; array vacio = atiende todos. */
  serviceIds?: number[];
}

export interface UpdateEmployeeRequest {
  name?: string;
  email?: string;
  phone?: string;
  color?: string;
  serviceIds?: number[];
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
