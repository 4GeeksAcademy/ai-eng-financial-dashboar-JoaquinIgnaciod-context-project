# Contrato técnico de datos — F1, F2 y F3

**Estado:** contrato documental para implementar la interfaz; no implementa funcionalidades ni modifica API o tipos.  
**Evidencia:** OpenAPI activo de FastAPI (`/openapi.json`), tipos TypeScript de esta carpeta (`api-types.ts`, `param-types.ts`) y especificación de presentación (`components.md`).  
**Audiencia:** agente de coding que retome estas funcionalidades en una sesión nueva.

## 1. Reglas compartidas del contrato

- Todas las llamadas son `GET` bajo `/api`; en desarrollo el proxy Vite reenvía `/api` al backend (`http://backend:8000`).
- Las respuestas se validan/tratan con los tipos de `api-types.ts`; los parámetros se modelan con `param-types.ts`. No se agregan campos de respuesta ni se confunden props locales de UI con campos API.
- Fechas de consulta y fechas de facetas usan cadenas ISO `YYYY-MM-DD`. `start_date` y `end_date` son opcionales e inclusivos en las rutas que los aceptan. UI permite cada uno por separado, restringido al rango de facetas; si se proporcionan ambos, `start_date <= end_date`.
- Enum de operación: `income | outcome`; negocio: `B2B | B2C`; categoría: `suppliers | sales | operational | administrative | others`.
- `number` en TypeScript no impone restricciones de entero/rango. Las restricciones de query deben validarse antes de enviar. Los defaults de OpenAPI se aplican cuando el parámetro se omite; una UI que tenga un valor elegido puede enviarlo explícitamente.
- Los estados `isLoading`, `error`, eventos/callbacks y las props que permiten representar una respuesta aún no recibida son estado de aplicación/interfaz. No son campos de respuestas ni requieren modificar las interfaces API existentes.
- No convertir ausencia de datos, error o petición pendiente en un valor de negocio ficticio. Array vacío significa resultado sin filas; los estados de carga/error se distinguen de él.
- No conservar resultados viejos con apariencia de vigentes tras cambiar parámetros: al comenzar una nueva consulta, representar carga hasta asociar una respuesta con los parámetros actuales. Para F3, los resultados y errores permanecen aislados por segmento.
- Si una respuesta llega después de que ya se inició una consulta más reciente con otros parámetros, descartarla para presentación; nunca sustituye al resultado asociado al estado vigente.
- La lista de campos de cada funcionalidad en este documento especifica el alcance que consume esa UI; no pretende enumerar parámetros de otros filtros que no son parte de dicha funcionalidad.
- `DateRangeFilter` se reutiliza como forma de estado local en F1 aunque `param-types.ts` lo documente como base de los requests F2/F3. Para F1, mapear sus claves a los query params `start_date`/`end_date` de `/api/metrics`; no ampliar `param-types.ts` como parte de esta especificación documental.

### Archivos y autoridad de las decisiones

- `api-types.ts` es la autoridad del shape y los tipos de respuestas tipadas; `param-types.ts` es la autoridad de los nombres, tipos base y opcionalidad de query params.
- OpenAPI y `backend/app/routes.py` son la autoridad de defaults, bounds y semántica implementada por servidor.
- `components.md` es la autoridad de decisiones visuales y de producto que OpenAPI no puede describir (rangos UI, controles, estados). Este README resume esas decisiones para evitar tener que deducirlas en una implementación.
- Si estas fuentes difieren: no modificar silenciosamente un contrato; señalar la discrepancia y actualizar de forma coordinada spec/types/backend/tests solo con alcance autorizado.
- La carpeta `frontend/specs/` está excluida de `tsconfig.app.json` (que incluye el código aplicativo bajo `src`); estos contratos de spec son referencia, no importaciones ejecutables actuales.

## 2. F1 — Filtro temporal de movimientos

### Objetivo

