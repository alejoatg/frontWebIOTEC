import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { API_URL } from "@/lib/api";

export default async function HomePage() {
  const cookieStore = await cookies();
  const cookieHeader = cookieStore
    .getAll()
    .map((c) => `${c.name}=${c.value}`)
    .join("; ");

  try {
    const res = await fetch(`${API_URL}/api/auth/me`, {
      headers: {
        Accept: "application/json",
        ...(cookieHeader ? { Cookie: cookieHeader } : {}),
      },
      cache: "no-store",
    });

    if (res.ok) {
      const data = (await res.json()) as { user?: unknown };
      if (data.user) {
        redirect("/dashboard");
      }
    }
  } catch {
    // Sin API → ir a login
  }

  redirect("/login");
}
