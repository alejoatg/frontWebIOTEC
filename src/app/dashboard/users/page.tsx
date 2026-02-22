"use client";

import { Card } from "@/components";
import { UsersListContainer } from "@/features/users";
import styles from "./page.module.scss";

export default function UsersPage() {
  return (
    <div className={styles.usersPage}>
      <Card title="Usuarios del sistema">
        <UsersListContainer />
      </Card>
    </div>
  );
}
