# Convenciones del frontend

## Regla

- Mantén la implementación del frontend en TypeScript/TSX y conserva la separación existente: componentes de dashboard en `src/components/dashboard/`, componentes UI en `src/components/ui/`, tipos y utilidades compartidas en `src/lib/`.
- Sigue el estilo local del archivo que estás modificando. El código actual contiene diferencias de comillas y punto y coma; no reformatees módulos enteros sin necesidad.
- Mantén tipos explícitos y respeta las verificaciones estrictas ya habilitadas: no dejes variables o parámetros sin uso y conserva JSX y resolución de módulos compatibles con la configuración actual.
- Reutiliza el alias `@/` para importar desde `src`. Si cambias el alias, actualiza conjuntamente TypeScript y Vite.
- Antes de finalizar cambios, usa los scripts apropiados del frontend: `npm run lint`, `npm test` y `npm run build` según el alcance.

## Hechos concretos del repositorio

- `frontend/src/App.tsx` importa dashboard y utilidades desde `@/components/dashboard` y `@/lib`.
- `frontend/tsconfig.app.json` define `paths` para `@/*`, `noUnusedLocals`, `noUnusedParameters` y `jsx: "react-jsx"`.
- `frontend/vite.config.ts` asigna el alias `@` a `./src`.
- `frontend/eslint.config.js` aplica configuraciones recomendadas de TypeScript, React Hooks y React Refresh a archivos TS/TSX.
- `frontend/package.json` define `lint`, `test` y `build`.
- El estilo no está totalmente homogeneizado: `src/App.tsx` usa comillas dobles y punto y coma, mientras `src/components/dashboard/kpi-card.tsx` usa comillas simples y omite punto y coma.