Permitir filtrar movimientos por inicio y/o fin, usando las facetas como límites disponibles y sin atribuir filtrado al endpoint de facetas.

### Endpoints y método

| Método y endpoint | Función | Respuesta / uso |
|---|---|---|
| `GET /api/metrics/facets` | Obtener opciones y límites disponibles. No recibe query params. | `FacetsResponse`; UI usa `min_date`, `max_date`. |
| `GET /api/metrics` | Obtener movimientos dentro de los límites elegidos. | Array de `FinancialMovement` en API (`create_date`, `amount`, `operation_type`, `category`, `business_type`); el tipo de movimiento existente en el proyecto está en `src/lib/financial-types.ts`. |

### Parámetros

F1 usa `DateRangeFilter` para sus controles de fecha; query de `/api/metrics` admite estos campos opcionales:

| Parámetro | Tipo HTTP | Tipo frontend aplicable | Restricciones |
|---|---|---|---|
| `start_date` | fecha como string | `DateRangeFilter.start_date?: string` | `YYYY-MM-DD`; límite inicial inclusivo; puede enviarse sin `end_date`. |
| `end_date` | fecha como string | `DateRangeFilter.end_date?: string` | `YYYY-MM-DD`; límite final inclusivo; puede enviarse sin `start_date`. |

`GET /api/metrics` también admite los filtros opcionales `category` y `operation_type`, con los enums documentados arriba; F1 no los expone ni los envía porque el alcance de esta funcionalidad es temporal. No enviar parámetros vacíos. Si el usuario no establece límite, omitir esa clave. Consulta de movimientos con ambos omitidos equivale a no aplicar restricción temporal.

### Interfaces y campos

- Opciones: `FacetsResponse` de `api-types.ts`.
  - `operation_types`: array de `income | outcome`.
  - `business_types`: array de `B2B | B2C`.
  - `categories`: array de las cinco categorías documentadas en reglas compartidas.
  - `min_date`, `max_date`: fechas ISO `YYYY-MM-DD`.
- Filtro del componente: `DateRangeFilter` (`start_date?`, `end_date?`).
- El array de movimientos no es `FacetsResponse`; no sustituirlo por facets. El modelo frontend existente para cada movimiento es `FinancialMovement` en `src/lib/financial-types.ts`.

### Restricciones, validación y representación de límites

- Al cargar facetas, los date inputs toman `min_date` y `max_date` como `min`/`max` de selección. El control queda no disponible hasta tener rango conocido.
- Cada límite puede estar vacío o establecerse independientemente. No exigir ambos.
- Si ambas fechas tienen valor, validar que inicio no sea posterior a fin. No consultar con rango invertido; conservar el último rango válido como parámetros de consulta mientras se corrige el borrador.
- Valores no válidos o fuera de facetas se marcan junto al control; no se envían hasta ser corregidos.
- Estado inicial: ambos campos vacíos. Al montar F1, solicitar facets y movimientos sin parámetros temporales; no esperar a facets para hacer la consulta inicial de movimientos. La disponibilidad del rango no implica inicializar el filtro automáticamente a min/max.
- Un cambio válido se aplica inmediatamente: actualizar filtro y volver a solicitar `/api/metrics`.
- Si una fecha se está editando y el valor todavía no es una fecha válida, conservarla como borrador local, mostrar validación y no emitir una consulta con ese valor; al quedar válido, actualizar filtro y consultar inmediatamente.
- Hasta completar el refetch, mostrar carga en vez de etiquetar datos anteriores como pertenecientes al filtro nuevo.

### Casos límite

1. **Solo fecha inicial:** `DateRangeFilter = { start_date: "2026-01-01" }`; enviar `?start_date=2026-01-01`, mantener límite final abierto; el control final queda vacío. La fecha debe encontrarse en el intervalo actual de facets.
2. **Solo fecha final:** `{ end_date: "2026-01-31" }`; enviar `?end_date=2026-01-31`, mantener límite inicial abierto. La fecha debe encontrarse en el intervalo actual de facets.
3. **Rango invertido:** `start_date > end_date`; mostrar validación junto al control temporal y no efectuar solicitud con ese valor.
4. **Ninguna fecha:** `{}`; omitir ambos parámetros. Si la respuesta de movimientos es `[]`, mostrar estado vacío en la vista que lista/resume movimientos, no un error del filtro.

