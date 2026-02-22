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
}
