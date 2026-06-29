import { API_URL } from "@/lib/api";
import type { LinkEmployeeErrorCode, User } from "@/types/auth";

export async function linkEmployee(documentNumber: string): Promise<User> {
  const normalized = documentNumber.replace(/\D/g, "").slice(0, 15);
  const response = await fetch(`${API_URL}/api/users/me/link-employee`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({ documentNumber: normalized }),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const code = (data.code as LinkEmployeeErrorCode | undefined) ?? "EMPLOYEE_NOT_FOUND";
    const message =
      typeof data.message === "string"
        ? data.message
        : Array.isArray(data.message)
          ? data.message[0]
          : "No se pudo vincular la cédula.";
    const err = new Error(message) as Error & { code: LinkEmployeeErrorCode };
    err.code = code;
    throw err;
  }

  return data as User;
}
