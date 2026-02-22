/**
 * Roles disponibles en el sistema.
 */
export type UserRole = "ADMIN" | "CORDINADOR" | "SUPERVISOR" | "COLABORADOR";

/**
 * Usuario del listado (datos devueltos por GET /api/users).
 */
export interface UserListItem {
  id: string;
  email: string;
  name: string;
  picture: string | null;
  role: UserRole;
  isActive: boolean;
  lastLoginAt: string | null;
  createdAt: string;
}

/**
 * Estado del hook useUsers.
 */
export interface UseUsersResult {
  users: UserListItem[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}
