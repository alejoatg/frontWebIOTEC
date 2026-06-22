import { cookies } from "next/headers";
import { NextRequest } from "next/server";
import { API_URL } from "@/lib/api";

/**
 * Proxy same-origin de archivos S3. Solo funciona si la sesión de la API
 * comparte dominio con la web (p. ej. localhost). En producción con web y API
 * en hosts distintos, usar el componente MediaImage (fetch con credentials).
 */
export async function GET(request: NextRequest) {
  const key = request.nextUrl.searchParams.get("key");

  if (!key?.startsWith("submissions/") || key.includes("..")) {
    return new Response("Solicitud inválida", { status: 400 });
  }

  const cookieStore = await cookies();
  const cookieHeader = cookieStore
    .getAll()
    .map((c) => `${c.name}=${c.value}`)
    .join("; ");

  const upstream = await fetch(
    `${API_URL}/api/files/stream?key=${encodeURIComponent(key)}`,
    {
      headers: {
        ...(cookieHeader ? { Cookie: cookieHeader } : {}),
      },
      cache: "no-store",
    },
  );

  if (!upstream.ok) {
    return new Response("No se pudo cargar el archivo", { status: upstream.status });
  }

  const contentType = upstream.headers.get("content-type") ?? "application/octet-stream";

  return new Response(upstream.body, {
    status: 200,
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "private, max-age=3600",
    },
  });
}