### Estados

| Estado | Comportamiento contractual de UI |
|---|---|
| Carga | Facetas: bloquear elección hasta resolver límites y mostrar indicación/skeleton. Movimientos: mantener indicación de carga; no presentar resultado previo como respuesta actual sin marcarlo. |
| Error | Facetas: informar fallo, no sustituir por límites inventados y permitir reintentar. Error de movimientos: informar aparte del rango seleccionado y permitir reintentar la consulta. |
| Vacío | Facetas no define un objeto vacío alternativo; ante rango de movimientos válido con array vacío, indicar que no hay movimientos en ese rango. |
| Éxito | Mostrar límites de facetas y controles válidos; renderizar movimientos devueltos para el rango inclusivo pedido. |

### Criterios de aceptación

- Se llama a `/api/metrics/facets` sin parámetros y se utilizan solo sus campos existentes.
- Al montar la vista se solicitan facets y movimientos en paralelo; el GET inicial de movimientos no espera los límites y omite ambas fechas.
- `/api/metrics` recibe únicamente `start_date` y/o `end_date` válidos en `YYYY-MM-DD`; ambos son inclusivos.
- Un solo límite informado es suficiente; rango invertido no produce una petición válida.
- Un resultado vacío no se presenta como error y `facets` nunca se describe como resultado de movimientos.

## 3. F2 — Alertas de aumento de egresos

### Objetivo

Mostrar las alertas devueltas por el análisis de aumento de egresos, con filtro temporal y umbral configurable según el control definido en `components.md`.

### Endpoint y método

`GET /api/metrics/alerts`; respuesta OpenAPI: array de `MetricsAlert`, representado por `AlertsResponse` (`AlertEntry[]`).

### Parámetros

El tipo de request es `AlertsParams extends DateRangeFilter`.

| Parámetro | Tipo OpenAPI | Permitido / default | En UI |
|---|---|---|---|
| `threshold` | number | mínimo `0`, sin máximo OpenAPI; default `0.3` | Validar `0.01 <= threshold <= 1.0`, inclusive; default UI `0.3`; enviar valor elegido. Es restricción de producto más estricta que OpenAPI. |
| `group_by` | string | `day`, `week`, `month`; default `month` | No hay selector en esta vista; omitir para usar `month`. |
| `start_date` | fecha string | opcional, ISO date | Opcional; filtro inclusivo y dentro de `FacetsResponse.min_date..max_date`. |
| `end_date` | fecha string | opcional, ISO date | Opcional; filtro inclusivo y dentro de facetas. |
| `business_type` | string | `B2B`, `B2C`; opcional | No hay selector en esta vista; omitir para incluir ambos segmentos. |

El rango se puede enviar con solo uno de los dos límites. Si se envían ambos, validar `start_date <= end_date`.
Al montar F2, ejecutar la consulta inicial con `threshold=0.3` explícito y sin fechas. En adelante, fechas vacías se omiten. No exponer `group_by` ni `business_type` en F2.

### Interface y campos de respuesta

- Parámetros: `AlertsParams` y su padre `DateRangeFilter` de `param-types.ts`.
- Respuesta: `AlertsResponse = AlertEntry[]` de `api-types.ts`.
- Cada fila contiene exactamente:

| Campo | Tipo | Interpretación de UI |
|---|---|---|
| `period` | `string` | Etiqueta textual de período. OpenAPI no declara formato; no parsear ni exigir patrón concreto. |
| `outcome_total` | `number` | Total de egresos del período. |
| `baseline_average` | `number` | Promedio de egresos de períodos agrupados anteriores. |
| `increase_ratio` | `number` | Razón relativa decimal. Para etiqueta porcentual se muestra `increase_ratio * 100`; conservar valor original en datos. |

