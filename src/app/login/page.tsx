import Link from "next/link";
import { Container, Card, Text } from "@/components";
import LoginForm from "@/features/auth/components/LoginForm";

export default function LoginPage() {
  return (
    <Container size="sm">
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          paddingTop: "2rem",
          paddingBottom: "2rem",
        }}
      >
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
            Usa tu cuenta de Google Workspace para acceder.
          </Text>
          <LoginForm />
        </Card>
        <Text
          variant="bodySmall"
          color="muted"
          as="p"
          style={{ marginTop: "1.5rem" }}
        >
          <Link href="/">Volver al inicio</Link>
        </Text>
      </div>
    </Container>
  );
}
