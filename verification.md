# Nota breve de verificación

- **Afirmación incorrecta:** «El dashboard muestra necesariamente datos de 2024». **Corrección:** la interfaz etiqueta el período como `2024 - Full Year` (`frontend/src/App.tsx`, línea 49), pero el backend genera movimientos para los doce meses del año que determina a partir de la fecha actual (`backend/app/routes.py`, líneas 65–68 y 94–104).
- **Afirmación incorrecta:** «La interfaz permite aplicar filtros». **Corrección:** la API acepta filtros en algunas rutas (`backend/app/routes.py`, por ejemplo líneas 248–260 y 268–285), pero la vista principal solo solicita `/api/metrics` sin parámetros ni controles de filtro (`frontend/src/App.tsx`, líneas 15–20 y 29–43).
- **Afirmación sin verificar:** «La aplicación está desplegada públicamente». **Corrección:** no se afirma despliegue; los archivos consultados describen la ejecución local mediante Docker Compose (`README.es.md`, líneas 40–50; `docker-compose.yml`).

## Rastro de verificación de la especificación de métricas

- **F1 — Fechas:** se verificó `GET /api/metrics/facets` como fuente de opciones y rango (`min_date`, `max_date`), y `GET /api/metrics` como endpoint que realmente recibe los filtros opcionales `start_date` y `end_date` (fechas inclusivas), además de `category` y `operation_type`. Se corrigió la spec para no atribuir filtrado a `facets` (`frontend/specs/financial-metrics-features.md`).
- **F2 — Alertas:** se documentaron los parámetros y campos reales de `GET /api/metrics/alerts`. Se aclara que `increase_ratio` es una razón decimal, que la condición es superar estrictamente `threshold` y que el API no devuelve severidad ni texto descriptivo.
- **F3 — B2B/B2C:** se documentó que `facets` solo enumera los segmentos disponibles y que `GET /api/metrics/categories/top` compara un segmento por llamada mediante `business_type`; también se deja pendiente definir si producto compara `income`, `outcome` o permite elegir ambos.
- **Verificación:** contratos contrastados con `/openapi.json`, rutas en `backend/app/routes.py` y ejemplos consultados en el API activo. Cambio limitado a documentación; no se modificaron ni implementaron funcionalidades en el código.
