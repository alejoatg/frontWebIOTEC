import {
  Button,
  Card,
  Container,
  Input,
  Text,
} from "../components";

export default function Home() {
  return (
    <main>
      <Container size="lg">
      <div style={{ paddingTop: "2rem", paddingBottom: "2rem" }}>
        <Text as="h1" variant="heading1" style={{ marginBottom: "0.5rem" }}>
          Sistema de diseño
        </Text>
        <Text variant="body" color="secondary" style={{ marginBottom: "2rem" }}>
          Componentes base y tema global (naranja + gris).
        </Text>

        <Card title="Botones" style={{ marginBottom: "1.5rem" }}>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "0.75rem",
              marginBottom: "1rem",
            }}
          >
            <Button variant="primary">Primary</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="ghost">Ghost</Button>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem" }}>
            <Button size="sm" variant="primary">
              Small
            </Button>
            <Button size="md" variant="primary">
              Medium
            </Button>
            <Button size="lg" variant="primary">
              Large
            </Button>
          </div>
        </Card>

        <Card title="Input" style={{ marginBottom: "1.5rem" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <Input label="Nombre" placeholder="Escribe tu nombre" />
            <Input
              label="Email"
              type="email"
              placeholder="correo@ejemplo.com"
              hint="Usaremos este email para notificaciones."
            />
            <Input
              label="Campo con error"
              placeholder="Valor inválido"
              error="Este campo es obligatorio."
            />
          </div>
        </Card>

        <Card title="Tipografía">
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            <Text variant="heading1">Heading 1</Text>
            <Text variant="heading2">Heading 2</Text>
            <Text variant="heading3">Heading 3</Text>
            <Text variant="body">Cuerpo de texto normal.</Text>
            <Text variant="bodySmall" color="secondary">
              Texto pequeño secundario.
            </Text>
            <Text variant="caption" color="muted">
              Caption o texto auxiliar.
            </Text>
          </div>
        </Card>
      </div>
      </Container>
    </main>
  );
}
