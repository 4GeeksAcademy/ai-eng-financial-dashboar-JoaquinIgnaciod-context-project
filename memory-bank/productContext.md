# Contexto del producto

## Descripción

Financial Metrics Dashboard es una aplicación web que reúne métricas financieras en una vista ejecutiva. Presenta ingresos, egresos, beneficio y margen de beneficio, junto con tendencias mensuales de ingresos/egresos y margen. El README lo describe como un dashboard de métricas financieras y la interfaz se titula “Financial Overview” / “Executive metrics dashboard”.

## Problema y usuarios

- **Problema abordado (alcance comprobable):** facilitar la consulta visual de totales y evolución de movimientos financieros desde una interfaz única.
- **Usuario explícito en el código:** no hay un segmento de usuario, rol o perfil de cliente implementado o documentado en los archivos revisados. La etiqueta “Executive metrics dashboard” sugiere una orientación ejecutiva, pero no prueba un público objetivo concreto.
- **Límite funcional actual:** la página principal carga movimientos de la API y calcula KPI y agregados en el cliente. Aunque la API ofrece varios filtros y análisis, la UI principal no muestra controles que los utilicen.

## Modelo de información visible

Cada movimiento contiene fecha, importe, tipo de operación (`income`/`outcome`), categoría y tipo de negocio (`B2B`/`B2C`). Los tipos se reflejan en frontend y backend.

## Fuentes

- `README.es.md`: descripción del proyecto como dashboard financiero.
- `frontend/src/App.tsx`: composición de la vista, petición API y secciones KPI/gráficos.
- `frontend/src/components/dashboard/kpi-row.tsx`: KPI mostrados.
- `frontend/src/components/dashboard/income-outcome-chart.tsx` y `profit-percent-chart.tsx`: visualizaciones.
- `frontend/src/lib/financial-types.ts` y `backend/app/routes.py`: esquema de movimiento.
