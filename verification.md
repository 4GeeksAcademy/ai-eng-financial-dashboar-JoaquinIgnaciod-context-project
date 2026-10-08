# Nota breve de verificación

- **Afirmación incorrecta:** «El dashboard muestra necesariamente datos de 2024». **Corrección:** la interfaz etiqueta el período como `2024 - Full Year` (`frontend/src/App.tsx`, línea 49), pero el backend genera movimientos para los doce meses del año que determina a partir de la fecha actual (`backend/app/routes.py`, líneas 65–68 y 94–104).
- **Afirmación incorrecta:** «La interfaz permite aplicar filtros». **Corrección:** la API acepta filtros en algunas rutas (`backend/app/routes.py`, por ejemplo líneas 248–260 y 268–285), pero la vista principal solo solicita `/api/metrics` sin parámetros ni controles de filtro (`frontend/src/App.tsx`, líneas 15–20 y 29–43).
- **Afirmación sin verificar:** «La aplicación está desplegada públicamente». **Corrección:** no se afirma despliegue; los archivos consultados describen la ejecución local mediante Docker Compose (`README.es.md`, líneas 40–50; `docker-compose.yml`).
