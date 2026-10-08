# Convenciones del backend

## Regla

- Implementa la API con FastAPI y mantiene en `backend/app/` la aplicación, sus rutas y la lógica asociada. Conserva las pruebas en `backend/tests/`.
- Mantén la generación de datos de prueba determinista en endpoints que actualmente pasan `seed=42`, salvo que el cambio incluya una actualización intencional de las expectativas de pruebas.
- Preserva filtros, orden cronológico, validación de parámetros y modelos de respuesta como parte del contrato de cada ruta; acompaña cambios de comportamiento con pruebas.
- Mantén las dependencias Python declaradas en `backend/requirements.txt` y comprueba cambios con pytest.
- Si cambias puertos o arranque del servicio, coordina `backend/Dockerfile`, `docker-compose.yml` y el proxy del frontend. No elimines `debugpy` o `--reload` asumiendo que no se usan: forman parte del arranque configurado actualmente.

## Hechos concretos del repositorio

- `backend/app/main.py` crea `FastAPI`, aplica middleware CORS e incluye el router de `app.routes`.
- `backend/app/routes.py` contiene modelos Pydantic, funciones de generación/resumen y rutas `/health` y `/api/metrics...`.
- `backend/tests/test_routes.py` usa `TestClient` y verifica salud, filtros, orden, facetas, agregaciones y rutas B2B/B2C.
- Los endpoints llaman `generate_mock_movements(seed=42)`; la prueba `test_generate_mock_movements_returns_full_year_sorted_data` comprueba 360 movimientos y orden cronológico.
- `backend/requirements.txt` declara `fastapi`, `uvicorn[standard]`, `debugpy`, `pytest`, `pytest-cov` y `httpx`.
- `backend/Dockerfile` ejecuta debugpy en 5678 y Uvicorn en 8000 con `--reload`; `docker-compose.yml` publica esos puertos.
