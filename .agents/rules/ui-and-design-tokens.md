# Componentes visuales y tokens de diseño

## Regla

- Reutiliza los componentes compartidos bajo `src/components/ui/` y las tarjetas/componentes del dashboard existentes antes de crear implementaciones paralelas.
- Usa los tokens semánticos CSS para colores, bordes y gráficos, en lugar de sustituirlos por valores aislados, y conserva los valores de tema oscuro.
- Si renombras o eliminas una variable CSS, actualiza todos los componentes que la referencian.
- Mantén los estados de carga y error al modificar el flujo de datos, para que la UI no quede sin respuesta durante la solicitud o ante fallos.

## Hechos concretos del repositorio

- `frontend/src/components/dashboard/` contiene `kpi-card.tsx`, `kpi-row.tsx`, `income-outcome-chart.tsx` y `profit-percent-chart.tsx`; los gráficos usan los componentes locales `Card` y `Skeleton`.
- `frontend/src/components/ui/` define los componentes `card.tsx` y `skeleton.tsx`.
- `frontend/src/index.css` define tokens semánticos para colores y variables específicas `--chart-income`, `--chart-outcome`, `--chart-profit`, con variantes bajo `.dark`.
- Los gráficos referencian esas variables en `frontend/src/components/dashboard/income-outcome-chart.tsx` y `profit-percent-chart.tsx`.
- `frontend/src/App.tsx` mantiene estados `loading` y `error`, muestra un mensaje si falla la solicitud y pasa el estado de carga a KPI y gráficos.
