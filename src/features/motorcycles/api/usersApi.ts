import { API_URL } from "@/lib/api";

export interface UserListItem {
  id: string;
  name: string;
  email: string;
  picture: string | null;
}

export async function fetchUsers(): Promise<UserListItem[]> {
  const response = await fetch(`${API_URL}/api/users`, {
    credentials: "include",
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || "Error al consultar usuarios");
  }

  return response.json();
}
