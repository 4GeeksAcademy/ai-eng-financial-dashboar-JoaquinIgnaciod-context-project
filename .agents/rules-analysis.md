# Análisis previo de las reglas de agentes

Este documento registra por qué las convenciones seleccionadas merecen reglas explícitas antes de incorporarlas. Las conclusiones se derivan de archivos presentes en el repositorio; no pretenden imponer una arquitectura distinta.

## 1. Separación y verificaciones del frontend

**Observación:** el frontend separa la composición de la página, los componentes de dashboard, los componentes UI y las utilidades/tipos. También dispone de alias de importación, verificaciones TypeScript, ESLint y scripts de build/prueba.

**Implicación:** cambios que ignoren esa organización o alteren solo una de las configuraciones pueden romper imports, compilación o lint. Como el estilo de comillas y punto y coma varía entre archivos, una regla que imponga un formateo uniforme no se deduce del código actual; resulta más seguro preservar el estilo local.

**Hechos de origen:** `frontend/src/App.tsx`, `frontend/src/components/`, `frontend/src/lib/`, `frontend/tsconfig.app.json`, `frontend/vite.config.ts`, `frontend/eslint.config.js` y los scripts de `frontend/package.json`.

## 2. Coordinación del proxy y los contratos API

**Observación:** la página principal llama a `/api/metrics`; Vite reenvía `/api` al servicio `backend` en el puerto 8000. El modelo de movimiento y los valores permitidos se representan tanto en TypeScript como en Python. La API tiene filtros, pero la vista actual no envía parámetros.

**Implicación:** cambiar ruta, servicio, puerto o forma de la respuesta en un solo lado puede romper la comunicación. Documentar un endpoint como filtro disponible en la UI sería incorrecto si no se construyen controles y solicitudes para activarlo. Asimismo, la etiqueta `2024 - Full Year` del frontend no debe considerarse garantía del año de los datos: el generador Python usa la fecha actual.

**Hechos de origen:** `frontend/src/App.tsx`, `frontend/vite.config.ts`, `docker-compose.yml`, `frontend/src/lib/financial-types.ts` y `backend/app/routes.py` (modelos, filtros y `_year_for_month`).

## 3. Comportamiento, datos y pruebas del backend

**Observación:** FastAPI registra rutas mediante el router de `backend/app/routes.py`; las pruebas usan `TestClient` y cubren salud, filtros y resultados agregados. Los endpoints generan movimientos con semilla 42 y hay una prueba que espera 360 movimientos ordenados.

**Implicación:** quitar la semilla o alterar la generación puede volver frágiles pruebas existentes. Cambiar contratos, filtros u ordenación sin pruebas hace fácil una regresión. Cambiar puerto o comando de arranque exige coordinar el backend, Compose y proxy.

**Hechos de origen:** `backend/app/main.py`, `backend/app/routes.py`, `backend/tests/test_routes.py`, `backend/requirements.txt`, `backend/Dockerfile`, `docker-compose.yml` y `frontend/vite.config.ts`.

## 4. Sistema visual y estados de la interfaz

**Observación:** el frontend reutiliza tarjetas y skeletons, y define tokens semánticos y variantes oscuras en CSS. Los gráficos dependen de tokens de color y la aplicación distingue carga y error durante la solicitud.

**Implicación:** duplicar los componentes o sustituir los tokens por valores inconexos puede dejar inconsistentes la interfaz y el tema oscuro. Eliminar variables o los estados de carga/error afecta visualización y retroalimentación ante fallos.

**Hechos de origen:** `frontend/src/components/ui/`, `frontend/src/components/dashboard/`, `frontend/src/index.css` y `frontend/src/App.tsx`.

## Criterio de alcance

Las reglas propuestas deben proteger relaciones observables entre código y configuración, no prohibir cambios intencionales. Si se modifica una convención —por ejemplo, puerto, contrato de API, modelo de datos o token de diseño—, debe actualizarse en todos sus consumidores y validarse con las pruebas o scripts pertinentes. Los archivos de reglas concretan las pautas operativas derivadas de este análisis.