La tabla tiene cuatro columnas, una por campo. No existen `severity`, `message`, `description` o `recommendation` en la respuesta.

### Restricciones y validaciones

- La comparación del backend es estricta: `increase_ratio > threshold`; igualdad exacta no genera alerta.
- El backend solo evalúa cuando existe baseline anterior mayor que cero. No inventar alerta si no hay baseline.
- El mínimo 0.01 y máximo 1.0 pertenecen al control definido en producto; OpenAPI acepta cualquier número mayor o igual a cero y no fija máximo.
- Separar el texto editado del parámetro válido de consulta: si el control queda vacío o fuera de rango, mantener el borrador para mostrarlo y validarlo, conservar el último `threshold` válido en los params y no solicitar; al corregirse a un valor válido, actualizar params y solicitar inmediatamente.
- Fechas en formato `YYYY-MM-DD`, opcionales e inclusivas; validar rango y límites contra facets. Si una edición queda inválida, conservarla como borrador y mantener el último rango válido en los params; no consultar hasta que la edición sea válida.
- Al montar F2, solicitar alertas con `threshold=0.3` y sin fechas; al cambiar fechas válidas, solicitar inmediatamente con el nuevo rango y mantener `threshold` válido vigente.
- `group_by` y `business_type` se omiten en esta vista; aplicar defaults/semántica de endpoint tal como se ha indicado.
- No dar un `step` decimal por contrato: OpenAPI no especifica granularidad del umbral. La UI acepta valores decimales que cumplan el rango inclusive; la presentación del teclado/selector no altera validación del servidor.

### Casos límite

1. **Sin historial o primer período:** backend no emite alerta antes de tener períodos previos; si no hay alertas, respuesta `[]` y UI presenta estado vacío, no error.
2. **Aumento exactamente en threshold:** condición estricta no lo incluye. No añadir fila cliente-side; renderizar solo el array recibido.
3. **Threshold fuera de rango de UI, como `0` o `1.01`, o control vacío:** mantener la edición visible como borrador, mostrar validación y no enviar. Conservar el último `threshold` válido (`0.3` al inicio) en los parámetros de consulta; al corregir el borrador, actualizar y consultar. El API acepta `0`, pero esta UI lo restringe.
4. **Rango de fechas invertido o fuera de facets:** mostrar validación en filtro y no enviar consulta inválida desde UI.

### Estados

| Estado | Comportamiento contractual de UI |
|---|---|
| Carga | Mantener estructura de tabla/skeleton; no interpretar carga como `[]`. |
| Error | Mostrar error de solicitud, distinguirlo de respuesta vacía y habilitar reintento; el API no define objeto de error de dominio para este contrato. |
| Vacío | Para `AlertsResponse = []`, mensaje explícito de que no hay alertas con el rango y threshold seleccionados. |
| Éxito | Una fila por `AlertEntry`, cuatro columnas exactas; representar `increase_ratio` como ratio o porcentaje correctamente transformado. |

### Criterios de aceptación

- Enviar `threshold` válido de la UI y fechas opcionales válidas; omitir `group_by` y `business_type` en esta vista.
- Default UI `0.3`; el API default también es `0.3`; rango de UI `0.01–1.0` se identifica claramente como límite de producto.
- `threshold` se envía para el valor inicial y para cada edición válida; los parámetros inválidos nunca disparan consulta. Las fechas comienzan sin filtro.
- Las alertas se renderizan solo con `period`, `outcome_total`, `baseline_average`, `increase_ratio`.
- Distinguir carga, error, array vacío y array no vacío. No sintetizar severidad ni alertas no retornadas.

## 4. F3 — Comparación de categorías B2B y B2C

### Objetivo

