# Contexto tecnológico

## Frontend

- **Plataforma/contenedor:** Node `24-alpine` (`frontend/Dockerfile`).
- **Frameworks:** React `^19.2.4`, React DOM `^19.2.4`, Vite `^8.0.4`, TypeScript `~6.0.2` (`frontend/package.json`).
- **Estilos:** Tailwind CSS `^4.2.2`, integración `@tailwindcss/vite` `^4.2.2`, PostCSS `^8.5.9`, autoprefixer `^10.4.27`.
- **Gráficos e iconos:** Recharts `^3.8.1`, Lucide React `^1.8.0`.
- **Utilidades UI:** `class-variance-authority` `^0.7.1`, `clsx` `^2.1.1`, `tailwind-merge` `^3.5.0`.
- **Calidad:** ESLint `^9.39.4`, Vitest `^4.1.4`, `@vitest/coverage-v8` `^4.1.4`.

## Backend

- **Plataforma/contenedor:** Python `3.13-slim` (`backend/Dockerfile`).
- **Framework y servidor:** FastAPI y `uvicorn[standard]`, instalados desde `backend/requirements.txt` sin versiones fijadas en ese archivo.
- **Depuración y pruebas:** debugpy, pytest, pytest-cov y httpx; tampoco tienen versiones fijadas en `requirements.txt`.

## Integración y puertos declarados

- `docker-compose.yml` define `frontend` y `backend`.
- Frontend: publicado `5173:5173`; Vite escucha en `0.0.0.0` con puerto `5173` en `frontend/Dockerfile`.
- Backend: publicado `8000:8000`; Uvicorn escucha en `0.0.0.0:8000` y corre con `--reload` (`backend/Dockerfile`).
- Depurador: publicado `5678:5678`, donde debugpy escucha en backend.
- Proxy frontend: Vite envía `/api` a `http://backend:8000` (`frontend/vite.config.ts`).

## Scripts de frontend

Declarados en `frontend/package.json`: `dev`, `build` (`tsc -b && vite build`), `lint`, `preview`, `test`, `test:watch` y `test:coverage`.

## Nota de precisión de versiones

Las versiones frontend de este documento son rangos tal como aparecen en `package.json`; no se presentan como versiones instaladas exactas. `backend/requirements.txt` no fija números de versión. Los archivos de Docker fijan versiones base de imagen `node:24-alpine` y `python:3.13-slim`.
