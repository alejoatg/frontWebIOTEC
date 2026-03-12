import { API_URL } from "@/lib/api";
import type {
  Motorcycle,
  CreateMotorcyclePayload,
  UpdateMotorcyclePayload,
} from "../types";

const BASE_PATH = `${API_URL}/api/motorcycles`;

export async function fetchMotorcycles(): Promise<Motorcycle[]> {
  const response = await fetch(BASE_PATH, { credentials: "include" });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || "Error al consultar motocicletas");
  }

  return response.json();
}

export async function fetchMotorcycleById(id: string): Promise<Motorcycle> {
  const response = await fetch(`${BASE_PATH}/${id}`, {
    credentials: "include",
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || "Error al consultar la motocicleta");
  }

  return response.json();
}

export async function createMotorcycle(
  data: CreateMotorcyclePayload,
): Promise<Motorcycle> {
  const response = await fetch(BASE_PATH, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || "Error al crear la motocicleta");
  }

  return response.json();
}

export async function updateMotorcycle(
  id: string,
  data: UpdateMotorcyclePayload,
): Promise<Motorcycle> {
  const response = await fetch(`${BASE_PATH}/${id}`, {
    method: "PATCH",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || "Error al actualizar la motocicleta");
  }

  return response.json();
}

export async function deactivateMotorcycle(id: string): Promise<Motorcycle> {
  const response = await fetch(`${BASE_PATH}/${id}/deactivate`, {
    method: "PATCH",
    credentials: "include",
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || "Error al inactivar la motocicleta");
  }

  return response.json();
}