Mostrar dos paneles de categorías principales (B2B y B2C), cada uno con su top-5, y un gráfico comparativo de sus totales. El backend requiere dos consultas independientes; no existe respuesta conjunta.

### Endpoint y método

Dos invocaciones a `GET /api/metrics/categories/top`:

1. `business_type=B2B`.
2. `business_type=B2C`.

Cada solicitud tiene sus propios estados de carga y error. Ambos paneles comparten filtros para asegurar comparación equivalente.

### Parámetros

Tipo base: `TopCategoriesParams extends DateRangeFilter`. Agregar `business_type` a cada request usando la propiedad ya definida en `TopCategoriesParams`; no agregarlo al objeto de respuesta.

| Parámetro | Tipo OpenAPI | Permitido / default | Decisión UI |
|---|---|---|---|
| `operation_type` | string | `income` o `outcome`; default `outcome` | Selector con ambos valores; iniciar en `outcome` y enviar selección explícita a ambas llamadas. |
| `limit` | integer | 1–20 inclusive; default 5 | Fijar en `5` para cumplir top-5 y enviar explícitamente. |
| `start_date` | fecha string | opcional, ISO date | Compartir entre requests; inclusivo, dentro de rango disponible; solo inicial permitido. |
| `end_date` | fecha string | opcional, ISO date | Compartir entre requests; inclusivo, dentro de rango disponible; solo final permitido. |
| `business_type` | string | `B2B` o `B2C`; opcional en contrato | Obligatorio para cada consulta comparativa: B2B en una y B2C en otra. |

Mantener iguales `operation_type`, `limit`, `start_date` y `end_date` para las dos llamadas; el segmento es la única diferencia.
Estado inicial: `operation_type=outcome`, `limit=5`, ambas fechas omitidas. Ambas peticiones iniciales se realizan en paralelo cuando se monta la funcionalidad; el rango es abierto hasta que el usuario cambie fechas.

### Interfaces y campos de respuesta

- Parámetros: `TopCategoriesParams` y `DateRangeFilter` de `param-types.ts`.
- Respuesta de cada solicitud: `TopCategoriesResponse = CategoryEntry[]` de `api-types.ts`.
- Cada entrada contiene exactamente:

| Campo | Tipo | Valores / significado |
|---|---|---|
| `category` | unión literal | `suppliers`, `sales`, `operational`, `administrative`, `others`. |
| `operation_type` | unión literal | `income` o `outcome`; debe corresponder al parámetro solicitado. |
| `total_amount` | `number` | Suma agregada para categoría, operación, rango y segmento pedidos. |

La respuesta no incluye `business_type`; es contexto de la solicitud y se representa en el panel/serie que contiene esa lista. El API ordena descendente por `total_amount`. `limit=5` es máximo, no garantía de cinco filas.

### Estructura e interacciones

- Dos paneles, uno por segmento, cada uno con tabla de `category`, `operation_type`, `total_amount`.
- Selector de operación `income | outcome`, default UI `outcome`.
- Gráfico de barras agrupadas por categoría con series B2B y B2C. Se deriva solo de las dos respuestas; una categoría ausente queda sin barra/dato en ese segmento, no se transforma en un campo `total_amount: 0` del API.
- Cambiar operación o rango actualiza ambas consultas con los mismos filtros comunes.

### Restricciones y validaciones

- `limit` se representa como `number` en TypeScript pero debe ser entero de 1 a 20 inclusive; UI lo fija en 5.
- Fechas opcionales, ISO `YYYY-MM-DD`, inclusivas, validadas contra facets; uno puede omitirse; si ambos están presentes, `start_date <= end_date`. Ediciones inválidas permanecen como borrador y no sustituyen los filtros válidos compartidos ni disparan requests hasta corregirse.
- `operation_type` solo `income` o `outcome`.
- `business_type` para cada request solo `B2B` o `B2C`; no deducir el segmento a partir de cada `CategoryEntry`.
- No rellenar artificialmente resultados faltantes para alcanzar cinco categorías; conservar el orden recibido.
- Si se usa `FacetsResponse.business_types` para ofrecer segmentos, no inferir que una lista vacía de categorías significa que el segmento no está disponible; son contratos/datos independientes.

