# Especificación de componentes: filtros, alertas y comparación

**Estado:** especificación documental; no implementa componentes ni modifica la API.  
**Contratos de referencia:** `api-types.ts` y `param-types.ts`, contrastados con OpenAPI.  
**Alcance:** componentes conceptuales para F1, F2 y F3. Los nombres y props descritos aquí son especificación, no declaraciones TypeScript nuevas.

## Convenciones compartidas

- Las propiedades de respuesta se limitan a los contratos existentes: `FacetsResponse`, `AlertEntry` / `AlertsResponse`, `CategoryEntry` / `TopCategoriesResponse`.
- Los parámetros reutilizan `DateRangeFilter`, `AlertsParams` y `TopCategoriesParams`. No se crean interfaces ni campos de API adicionales.
- En las tablas de props, los tipos `boolean`, `string | null` y las funciones `onChange` / `onParamsChange` describen estado y callbacks locales de presentación, no propiedades nuevas de respuesta o parámetros API. Las props que contienen datos o filtros usan directamente los tipos de la fase previa.
- Los errores son estados de interfaz, no objetos de error devueltos por estos endpoints. Su formato visual queda a criterio de diseño.
- Carga, error, vacío y éxito son estados distintos. En particular, respuesta vacía no equivale a error.
- Todos los importes son los números recibidos (`outcome_total`, `baseline_average`, `total_amount`); su formato monetario es de presentación y no cambia el contrato.

---

## F1 — `DateRangeFilter`

### Responsabilidad

Permitir al usuario delimitar temporalmente los movimientos obtenidos por `GET /api/metrics` y ofrecer como límites del control el intervalo de datos disponibles que informa `GET /api/metrics/facets`.

### Props y tipos

| Prop | Tipo existente | Uso |
|---|---|---|
| `facets` | `FacetsResponse \| null` | Lee únicamente `min_date` y `max_date` para fijar el rango disponible; el valor local es `null` antes de una respuesta válida. |
| `value` | `DateRangeFilter` | Contiene `start_date` y/o `end_date`; ambos son opcionales. |
| `onChange` | `(value: DateRangeFilter) => void` | Notifica los límites elegidos para que el consumidor actualice el filtro. No es un campo de API. |
| `isLoading` | `boolean` | Indica que `GET /api/metrics/facets` sigue pendiente. |
| `error` | `string \| null` | Estado de error de la carga de facetas; no es un campo de respuesta API. |

### Estructura visual

- Un control de fecha para el límite inicial y otro para el límite final, con sus etiquetas.
- Ambos controles muestran el rango disponible (`min_date` a `max_date`) como referencia y límites de selección.
- Un estado visual de carga/error de facetas puede presentarse en el área del control; no se inventan propiedades adicionales en `FacetsResponse`.

### Datos y consulta

1. Solicita `GET /api/metrics/facets` sin parámetros y usa `FacetsResponse`.
2. Una vez recibidas las facetas, configura ambos controles desde `min_date` y `max_date`, en formato `YYYY-MM-DD`.
3. Al filtrar movimientos, envía únicamente los límites que tengan valor como `start_date` y/o `end_date` a `GET /api/metrics`.
4. El endpoint de movimientos admite límites inclusivos y cada uno es opcional. No se llama a `facets` como si devolviera movimientos filtrados.

### Interacciones y validaciones

- Se permite informar solo la fecha inicial, solo la fecha final, ambas o ninguna. No se exige completar el par.
- Las fechas deben estar en formato `YYYY-MM-DD` y dentro de los límites disponibles indicados por las facetas.
- Si se informan ambas, la fecha inicial no puede ser posterior a la final.
- Si ambas están vacías, se omiten ambas claves de consulta; no se envían cadenas vacías.
- Un cambio válido se aplica inmediatamente: `onChange` notifica el nuevo rango y el consumidor vuelve a consultar los movimientos. No se requiere un botón adicional de aplicar.

### Estados

| Estado | Comportamiento |
|---|---|
| Carga | Presenta el control como pendiente mientras se obtienen facetas; evita ofrecer límites no conocidos como si fueran los límites del API. |
| Error | Informa que no se pudieron cargar las facetas y no inventa un rango sustituto; ofrece reintentar la carga. |
| Vacío | `FacetsResponse` no define un resultado de facetas vacío; si una selección válida produce cero movimientos, el estado vacío corresponde al componente que presenta esos movimientos, no a este control de fechas. |
| Éxito | Muestra las fechas disponibles y permite seleccionar cualquiera de los límites de forma independiente. |

---

## F2 — `AlertsTable`

### Responsabilidad

