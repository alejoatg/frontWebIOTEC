import { Container, Card, Text } from "@/components";
import { BrandLogo } from "@/components/BrandLogo";
import LoginForm from "@/features/auth/components/LoginForm";
import { LOGIN_SUBTITLE } from "@/lib/branding";
import styles from "./page.module.scss";

export default function LoginPage() {
  return (
    <Container size="sm">
      <div className={styles.wrapper}>
        <BrandLogo width={200} className={styles.logo} priority />
        <Card
          title="Iniciar sesión"
          style={{ width: "100%", maxWidth: "24rem" }}
        >
          <Text
            variant="body"
            color="secondary"
            as="p"
            style={{ marginBottom: "1.5rem" }}
          >
            {LOGIN_SUBTITLE}
          </Text>
          <LoginForm />
        </Card>
      </div>
    </Container>
  );
}
