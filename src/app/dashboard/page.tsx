"use client";

import Image from "next/image";
import { Card, Text } from "@/components";
import { useAuth } from "@/features/auth/hooks/useAuth";
import styles from "./page.module.scss";

export default function DashboardPage() {
  const { user } = useAuth();

  if (!user) return null;

  return (
    <div className={styles.dashboardPage}>
      <Card title="Bienvenido">
        <div className={styles.dashboardWelcome}>
          {user.picture && (
            <Image
              src={user.picture}
              alt=""
              width={56}
              height={56}
              className={styles.dashboardAvatar}
            />
          )}
          <div className={styles.dashboardWelcomeText}>
            <Text variant="body" as="p" className={styles.dashboardName}>
              <strong>{user.name}</strong>
            </Text>
            <Text variant="bodySmall" color="secondary" as="p">
              {user.email}
            </Text>
            <Text variant="caption" color="muted" as="p">
              Rol: {user.role}
            </Text>
          </div>
        </div>
      </Card>
    </div>
  );
}