Presentar las alertas de aumento de egresos devueltas por `GET /api/metrics/alerts`, con filtro temporal opcional y umbral configurable dentro del rango elegido para la interfaz.

### Props y tipos

| Prop | Tipo existente | Uso |
|---|---|---|
| `alerts` | `AlertsResponse` | Array de filas; cada elemento es `AlertEntry`. |
| `params` | `AlertsParams` | Filtros vigentes de la consulta, con las propiedades opcionales definidas en el tipo existente. En esta versión solo se exponen al usuario las fechas y `threshold`; `group_by` y `business_type` se omiten. |
| `isLoading` | `boolean` | Indica que la consulta está pendiente. |
| `error` | `string \| null` | Mensaje de presentación ante fallo; no es un campo de respuesta API. |
| `onParamsChange` | `(value: AlertsParams) => void` | Propaga cambios de filtros y umbral al consumidor. No es un campo de API. |

### Estructura visual

- Control numérico de umbral, mostrado como aumento relativo, con valor inicial `0.3` (30%).
- Filtro temporal opcional con fecha inicial y final, conforme a `DateRangeFilter` y a los límites disponibles de F1.
- Tabla con exactamente cuatro columnas, basadas en los campos de `AlertEntry`:

| Columna | Campo | Presentación |
|---|---|---|
| Período | `period` | Texto sin imponer un patrón: OpenAPI lo define como `string` sin formato. |
| Total de egresos | `outcome_total` | Importe numérico del período. |
| Promedio base | `baseline_average` | Importe numérico de los períodos anteriores. |
| Aumento | `increase_ratio` | Razón numérica; se puede mostrar como porcentaje multiplicándola por 100 solo en presentación. |

### Datos, interacciones y validaciones

- Consulta `GET /api/metrics/alerts` con `AlertsParams`; las fechas, si están presentes, se envían en formato `YYYY-MM-DD`.
- La validación del control en esta interfaz restringe `threshold` al intervalo **0.01–1.0**, inclusive, y usa **0.3** como valor predeterminado.
- La consulta omite `group_by` y utiliza el default API `month`; no se presenta selector de agrupación en F2.
- La consulta omite `business_type`, por lo que las alertas incluyen ambos segmentos; no se presenta selector de segmento en F2.
- Las fechas pueden informarse por separado; si se informan ambas, inicio debe ser menor o igual que fin. El rango se valida contra `min_date` / `max_date` de facetas.
- Al cambiar un parámetro válido, se solicita de nuevo la colección de alertas. Las filas contienen solo campos verificados; no se agregan severidad, descripción ni recomendación.

### Estados

| Estado | Comportamiento |
|---|---|
| Carga | Conserva la estructura de tabla y comunica que las alertas están cargando; no presenta la carga como un resultado vacío. |
| Error | Presenta el mensaje de fallo y permite distinguirlo del estado sin alertas. No se atribuye un esquema de error al API. |
| Vacío | Para `alerts: []`, muestra un estado vacío explícito, por ejemplo que no hay alertas para ese rango y umbral. No crea filas ficticias. |
| Éxito | Muestra una fila por `AlertEntry`, con las cuatro columnas documentadas. |

### Ambigüedad y decisión

OpenAPI permite `threshold >= 0` sin máximo y declara default `0.3`. La regla de esta interfaz, **0.01–1.0**, es una validación de producto solicitada para el control, no una restricción del backend. Enviar valores de ese intervalo es compatible con el API. El control inicia en `0.3` y envía explícitamente su valor; el valor predeterminado del servidor sigue aplicando cuando el parámetro se omite. La comparación del servidor es estricta (`increase_ratio > threshold`), por lo que un aumento exactamente igual al umbral no produce alerta. Se decide usar agrupación mensual y no segmentar por negocio en esta primera vista para mantener una sola tabla agregada, sin controles que el brief no solicita.

---

## F3 — `BusinessCategoryComparison`

### Responsabilidad

Comparar visualmente los totales por categoría de B2B y B2C. La API devuelve cada segmento en una petición independiente a `GET /api/metrics/categories/top`; el componente presenta ambas respuestas en paralelo, sin asumir una respuesta conjunta.

### Props y tipos