### Casos límite

1. **Menos de cinco filas:** cada panel muestra solo las entradas recibidas. No completar con categorías fabricadas; el gráfico puede contener menos de cinco categorías.
2. **Array vacío en B2B y datos en B2C (o viceversa):** mostrar mensaje vacío solo en el panel sin resultados; conservar el otro panel y su serie/gráfico.
3. **Fallo parcial de red:** panel fallido muestra error y reintento; panel exitoso conserva sus filas. No mostrar serie fallida como cero.
4. **Categoría no presente en un array:** en el gráfico representar dato ausente para ese segmento (sin barra), no confundirlo con un total cero enviado por API.

### Estados

| Estado | Panel B2B | Panel B2C | Gráfico |
|---|---|---|---|
| Carga | Skeleton/carga propia de su request. | Skeleton/carga propia de su request. | Esperar ambas respuestas para comparar; no convertir request pendiente en cero. |
| Error | Error local al panel B2B con reintento. | Error local al panel B2C con reintento. | Puede mostrar la serie disponible con aviso de comparación parcial; nunca inventar serie cero para el request fallido. |
| Vacío | `[]` produce estado vacío solo para este panel. | `[]` produce estado vacío solo para este panel. | Mantener cualquier información válida del otro segmento y no crear importes faltantes. |
| Éxito | Tabla de filas recibidas (hasta 5). | Tabla de filas recibidas (hasta 5). | Barras comparativas para los datos recibidos en ambas respuestas. |

### Criterios de aceptación

- Dos solicitudes separadas, una por cada `business_type`; filtros comunes idénticos y `limit=5`.
- En el montaje inicial se envían dos requests con `operation_type=outcome`, `limit=5`, sin fechas y distinto `business_type`; el selector cambia las dos llamadas.
- El tipo de operación puede elegirse entre los dos valores permitidos; inicia en `outcome`.
- Cada panel contiene únicamente campos `CategoryEntry`; el segmento proviene del contexto de llamada.
- Mostrar top-5 sin relleno artificial y manejar estados vacíos/error/carga independientemente.
- Gráfico por categorías con distinción B2B/B2C; una respuesta fallida o categoría ausente no se falsifica como total API igual a cero.

## 5. Consistencia y evidencia

| Afirmación del contrato | Fuente de verificación |
|---|---|
| `/api/metrics/facets` devuelve `MetricsFacets` y no acepta parámetros. | OpenAPI activo; `FacetsResponse` en `api-types.ts`. |
| `/api/metrics/alerts` devuelve array `MetricsAlert`; parámetros, enums, default y mínimo listados arriba. | OpenAPI activo; `AlertsParams`, `AlertEntry`; `backend/app/routes.py` para comparación estricta/baseline. |
| `/api/metrics/categories/top` devuelve array `TopCategoryItem`; parámetros y bounds de limit listados arriba. | OpenAPI activo; `TopCategoriesParams`, `CategoryEntry`; `backend/app/routes.py` para orden descendente y agregación. |
| F1 es aplicación de rango de fecha a movimientos, no filtrado en facets. | OpenAPI de `/api/metrics` y `/api/metrics/facets`; comportamiento documentado en `components.md`. |
| Los estados parciales/props de UI no amplían el esquema API. | `components.md` y reglas compartidas de este documento. |

## 6. Fuera de alcance

- Crear/editar interfaces TypeScript, endpoints, modelos backend, JSX/TSX, pruebas o estilos.
- Agregar campos como `severity`, `message`, `business_type` a `CategoryEntry`, o un payload conjunto B2B/B2C.
- Persistencia, autenticación, paginación o cambios del contrato OpenAPI.
- Afirmar que la pantalla ya existe: este documento especifica el contrato requerido para implementación futura.
