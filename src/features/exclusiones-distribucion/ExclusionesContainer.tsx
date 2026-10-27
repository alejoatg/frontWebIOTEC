"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components";
import { MUNICIPIO_PODAS_OPTIONS } from "@/features/contabilidad/horas-extra/lib/municipioPodas";
import {
  downloadConsolidado,
  downloadIndividuales,
  downloadOrdenPublico,
  previewExclusiones,
  type WorkflowCase,
  type WorkflowPreview,
} from "./api";
import styles from "./ExclusionesContainer.module.scss";

const BATCH = 250;

const COORDINADORES = [
  { id: "diego-molina", nombre: "Diego Molina" },
  { id: "fabian-nanez", nombre: "Fabián Nañez" },
  { id: "julio-torres", nombre: "Julio Torres" },
] as const;

interface Agrupacion {
  id: string;
  municipios: string[];
  circuitos: string[];
  descripcion: string;
  caseIds: string[];
}

function circuitKey(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toUpperCase();
}

function municipioLabel(value: string): string {
  return value.replace(/[_-]+/g, " ").replace(/\s+/g, " ").trim().toUpperCase();
}

function joinSpanish(items: string[]): string {
  if (items.length <= 1) return items[0] ?? "";
  if (items.length === 2) return `${items[0]} Y ${items[1]}`;
  return `${items.slice(0, -1).join(", ")} Y ${items[items.length - 1]}`;
}

function ordenPublicoText(municipios: string[], caseIds: string[]): string {
  const places = joinSpanish(municipios.map(municipioLabel).filter(Boolean));
  const cases = caseIds.join(", ");
  return (
    `La zona rural del municipio de ${places} enfrenta serios problemas para mantener la infraestructura eléctrica ` +
    "debido a la presencia de grupos armados, pandillas y enfrentamientos constantes. Se ha dificultado el " +
    "mantenimiento correctivo teniendo que coordinanar acompañamientos con lideres del territorio y validación del " +
    `orden publico, en la atencion de los casos ${cases} se debio realizar previa validacion de seguridad y ` +
    "coordinacion de acompañamiento con lideres comunitarios a fin de poder acceder a la zona."
  );
}

function expandCaseIds(seed: string[], casos: WorkflowCase[]): string[] {
  const byId = new Map(casos.map((item) => [item.caso, item]));
  const out = new Set<string>();
  const queue = [...seed];
  while (queue.length) {
    const id = queue.pop();
    if (!id || out.has(id) || !byId.has(id)) continue;
    out.add(id);
    for (const other of byId.get(id)?.asociados ?? []) {
      if (!out.has(other)) queue.push(other);
    }
  }
  return [...out].sort((a, b) => a.localeCompare(b, "es"));
}

