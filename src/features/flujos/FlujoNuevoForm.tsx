"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { createFlujoProgramacion } from "./api";
import { ATENCION_PATH } from "./constants";
import { colombiaToday } from "./status";
import styles from "./FlujoNuevoForm.module.scss";

type FormState = {
  nombre: string;
  cedula: string;
  direccion: string;
  barrio: string;
  telefono: string;
  referencia: string;
  color: string;
  ubicacion: string;
  altura: string;
  tiempo: string;
  heridos: string;
  fecha: string;
  recepciona: string;
};

const EMPTY: FormState = {
  nombre: "",
  cedula: "",
  direccion: "",
  barrio: "",
  telefono: "",
  referencia: "",
  color: "",
  ubicacion: "",
  altura: "",
  tiempo: "",
  heridos: "no",
  fecha: colombiaToday(),
  recepciona: "",
};

function opt(value: string): string | undefined {
  const t = value.trim();
  return t ? t : undefined;
}

export default function FlujoNuevoForm() {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = (key: keyof FormState) => (e: { target: { value: string } }) => {
    setForm((prev) => ({ ...prev, [key]: e.target.value }));
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!form.nombre.trim() || !form.cedula.trim() || !form.direccion.trim() || !form.barrio.trim() || !form.telefono.trim()) {
      setError("Nombre, cédula, dirección, barrio y teléfono son obligatorios.");
      return;
    }
    setSaving(true);
    try {
      const created = await createFlujoProgramacion({
        nombre: form.nombre.trim(),
        cedula: form.cedula.trim(),
        direccion: form.direccion.trim(),
        barrio: form.barrio.trim(),
        telefono: form.telefono.trim(),
        referencia: opt(form.referencia),
        color: opt(form.color),
        ubicacion: opt(form.ubicacion),
        altura: opt(form.altura),
        tiempo: opt(form.tiempo),
        heridos: form.heridos,
        fecha: form.fecha,
        recepciona: opt(form.recepciona),
      });
      router.replace(`${ATENCION_PATH}/${created.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo guardar");
      setSaving(false);
    }
  };

  return (
    <div className={styles.container}>
      <Link href={ATENCION_PATH} className={styles.backLink}>
        <ArrowLeft size={18} />
        Volver al listado
      </Link>
      <h2 className={styles.title}>Nueva programación</h2>
      <p className={styles.subtitle}>
        Se asigna el radicado ATN al guardar y queda una visita pendiente para el día indicado.
      </p>

      <form className={styles.form} onSubmit={onSubmit}>
        {error ? <p className={styles.error}>{error}</p> : null}
        <div className={styles.grid}>
          <Input label="Nombre de quien solicita *" value={form.nombre} onChange={set("nombre")} required />
          <Input label="Cédula *" value={form.cedula} onChange={set("cedula")} required />
          <Input
            className={styles.span2}
            label="Dirección *"
            value={form.direccion}
            onChange={set("direccion")}
            required
          />
          <Input label="Barrio *" value={form.barrio} onChange={set("barrio")} required />
          <Input label="Teléfono *" value={form.telefono} onChange={set("telefono")} required />
          <Input label="Referencia" value={form.referencia} onChange={set("referencia")} />
          <Input label="Color" value={form.color} onChange={set("color")} />
          <Input label="Ubicación del nido" value={form.ubicacion} onChange={set("ubicacion")} />
          <Input label="Altura" value={form.altura} onChange={set("altura")} />
          <Input label="Tiempo aproximado" value={form.tiempo} onChange={set("tiempo")} />
          <div className={styles.field}>
            <label className={styles.label} htmlFor="heridos">
              ¿Hay heridos? *
            </label>
            <select
              id="heridos"
              className={styles.select}
              value={form.heridos}
              onChange={set("heridos")}
              required
            >
              <option value="no">No</option>
              <option value="si">Sí</option>
            </select>
          </div>
          <Input label="Fecha de atención *" type="date" value={form.fecha} onChange={set("fecha")} required />
          <Input
            label="Quien recepciona"
            value={form.recepciona}
            onChange={set("recepciona")}
            hint="Si lo dejas vacío se usa tu usuario."
          />
        </div>
        <div className={styles.actions}>
          <Button type="button" variant="outline" onClick={() => router.push(ATENCION_PATH)}>
            Cancelar
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? "Guardando..." : "Guardar programación"}
          </Button>
        </div>
      </form>
    </div>
  );
}
