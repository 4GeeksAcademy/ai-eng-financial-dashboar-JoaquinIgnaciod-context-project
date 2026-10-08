# Patrones del sistema y estado actual

## Arquitectura y patrones verificados

- **Frontend:** una SPA React monta `App` desde `frontend/src/main.tsx`. `App` solicita movimientos al backend, calcula KPI y datos mensuales mediante `src/lib/financial-utils.ts`, y entrega los resultados a componentes dashboard.
- **Backend:** `backend/app/main.py` crea la aplicación FastAPI, configura CORS y monta el router declarado en `backend/app/routes.py`.
- **Datos:** el backend genera movimientos sintéticos deterministas con semilla `42` cuando los endpoints llaman al generador. No hay base de datos configurada en `docker-compose.yml` ni en las dependencias del backend inspeccionadas.
- **Presentación:** componentes React tipados, estilos Tailwind CSS y tokens CSS semánticos; los gráficos usan Recharts.
- **Pruebas:** pytest con TestClient para API y Vitest para utilidades del frontend.

## Funcionalidad que existe actualmente

- La UI obtiene `GET /api/metrics` sin parámetros al montarse.
- Calcula totales de ingresos y egresos, beneficio y porcentaje de beneficio; agrupa también por mes para alimentar dos gráficos.
- Incluye indicadores de carga y un mensaje visible al fallar la solicitud.
- El encabezado de la UI muestra la etiqueta fija `2024 - Full Year`. El año de los movimientos generados por backend se deriva de la fecha actual; la etiqueta no es una prueba de que los datos correspondan a 2024.
- La API genera datos simulados, no lee movimientos de una base de datos.

## Endpoints FastAPI expuestos

Todos son rutas declaradas con `@router.get` en `backend/app/routes.py`:

| Método y ruta | Función |
|---|---|
| `GET /health` | Estado básico, responde `{"status":"ok"}`. |
| `GET /api/health-check` | Endpoint dummy de salud añadido; responde `{"status":"ok"}`. |
| `GET /api/metrics` | Movimientos con filtros opcionales de fecha, categoría y tipo de operación. |
| `GET /api/metrics/facets` | Valores disponibles de operaciones, negocios y categorías, y rango de fechas. |
| `GET /api/metrics/summary` | Agregados por día, semana o mes, con filtros. |
| `GET /api/metrics/categories/top` | Categorías principales por tipo de operación y límite configurable. |
| `GET /api/metrics/comparison` | Beneficio neto para un período frente al período anterior; fechas requeridas. |
| `GET /api/metrics/alerts` | Alertas de aumento de egresos frente a promedios previos. |
| `GET /api/metrics/b2b` | Movimientos filtrados a negocio B2B. |
| `GET /api/metrics/b2c` | Movimientos filtrados a negocio B2C. |

La documentación interactiva la genera FastAPI; el README declara `http://localhost:8000/docs` para el entorno local descrito.

## Pendiente / límites que se pueden afirmar

- La UI principal todavía no presenta controles para los filtros que sí aceptan algunos endpoints; actualmente consulta solo `/api/metrics`.
- En los archivos examinados no hay integración de persistencia: los datos del API son simulados.
- La página muestra un año fijo en su etiqueta, mientras backend determina el año desde `date.today()`; convendría alinear etiqueta y rango real antes de presentar el período como garantía.
- La existencia de endpoints de resumen, comparación, alertas y segmentos B2B/B2C no implica que ya se consuman en la pantalla principal.
- No se afirma que la aplicación esté desplegada o disponible públicamente: la configuración inspeccionada describe servicios para ejecución local vía Docker Compose.

## Hechos fuente

`frontend/src/App.tsx`; `frontend/src/lib/financial-utils.ts`; `backend/app/main.py`; `backend/app/routes.py`; `backend/tests/test_routes.py`; `frontend/src/lib/financial-utils.test.ts`; `docker-compose.yml`; `README.es.md`.
