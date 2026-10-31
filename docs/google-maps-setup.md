# Mapas en IOTEC Forms Web

La web ya no usa Google Maps ni API key. Los mapas son **Leaflet + OpenStreetMap**:

1. **Detalle de un registro** (`LocationMap`) — pin GPS del formulario (ATU, PGHS, vehículos, motos). Botón satélite con teselas Esri.
2. **Mapa de inspecciones** (`/dashboard/formularios/mapa`) — pines por formulario, clic al detalle.
3. **TMR Distribución → Mapa de calor** — centros de municipio y núcleo.

No hace falta `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`. Si sigue en Heroku o `.env`, se puede quitar.