| Prop | Tipo existente | Uso |
|---|---|---|
| `b2bCategories` | `TopCategoriesResponse` | Filas de la solicitud hecha con `business_type=B2B`; el tipo de negocio se conoce por el contexto de solicitud, no por un campo de cada fila. |
| `b2cCategories` | `TopCategoriesResponse` | Filas de la solicitud hecha con `business_type=B2C`; el tipo de negocio se conoce por el contexto de solicitud, no por un campo de cada fila. |
| `params` | `TopCategoriesParams` | Parámetros comparables compartidos de operación y rango. En cada solicitud, el consumidor fija `business_type` al segmento correspondiente y `limit` en `5`. |
| `isB2BLoading` | `boolean` | Estado de carga exclusivo de la consulta B2B. |
| `isB2CLoading` | `boolean` | Estado de carga exclusivo de la consulta B2C. |
| `b2bError` | `string \| null` | Error de la consulta B2B, independiente del otro segmento. |
| `b2cError` | `string \| null` | Error de la consulta B2C, independiente del otro segmento. |
| `onParamsChange` | `(value: TopCategoriesParams) => void` | Propaga el cambio de parámetros comunes para actualizar ambas consultas. No es un campo de API. |

### Estructura visual

- Dos paneles claramente identificados: **B2B** y **B2C**.
- Cada panel incluye su propia tabla top-5 con estos campos verificados de `CategoryEntry`:

| Columna | Campo | Presentación |
|---|---|---|
| Categoría | `category` | Uno de `suppliers`, `sales`, `operational`, `administrative`, `others`. |
| Operación | `operation_type` | `income` o `outcome`. |
| Total | `total_amount` | Importe agregado numérico. |

- Un gráfico de barras agrupadas compara `total_amount` por `category`, con las dos series identificadas como B2B y B2C. Se construye a partir de las dos listas recibidas; no representa un campo o endpoint adicional.
- Un selector de operación permite elegir ingresos o egresos y se sincroniza para ambas consultas.

### Datos, interacciones y validaciones

- Ejecuta dos solicitudes a `GET /api/metrics/categories/top`: una con `business_type=B2B` y otra con `business_type=B2C`.
- Ambas solicitudes usan iguales `operation_type`, `limit`, `start_date` y `end_date`, para comparar criterios equivalentes. El segmento es la única diferencia entre ellas.
- `limit` se fija en `5` para este requisito (el API acepta enteros de 1 a 20 y tiene default 5). Una respuesta puede contener menos de cinco entradas: el límite es máximo, no garantía.
- Las fechas son opcionales, formato `YYYY-MM-DD`, inclusivas y limitadas por el rango disponible de facetas. Se puede informar solo una; si se informan ambas, inicio no puede ser posterior a fin.
- `operation_type` acepta `income` u `outcome`; el selector ofrece ambos y comienza en `outcome`, consistente con el default API. El valor seleccionado se envía explícitamente a las dos consultas.
- Cada fila conserva los valores entregados por el API. El gráfico alinea por `category` las entradas que existan en cada array. Si falta una categoría en uno de los arrays, se muestra como dato ausente (sin barra), no como un `total_amount: 0` inventado.

### Estados

| Estado | Panel B2B | Panel B2C | Gráfico |
|---|---|---|---|
| Carga | Muestra carga solo mientras está pendiente su petición. | Muestra carga solo mientras está pendiente su petición. | Espera a que ambas consultas terminen; no interpreta una solicitud pendiente como cero. |
| Error | Muestra el error B2B sin ocultar un resultado B2C exitoso. | Muestra el error B2C sin ocultar un resultado B2B exitoso. | Si falta una respuesta por error, no la grafica como total cero; puede mostrar la serie disponible con indicación clara de incompletitud. |
| Vacío | Si `b2bCategories` es `[]`, presenta estado vacío únicamente en B2B. | Si `b2cCategories` es `[]`, presenta estado vacío únicamente en B2C. | La falta de categorías de un segmento no debe borrar el resultado válido del otro ni convertirse en valores de API ficticios. |
| Éxito | Muestra las filas recibidas, hasta cinco. | Muestra las filas recibidas, hasta cinco. | Compara los importes recibidos por categoría y segmento. |

### Ambigüedades y decisiones

- **Operación a comparar:** F3 no especifica si comparar ingresos, egresos o permitir elegir. Decisión: ofrecer selector `income` / `outcome`, con `outcome` seleccionado inicialmente, y enviar siempre la elección igual a ambas consultas. Así se conserva el default real y también se permite comparar ingresos sin inventar una tercera operación.
- **Datos conjuntos:** no existe respuesta B2B/B2C anidada. Las dos listas se mantienen independientes y se combinan solo para presentar el gráfico.
- **Categorías ausentes:** el endpoint puede devolver menos de cinco resultados. No se fabrican filas para completar el top-5; el gráfico solo representa datos presentes y mantiene la distinción de segmento.
- **Fallo parcial:** como las peticiones son independientes, el estado exitoso de un segmento se conserva aunque la otra solicitud falle.
