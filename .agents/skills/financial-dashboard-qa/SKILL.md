---
name: financial-dashboard-qa
description: Verifica cambios del dashboard financiero contrastando el contrato FastAPI, los cálculos del frontend y los resultados de pruebas/build. Úsala al validar cambios de API, métricas o presentación del dashboard en este repositorio.
---

# Financial Dashboard QA

## Objetivo

Detectar regresiones entre los movimientos financieros que entrega FastAPI, los KPI/series mensuales que calcula React y los estados visibles del dashboard, sin ampliar el alcance del cambio.

## Cuándo usar

Cuando se solicite validar o revisar cambios que afecten `frontend/src/App.tsx`, `frontend/src/lib/financial-utils.ts`, los componentes de `frontend/src/components/dashboard/`, `backend/app/routes.py` o sus pruebas. Para cambios de contrato, revisar ambos lados y las pruebas asociadas.

## Entradas

- Alcance del cambio y archivos modificados.
- Contrato vigente de `FinancialMovement` y rutas en `backend/app/routes.py`.
- Comandos/scripts declarados en `frontend/package.json`, dependencias de `backend/requirements.txt` y forma de ejecución de `README.es.md`.

## Procedimiento

1. Inspecciona primero el diff y las reglas `.agents/rules/backend-standards.md`, `frontend-standards.md` y `frontend-proxy-and-contracts.md` aplicables al cambio.
2. Comprueba el contrato real: movimiento (`create_date`, `amount`, `operation_type`, `category`, `business_type`), filtros/orden en `/api/metrics`, y modelos y parámetros de las demás rutas relevantes. No infieras que la UI consume rutas que no llama.
3. Elige las comprobaciones por rutas modificadas; ejecútalas desde la raíz usando exactamente estos comandos:
	- Si cambia algún archivo de `frontend/`: `cd frontend && npm test`. Si cambia código o configuración del frontend, añade `cd frontend && npm run lint` y `cd frontend && npm run build`.
	- Si cambia algún archivo de `backend/`: `cd backend && pytest`.
	- Si la comprobación requiere ambos servicios (por ejemplo, probar el proxy frontend→API en ejecución), el README documenta `docker compose up --build` desde la raíz. No lo uses para sustituir pruebas unitarias, API o build.
	Si faltan herramientas o dependencias, no las instales: registra el comando exacto y el error como bloqueo. No reintentes desde otro directorio salvo que el primer comando se haya ejecutado en un directorio distinto al indicado.
4. Usa la skill `webapp-testing` si el diff cambia DOM/renderizado, etiquetas accesibles o estados visibles de carga/error/gráficos. Antes, comprueba que Playwright y un navegador soportado estén disponibles. Si no lo están, no instales nada: declara la verificación de navegador pendiente. Si el servidor no está activo y Playwright está disponible, consulta primero `python .agents/skills/webapp-testing/scripts/with_server.py --help` antes de usar ese helper.
5. Resume cada comando ejecutado con su resultado. Distingue errores observados de comprobaciones no ejecutadas; no declares éxito si un comando falla.

## Salidas

Un informe breve con alcance inspeccionado, comandos ejecutados, resultado por comando y fallos, riesgos o verificaciones pendientes. Si no se ejecutó una comprobación, indícalo explícitamente.

## Criterios de aceptación

- Las verificaciones son coherentes con el alcance y los scripts existentes, sin presentar endpoints no conectados como funcionalidad de la pantalla.
- El contrato frontend/backend y cualquier expectativa de prueba se contrastan cuando el cambio los afecta.
- Cada conclusión de QA está respaldada por evidencia del diff, código o salida de comandos; no se confunden pruebas unitarias/API con pruebas de navegador.
- No se modifica código ni configuración como parte de una solicitud de QA, salvo autorización explícita para corregir hallazgos.

## Prohibiciones

- No inventes scripts, endpoints, parámetros, datos reales ni cobertura que el repositorio no tenga.
- No cambies implementación, dependencias, pruebas, contratos o configuración para hacer pasar una validación sin autorización.
- No ejecutes `docker compose up --build` sin necesidad: arranca servicios; úsalo solo si se pide comprobación integrada o la verificación requerida depende de ambos servicios.
- No describas los movimientos generados como datos persistidos: la API crea datos simulados con `seed=42`.
- No des por válida la etiqueta `2024 - Full Year` como rango real: el backend deriva el año de `date.today()`.
