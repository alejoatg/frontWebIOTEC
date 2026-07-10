# Configurar Google Maps (IOTEC Forms Web)

La web usa **una sola API key** (`NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`) para:

1. **Detalle de un registro** — Maps Embed API (mapa + Street View en iframe)
2. **Mapa de inspecciones** — Maps JavaScript API (pines, clustering, clic → detalle)

## Pasos

### 1. Proyecto en Google Cloud

1. Entra a [Google Cloud Console](https://console.cloud.google.com/)
2. Crea o selecciona un proyecto
3. Activa facturación (requerido por Google Maps Platform; el uso habitual queda cubierto por el crédito mensual gratuito)

### 2. Habilitar APIs

En **APIs y servicios → Biblioteca**, habilita:

- **Maps Embed API** (detalle de formulario)
- **Maps JavaScript API** (vista `/dashboard/formularios/mapa`)

### 3. Crear la API key

1. **APIs y servicios → Credenciales → Crear credenciales → Clave de API**
2. Restringe la key:
   - **Restricciones de aplicación:** Referentes HTTP  
     Ejemplos: `http://localhost:3000/*`, `https://tu-dominio.com/*`
   - **Restricciones de API:** solo Maps Embed API + Maps JavaScript API
3. Copia la key

### 4. Configurar en el proyecto

En `web/.env` y `web/.env.local` (y en Heroku/hosting):

```env
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=AIzaSy...tu_key...
```

Reinicia el servidor de Next.js (`npm run dev`) para que tome la variable.

### 5. Verificar

- Abre un detalle de ATU / PGHS / Vehículos / Motos con GPS → debe verse el mapa embebido
- Abre **Formularios → Mapa de inspecciones** → busca por fechas → deben aparecer pines

## Notas

- Sin key, la UI muestra un aviso y un enlace a Google Maps (no rompe la app)
- No subas la key a un repo público sin restricciones de dominio
- Documentación oficial: [Maps Embed](https://developers.google.com/maps/documentation/embed) · [Maps JavaScript](https://developers.google.com/maps/documentation/javascript)
