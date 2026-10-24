"use client";

import { Card } from "@/components";
import AdminOnly from "@/features/dashboard/components/AdminOnly/AdminOnly";
import { UsersListContainer } from "@/features/users";
import styles from "./page.module.scss";

export default function UsersPage() {
  return (
    <AdminOnly title="Usuarios del sistema">
      <div className={styles.usersPage}>
        <Card title="Usuarios del sistema">
          <UsersListContainer />
        </Card>
      </div>
    </AdminOnly>
  );
}