export default function ExclusionesContainer() {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [file, setFile] = useState<File | null>(null);
  const [template, setTemplate] = useState<File | null>(null);
  const [strictAssociation, setStrictAssociation] = useState(true);
  const [cleanNotes, setCleanNotes] = useState(true);
  const [preview, setPreview] = useState<WorkflowPreview | null>(null);
  const [responsable, setResponsable] = useState<string | null>(null);
  const [coordinador, setCoordinador] = useState("");
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [municipios, setMunicipios] = useState<string[]>([]);
  const [municipioQuery, setMunicipioQuery] = useState("");
  const [circuitos, setCircuitos] = useState<string[]>([]);
  const [circuitoQuery, setCircuitoQuery] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [razonManual, setRazonManual] = useState(false);
  const [soportes, setSoportes] = useState<File[]>([]);
  const [agrupaciones, setAgrupaciones] = useState<Agrupacion[]>([]);
  const [individuales, setIndividuales] = useState<string[]>([]);
  const [individualTotal, setIndividualTotal] = useState(0);

  const options = { strictAssociation, cleanNotes, template };
  const cargaLista = Boolean(preview && responsable !== null && coordinador);

  const casos = useMemo(
    () => (preview && responsable !== null ? preview.casos.filter((item) => item.responsable === responsable) : []),
    [preview, responsable],
  );
  const agrupados = useMemo(() => new Set(agrupaciones.flatMap((item) => item.caseIds)), [agrupaciones]);
  const pendientesOp = casos.filter((item) => item.ordenPublico && !agrupados.has(item.caso));
  const restantes = casos.filter((item) => !agrupados.has(item.caso));
  const circuitosDisponibles = useMemo(() => {
    const names = new Set<string>();
    for (const item of pendientesOp) {
      for (const name of item.circuitos) if (name.trim()) names.add(name.trim());
    }
    return [...names].sort((a, b) => a.localeCompare(b, "es"));
  }, [pendientesOp]);

  const listaCircuitos = useMemo(() => {
    const query = circuitKey(circuitoQuery);
    return circuitosDisponibles.filter((name) => !query || circuitKey(name).includes(query));
  }, [circuitoQuery, circuitosDisponibles]);

  const municipiosDisponibles = useMemo(
    () =>
      [...MUNICIPIO_PODAS_OPTIONS].sort((a, b) => {
        if (a.key === "other") return 1;
        if (b.key === "other") return -1;
        return a.value.localeCompare(b.value, "es");
      }),
    [],
  );

  const listaMunicipios = useMemo(() => {
    const query = circuitKey(municipioQuery);
    return municipiosDisponibles.filter(
      (item) => !query || circuitKey(item.value).includes(query),
    );
  }, [municipioQuery, municipiosDisponibles]);

  const casosSeleccion = useMemo(() => {
    const wanted = new Set(circuitos.map(circuitKey));
    const seed = pendientesOp
      .filter((item) => item.circuitos.some((name) => wanted.has(circuitKey(name))))
      .map((item) => item.caso);
    return expandCaseIds(seed, casos.filter((item) => !agrupados.has(item.caso)));
  }, [circuitos, pendientesOp, casos, agrupados]);

  const veredasSeleccion = useMemo(() => {
    const chosen = new Set(casosSeleccion);
    const names: string[] = [];
    const seen = new Set<string>();
    for (const item of casos) {
      if (!chosen.has(item.caso)) continue;
      for (const name of item.veredas ?? []) {
        const key = circuitKey(name);
        if (!key || seen.has(key)) continue;
        seen.add(key);
        names.push(name);
      }
    }
    return names;
  }, [casos, casosSeleccion]);

  const textoSugerido = ordenPublicoText(municipios, casosSeleccion);
  const razon = razonManual ? descripcion : textoSugerido;
  const procesados = useMemo(() => {
    const ids = new Set<string>([...agrupados, ...individuales]);
    return [...ids];
  }, [agrupados, individuales]);
  const lotes = Math.max(1, Math.ceil((individualTotal || restantes.length) / BATCH));

  function resetTrabajo() {
    setAgrupaciones([]);
    setIndividuales([]);
    setIndividualTotal(0);
    setMunicipios([]);
    setMunicipioQuery("");
    setCircuitos([]);
    setCircuitoQuery("");
    setDescripcion("");
    setRazonManual(false);
    setSoportes([]);
    setStep(1);
  }

  async function handlePreview() {
    if (!file) {
      setError("Seleccione el CONSOLIDADO (.xlsx)");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const result = await previewExclusiones(file, options);
      setPreview(result);
      setResponsable(null);
      resetTrabajo();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al analizar");
    } finally {
      setLoading(false);
    }
  }

  function toggle(list: string[], value: string, setList: (next: string[]) => void) {
    setList(list.includes(value) ? list.filter((item) => item !== value) : [...list, value]);
    setRazonManual(false);
  }

  async function crearAgrupacion() {
    if (!file || responsable === null || !coordinador) return;
    if (!municipios.length || !circuitos.length) {
      setError("Seleccione municipios y circuitos");
      return;
    }
    if (!casosSeleccion.length) {
      setError("Esos circuitos no tienen casos de orden público pendientes");
      return;
    }
    setGenerating(true);
    setError(null);
    try {
      const caseIds = await downloadOrdenPublico(file, options, {
        responsable,
        coordinador,
        municipios,
        circuitos,
        descripcion: razon,
        excludeCaseIds: [...agrupados],
        soportes,
      });
      setAgrupaciones((current) => [
        ...current,
        {
          id: `${Date.now()}`,
          municipios: [...municipios],
          circuitos: [...circuitos],
          descripcion: razon,
          caseIds: caseIds.length ? caseIds : casosSeleccion,
        },
      ]);
      setCircuitos([]);
      setSoportes([]);
      setRazonManual(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al generar el informe");
    } finally {
      setGenerating(false);
    }
  }

  async function handleIndividuales(batchIndex: number) {
    if (!file || responsable === null || !coordinador) return;
    setGenerating(true);
    setError(null);
    try {
      const result = await downloadIndividuales(file, options, {
        responsable,
        coordinador,
        excludeCaseIds: [...agrupados],
        batchSize: BATCH,
        batchIndex,
      });
      setIndividuales((current) => [...new Set([...current, ...result.cases])]);
      setIndividualTotal(result.total);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al generar individuales");
    } finally {
      setGenerating(false);
    }
  }

  async function handleConsolidado() {
    if (!file || responsable === null || !coordinador || procesados.length === 0) return;
    setGenerating(true);
    setError(null);
    try {
      await downloadConsolidado(file, options, {
        responsable,
        coordinador,
        caseIds: procesados,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al generar el consolidado");
    } finally {
      setGenerating(false);
    }
  }

  const contratista = preview?.contratistas.find((item) => item.nombre === responsable);
  const repetidos = useMemo(() => {
    if (!preview || responsable === null) return [];
    return preview.casos
      .filter((item) => item.responsable === responsable && item.filas > 1)
      .sort((a, b) => b.filas - a.filas || a.caso.localeCompare(b.caso, "es"));
  }, [preview, responsable]);

  return (
    <div className={styles.wrap}>
      <ol className={styles.steps}>
        {[
          { n: 1 as const, title: "Carga", detail: cargaLista ? "Lista" : "Archivo, contratista y firma" },
          {
            n: 2 as const,
            title: "Orden público",
            detail: preview ? `${pendientesOp.length} casos sueltos` : "Agrupar circuitos",
          },
          {
            n: 3 as const,
            title: "Individuales y cierre",
            detail: preview ? `${restantes.length} casos` : "Resto y consolidado",
          },
        ].map((item) => {
          const locked = item.n > 1 && !cargaLista;
          return (
            <li key={item.n}>
              <button
                type="button"
                className={step === item.n ? styles.stepOn : styles.step}
                disabled={locked}
                onClick={() => setStep(item.n)}
              >
                <span>{item.n}</span>
                <strong>{item.title}</strong>
                <small>{item.detail}</small>
              </button>
            </li>
          );
        })}
      </ol>

      {error ? <p className={styles.error}>{error}</p> : null}

      {step === 1 ? (
        <>
          <p className={styles.hint}>
            Suba el CONSOLIDADO en <strong>.xlsx</strong>. El flujo usa solo filas con{" "}
            <strong>Entregado a Mto = 0</strong> del contratista elegido. La firma va en la celda del contratista.
          </p>
          <div className={styles.row}>
            <div className={styles.field}>
              <label>CONSOLIDADO (.xlsx)</label>
              <input
                type="file"
                accept=".xlsx"
                onChange={(e) => {
                  setFile(e.target.files?.[0] ?? null);
                  setPreview(null);
                  setResponsable(null);
                  resetTrabajo();
                }}
              />
            </div>
            <div className={styles.field}>
              <label>Plantilla Soporte (opcional)</label>
              <input type="file" accept=".xlsx" onChange={(e) => setTemplate(e.target.files?.[0] ?? null)} />
            </div>
          </div>
          <div className={styles.checks}>
            <label>
              <input type="checkbox" checked={strictAssociation} onChange={(e) => setStrictAssociation(e.target.checked)} />{" "}
              Asociación estricta
            </label>
            <label>
              <input type="checkbox" checked={cleanNotes} onChange={(e) => setCleanNotes(e.target.checked)} /> Limpiar
              texto de notas
            </label>
          </div>
          <div>
            <Button type="button" disabled={loading || !file} onClick={() => void handlePreview()}>
              {loading ? "Analizando…" : "Analizar archivo"}
            </Button>
          </div>
          {preview ? (
            <>
              <div className={styles.stats}>
                <div className={styles.stat}>
                  <strong>{preview.totalRows}</strong>Filas
                </div>
                <div className={styles.stat}>
                  <strong>{preview.filasPendientes}</strong>Filas con Entregado a Mto = 0
                </div>
                <div className={styles.stat}>
                  <strong>{preview.pendientes}</strong>Casos distintos
                </div>
                <div className={styles.stat}>
                  <strong>{preview.contratistas.length}</strong>Contratistas
                </div>
              </div>
              <div className={styles.field}>
                <label>RESP. Contratista</label>
                <select
                  value={responsable ?? "__none"}
                  onChange={(e) => {
                    if (e.target.value === "__none") {
                      setResponsable(null);
                      return;
                    }
                    setResponsable(e.target.value);
                    resetTrabajo();
                  }}
                >
                  <option value="__none">Seleccione…</option>
                  {preview.contratistas.map((item) => (
                    <option key={item.nombre || "vacio"} value={item.nombre}>
                      {(item.nombre || "(Sin contratista)") +
                        ` · ${item.filas} filas · ${item.pendientes} casos` +
                        (item.duplicados > 0 ? ` · ${item.duplicados} repetidos` : "") +
                        ` · ${item.ordenPublico} orden público`}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <p className={styles.hint}>Coordinador que firma</p>
                <div className={styles.choices}>
                  {COORDINADORES.map((item) => (
                    <label key={item.id} className={coordinador === item.id ? styles.choiceOn : styles.choice}>
                      <input
                        type="radio"
                        name="coordinador"
                        checked={coordinador === item.id}
                        onChange={() => setCoordinador(item.id)}
                      />
                      {item.nombre}
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <Button type="button" disabled={!cargaLista} onClick={() => setStep(2)}>
                  Continuar a orden público
                </Button>
              </div>
              {contratista ? (
                <div className={styles.dupesBlock}>
                  <p className={styles.hint}>
                    {contratista.filas} filas con Entregado a Mto = 0. Son {contratista.pendientes} casos:{" "}
                    {contratista.ordenPublico} de orden público y {contratista.pendientes - contratista.ordenPublico} del
                    resto.
                  </p>
                  {repetidos.length > 0 ? (
                    <>
                      <p className={styles.hint}>
                        {repetidos.length === 1
                          ? "1 caso se repite en varias filas, con el mismo número en distintos circuitos. Esos circuitos salen juntos en un solo informe."
                          : `${repetidos.length} casos se repiten en varias filas, con el mismo número en distintos circuitos. Cada uno sale en un solo informe, con todos sus circuitos.`}
                      </p>
                      <ul className={styles.dupes}>
                        {repetidos.map((item) => (
                          <li key={item.caso}>
                            <strong>{item.caso}</strong>
                            <span>{item.filas} filas</span>
                            <span>{item.circuitos.filter(Boolean).join(", ")}</span>
                          </li>
                        ))}
                      </ul>
                    </>
                  ) : null}
                </div>
              ) : null}
            </>
          ) : null}
        </>
      ) : null}

      {step === 2 && cargaLista ? (
        <>
          <p className={styles.hint}>
            {pendientesOp.length} casos de orden público sin agrupar. Elija municipios y circuitos. Si una nota asocia
            otro caso, entra en el mismo Excel.
          </p>
          <div className={styles.split}>
            <div className={styles.field}>
              <label>Municipios</label>
              <input
                type="search"
                value={municipioQuery}
                placeholder="Filtrar municipios…"
                onChange={(e) => setMunicipioQuery(e.target.value)}
              />
              <div className={styles.pickList}>
                {listaMunicipios.length === 0 ? (
                  <p className={styles.hint}>No hay municipios con ese texto.</p>
                ) : null}
                {listaMunicipios.map((item) => (
                  <label key={item.key}>
                    <input
                      type="checkbox"
                      checked={municipios.includes(item.value)}
                      onChange={() => toggle(municipios, item.value, setMunicipios)}
                    />{" "}
                    {item.value}
                  </label>
                ))}
              </div>
            </div>
            <div className={styles.field}>
              <label>Circuitos pendientes</label>
              <input
                type="search"
                value={circuitoQuery}
                placeholder="Filtrar circuitos…"
                onChange={(e) => setCircuitoQuery(e.target.value)}
              />
              <div className={styles.pickList}>
                {listaCircuitos.length === 0 ? (
                  <p className={styles.hint}>No hay circuitos con ese texto.</p>
                ) : null}
                {listaCircuitos.map((name) => (
                  <label key={name}>
                    <input
                      type="checkbox"
                      checked={circuitos.includes(name)}
                      onChange={() => toggle(circuitos, name, setCircuitos)}
                    />{" "}
                    {name}
                  </label>
                ))}
              </div>
            </div>
          </div>
          <p className={styles.hint}>
            Veredas:{" "}
            {veredasSeleccion.length
              ? veredasSeleccion.join(", ")
              : "ninguna mencionada en las notas de los casos elegidos"}
            . En el Excel quedan en Ubicación, debajo de los municipios.
          </p>
          <div className={styles.field}>
            <label>Razón · {casosSeleccion.length} casos</label>
            <textarea
              rows={6}
              value={razon}
              onChange={(e) => {
                setRazonManual(true);
                setDescripcion(e.target.value);
              }}
            />
            {razonManual ? (
              <button
                type="button"
                className={styles.link}
                onClick={() => {
                  setRazonManual(false);
                  setDescripcion("");
                }}
              >
                Restaurar texto sugerido
              </button>
            ) : null}
          </div>
          <div className={styles.field}>
            <label>Soportes de orden público (imágenes)</label>
            <input
              type="file"
              accept="image/png,image/jpeg,image/gif"
              multiple
              onChange={(e) => setSoportes([...(e.target.files ?? [])])}
            />
          </div>
          <div>
            <Button type="button" disabled={generating || !circuitos.length || !municipios.length} onClick={() => void crearAgrupacion()}>
              {generating ? "Generando…" : "Crear agrupación y descargar"}
            </Button>
          </div>
          {agrupaciones.length ? (
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Municipios</th>
                    <th>Circuitos</th>
                    <th>Casos</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {agrupaciones.map((item) => (
                    <tr key={item.id}>
                      <td>{item.municipios.join(", ")}</td>
                      <td>{item.circuitos.join(", ")}</td>
                      <td>{item.caseIds.length}</td>
                      <td>
                        <button
                          type="button"
                          className={styles.link}
                          onClick={() => setAgrupaciones((current) => current.filter((row) => row.id !== item.id))}
                        >
                          Quitar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}
          <div>
            <Button type="button" variant="outline" onClick={() => setStep(3)}>
              Continuar a individuales
            </Button>
          </div>
        </>
      ) : null}

      {step === 3 && cargaLista ? (
        <>
          <p className={styles.hint}>
            {restantes.length} casos siguen pendientes, incluidos los de orden público que no se agruparon. Cada
            continuación sale en un Excel. Al final, el consolidado marca Entregado a Mto = 1 solo en los casos ya generados.
          </p>
          <div className={styles.stats}>
            <div className={styles.stat}>
              <strong>{agrupados.size}</strong>En orden público
            </div>
            <div className={styles.stat}>
              <strong>{individuales.length}</strong>Individuales generados
            </div>
            <div className={styles.stat}>
              <strong>{procesados.length}</strong>Listos para el consolidado
            </div>
          </div>
          <div className={styles.batch}>
            {individualTotal > BATCH ? (
              Array.from({ length: lotes }, (_, index) => (
                <Button
                  key={index}
                  type="button"
                  variant="outline"
                  disabled={generating || restantes.length === 0}
                  onClick={() => void handleIndividuales(index)}
                >
                  Lote {index + 1}
                </Button>
              ))
            ) : (
              <Button
                type="button"
                disabled={generating || restantes.length === 0}
                onClick={() => void handleIndividuales(0)}
              >
                {generating ? "Generando…" : "Generar ZIP individual"}
              </Button>
            )}
            <Button type="button" variant="outline" disabled={generating || procesados.length === 0} onClick={() => void handleConsolidado()}>
              Descargar ConsolidadoUTEN
            </Button>
          </div>
        </>
      ) : null}
    </div>
  );
}
