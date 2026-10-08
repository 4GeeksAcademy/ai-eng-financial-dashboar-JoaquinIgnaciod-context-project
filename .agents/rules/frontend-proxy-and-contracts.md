# Proxy API y contratos del frontend

## Regla

- Mantén las llamadas de la interfaz bajo `/api` y conserva la configuración del proxy de Vite al backend del servicio Compose (`http://backend:8000`). Si cambias puerto, nombre de servicio o ruta, actualiza de forma coordinada proxy, Compose y backend.
- Si se modifica el contrato de movimientos —campos o valores permitidos—, actualiza conjuntamente tipos TypeScript, modelos/endpoints FastAPI y pruebas relevantes.
- No presentes como funcionalidad de la interfaz filtros que solo estén implementados en endpoints: agrega controles y parámetros en el frontend si se desea que el usuario pueda usarlos.
- No presupongas que la etiqueta visual del período determina el rango de datos del backend; al cambiar período o generación, sincroniza etiqueta, lógica y datos.

## Hechos concretos del repositorio

- `frontend/src/App.tsx` construye la solicitud `fetch(`${API_BASE_URL}/api/metrics`)`; `VITE_API_BASE_URL` es opcional y su valor por defecto es cadena vacía.
- `frontend/vite.config.ts` proxifica `/api` a `http://backend:8000`.
- `docker-compose.yml` nombra `backend` al servicio y publica `8000:8000`.
- El tipo `FinancialMovement` aparece en `frontend/src/lib/financial-types.ts` y el modelo del mismo nombre está en `backend/app/routes.py`; tipos de operación, categoría y negocio están definidos en ambos lados.
- La página principal (`frontend/src/App.tsx`) consulta `/api/metrics` sin query params. La API sí declara filtros en `backend/app/routes.py`, por ejemplo en `get_metrics` y `get_metrics_summary`.
- `frontend/src/App.tsx` muestra `2024 - Full Year`, pero `backend/app/routes.py` calcula el año de generación con `date.today()` en `_year_for_month`.
