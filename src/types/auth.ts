export interface LinkedEmployee {
  id: string;
  documentNumber: string;
  firstName: string;
  lastName: string;
  fullName: string;
  isActive: boolean;
  jobPosition: string | null;
  zone: string | null;
}

/**
 * Usuario devuelto por GET /api/auth/me (sin datos sensibles).
 */
export interface User {
  id: string;
  email: string;
  name: string;
  picture: string | null;
  role: string;
  isActive: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
  employeeLinked: boolean;
  employee: LinkedEmployee | null;
}

export type LinkEmployeeErrorCode =
  | 'EMPLOYEE_NOT_FOUND'
  | 'EMPLOYEE_ALREADY_LINKED'
  | 'USER_ALREADY_LINKED'
  | 'EMPLOYEE_INACTIVE'
  | 'INVALID_DOCUMENT';
