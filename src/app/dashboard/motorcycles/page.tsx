"use client";

import AdminOnly from "@/features/dashboard/components/AdminOnly/AdminOnly";
import { MotorcyclesContainer } from "@/features/motorcycles";

export default function MotorcyclesPage() {
  return (
    <AdminOnly title="Motocicletas">
      <MotorcyclesContainer />
    </AdminOnly>
  );
}
