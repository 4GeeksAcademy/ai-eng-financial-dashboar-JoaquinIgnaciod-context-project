# Especificación: filtros, alertas y comparación B2B/B2C

**Estado:** especificación alineada con la API existente; pendiente de implementación.  
**Fuente del contrato:** OpenAPI de FastAPI y `backend/app/routes.py`.  
**Alcance:** documentar F1, F2 y F3 sin cambiar el backend ni el frontend.

## Convenciones del contrato

- Las rutas de la API usan el prefijo `/api`.
- Las fechas de consulta se envían como `YYYY-MM-DD` y las fechas de respuesta usan el mismo formato.
- Los campos descritos abajo son los campos reales del contrato. Esta especificación no añade campos derivados a las respuestas.
- El backend genera movimientos simulados con semilla `42`; los ejemplos de fechas y montos ilustran respuestas observadas y no garantizan valores permanentes.

---

## F1 — Filtrar movimientos por fechas

### Propósito

Permitir delimitar los movimientos del dashboard por un rango de fechas. Las opciones de rango y los movimientos filtrados provienen de dos endpoints diferentes: `facets` informa el rango disponible y `metrics` recibe el filtro.

### Contrato API

#### Opciones del filtro

`GET /api/metrics/facets`

No acepta parámetros de consulta. Devuelve un objeto con estos campos obligatorios:

| Campo | Tipo | Valores / formato |
|---|---|---|
| `operation_types` | array de string | `income`, `outcome` |
| `business_types` | array de string | `B2B`, `B2C` |
| `categories` | array de string | `suppliers`, `sales`, `operational`, `administrative`, `others` |
| `min_date` | string | Fecha `YYYY-MM-DD` mínima de los datos generados |
| `max_date` | string | Fecha `YYYY-MM-DD` máxima de los datos generados |

Ejemplo observado:

```json
{
  "operation_types": ["income", "outcome"],
  "business_types": ["B2B", "B2C"],
  "categories": ["administrative", "operational", "others", "sales", "suppliers"],
  "min_date": "2025-10-02",
  "max_date": "2026-09-28"
}
```

> `facets` no acepta un rango, no devuelve movimientos y no aplica filtros. `min_date` y `max_date` describen los límites de los datos disponibles.

#### Aplicación del filtro

`GET /api/metrics`

| Parámetro | Tipo | Requerido | Valores / comportamiento |
|---|---|---:|---|
| `start_date` | fecha (`YYYY-MM-DD`) | No | Límite inicial inclusivo |
| `end_date` | fecha (`YYYY-MM-DD`) | No | Límite final inclusivo |
| `category` | string | No | `suppliers`, `sales`, `operational`, `administrative`, `others` |
| `operation_type` | string | No | `income`, `outcome` |

La respuesta es un array de movimientos. Todos los campos son obligatorios:

| Campo | Tipo | Valores / formato |
|---|---|---|
| `create_date` | string | Fecha `YYYY-MM-DD` |
| `amount` | number | Importe |
| `operation_type` | string | `income` o `outcome` |
| `category` | string | Una de las categorías permitidas arriba |
| `business_type` | string | `B2B` o `B2C` |

Ejemplo observado para `GET /api/metrics?start_date=2026-01-01&end_date=2026-01-31` (fragmento):

```json
[
  {
    "create_date": "2026-01-01",
    "amount": 6434.18,
    "operation_type": "outcome",
    "category": "operational",
    "business_type": "B2C"
  },
  {
    "create_date": "2026-01-01",
    "amount": 6294.54,
    "operation_type": "outcome",
    "category": "suppliers",
    "business_type": "B2C"
  }
]
```

### Criterios de aceptación documentales

- La interfaz que se diseñe para el rango consulta `GET /api/metrics/facets` para obtener `min_date` y `max_date`.
- Al consultar movimientos, la interfaz envía `start_date` y/o `end_date` a `GET /api/metrics` en formato `YYYY-MM-DD`.
- Los límites enviados se consideran inclusivos.
- No se describe `facets` como un endpoint que devuelve datos filtrados.

### Casos límite

1. **Solo `start_date` o solo `end_date`:** enviar únicamente el límite indicado; el otro permanece omitido y el límite enviado sigue siendo inclusivo.
2. **Sin fechas o sin movimientos:** omitir ambos parámetros si no hay selección; si el endpoint responde `[]` para un rango válido, presentar estado vacío de movimientos, no error.
3. **Rango invertido/fuera de facetas:** mostrar validación y no enviar una consulta con el rango inválido.

---

## F2 — Mostrar alertas de aumento de egresos

### Propósito

Mostrar los períodos en que el total de egresos supera en más de un umbral el promedio de egresos de los períodos anteriores. El término “anomalía” en la interfaz debe presentarse como una alerta de aumento según esta regla, no como una clasificación más amplia que la API no proporciona.

### Contrato API

`GET /api/metrics/alerts`

| Parámetro | Tipo | Requerido | Valores / predeterminado |
|---|---|---:|---|
| `threshold` | number | No | Mínimo `0`; predeterminado `0.3` |
| `group_by` | string | No | `day`, `week`, `month`; predeterminado `month` |
| `start_date` | fecha (`YYYY-MM-DD`) | No | Sin límite inicial si se omite |
| `end_date` | fecha (`YYYY-MM-DD`) | No | Sin límite final si se omite |
| `business_type` | string | No | `B2B` o `B2C` |

Devuelve un array de alertas. Cada objeto contiene exactamente estos campos obligatorios:

| Campo | Tipo | Significado |
|---|---|---|
| `period` | string | Período agrupado; por ejemplo, `2025-12` para agrupación mensual |
| `outcome_total` | number | Total de egresos del período |
| `baseline_average` | number | Promedio de egresos de períodos previos |
| `increase_ratio` | number | Razón relativa del aumento sobre el promedio previo |

Ejemplo observado con los parámetros predeterminados (fragmento):

```json
[
  {
    "period": "2025-12",
    "outcome_total": 103378.98,
    "baseline_average": 51174.1,
    "increase_ratio": 1.0201
  },
  {
    "period": "2026-03",
    "outcome_total": 88076.9,
    "baseline_average": 56456.19,
    "increase_ratio": 0.5601
  }
]
```

### Aclaración de semántica

- `increase_ratio` es una razón, no un porcentaje en unidades de 0 a 100. Por ejemplo, `1.0201` equivale aproximadamente a un aumento del `102.01%`; `0.3` equivale a un aumento del `30%`.
- La API emite una alerta si `increase_ratio > threshold` (comparación estricta) y existe un promedio previo mayor que cero.
- La API no devuelve `severity`, `message`, `description`, `recommendation` ni un tipo de anomalía. Si el producto necesita esos elementos, serían derivados de presentación o requerirían ampliar el contrato en otra tarea.
- La respuesta puede ser un array vacío.

### Criterios de aceptación documentales

- La visualización obtiene alertas de `GET /api/metrics/alerts`.
- La razón se etiqueta o transforma correctamente como porcentaje solo para su presentación; el valor recibido sigue siendo la razón decimal.
- La UI permite configurar `threshold` en el rango de producto `0.01–1.0`, con valor inicial `0.3`; este rango de UI es más restrictivo que OpenAPI, que solo impone mínimo `0` y no declara máximo.
- La UI fija agrupación mensual: omite `group_by` y usa el default API `month`. No ofrece selector de segmento; omite `business_type` para mostrar alertas agregadas de B2B y B2C.
- No se atribuye a la API texto explicativo ni severidad que no están en su respuesta.

### Casos límite

1. **Respuesta vacía:** `[]` significa que no hay alertas para los parámetros actuales y debe activar un estado vacío explícito, distinto de carga y error.
2. **Aumento igual al threshold:** la comparación API es estricta (`increase_ratio > threshold`), por lo que no se añade alerta en cliente cuando ambos valores son iguales.
3. **Threshold fuera del rango UI:** aunque el API acepta `threshold=0`, la interfaz lo rechaza por su mínimo de producto `0.01`; no consultar hasta tener valor válido.

---

## F3 — Comparar categorías entre B2B y B2C

### Propósito

Comparar los totales por categoría de los segmentos B2B y B2C. La API permite obtener cada segmento por separado con `business_type`; no entrega una comparación conjunta en una sola respuesta.

### Contrato API

#### Opciones de segmento

`GET /api/metrics/facets` no acepta parámetros. `business_types` enumera los segmentos disponibles (`B2B`, `B2C`). No contiene importes ni agregados por segmento.

#### Totales por categoría de un segmento

`GET /api/metrics/categories/top`

| Parámetro | Tipo | Requerido | Valores / predeterminado |
|---|---|---:|---|
| `operation_type` | string | No | `income` o `outcome`; predeterminado `outcome` |
| `limit` | integer | No | Entre `1` y `20`; predeterminado `5` |
| `start_date` | fecha (`YYYY-MM-DD`) | No | Filtro inicial inclusivo |
| `end_date` | fecha (`YYYY-MM-DD`) | No | Filtro final inclusivo |
| `business_type` | string | No | `B2B` o `B2C`; si se omite no se filtra por segmento |

La respuesta es un array de objetos `TopCategoryItem`, cada uno con estos campos obligatorios:

| Campo | Tipo | Valores / significado |
|---|---|---|
| `category` | string | `suppliers`, `sales`, `operational`, `administrative`, `others` |
| `operation_type` | string | `income` o `outcome` |
| `total_amount` | number | Total agregado para la categoría en el segmento y filtros solicitados |

Los elementos se ordenan por `total_amount` descendente. `limit` es un máximo, no una garantía de cantidad de resultados.

Ejemplo observado con `operation_type=income&limit=5`:

`GET /api/metrics/categories/top?operation_type=income&limit=5&business_type=B2B`

```json
[
  { "category": "sales", "operation_type": "income", "total_amount": 557903.97 },
  { "category": "others", "operation_type": "income", "total_amount": 57636.75 }
]
```

`GET /api/metrics/categories/top?operation_type=income&limit=5&business_type=B2C`

```json
[
  { "category": "sales", "operation_type": "income", "total_amount": 574193.41 },
  { "category": "others", "operation_type": "income", "total_amount": 68412.74 }
]
```

### Aclaración de comparación

- Para una comparación B2B vs B2C, se solicitan los datos dos veces, una con `business_type=B2B` y otra con `business_type=B2C`, usando los mismos valores para los demás parámetros.
- La UI puede presentar las dos respuestas juntas para compararlas, pero esa estructura conjunta no es una respuesta existente de la API.
- `facets` solo proporciona las opciones de negocio. Los valores comparables provienen de `categories/top`.
- Decisión de producto para la UI: ofrecer selección entre ingresos (`operation_type=income`) y egresos (`operation_type=outcome`), con egresos seleccionado inicialmente conforme al default del API. No se presume una tercera categoría ni una respuesta que mezcle ambos tipos.

### Criterios de aceptación documentales

- La comparación usa las opciones `B2B` y `B2C` que proporciona `facets`.
- Se consultan ambos segmentos por separado en `categories/top` y se mantienen iguales los filtros comparables.
- La interfaz no asume que recibirá un array con campos anidados `B2B`/`B2C`, ni añade nombres de campos inexistentes al contrato.
- Las dos consultas usan el mismo `operation_type` elegido, con `outcome` inicial, y el mismo rango temporal.
- Cada panel mantiene su estado vacío/carga/error de forma independiente; el gráfico comparativo no convierte una categoría ausente en un total de API igual a cero.

### Casos límite

1. **Solo una fecha:** enviar el límite temporal proporcionado y omitir el otro en ambas solicitudes; compartir el mismo límite entre B2B y B2C.
2. **Respuesta vacía en un segmento:** si B2B o B2C devuelve `[]`, mostrar vacío solo en su panel y conservar el panel y los datos del otro segmento.
3. **Una petición falla:** mostrar error/reintento para el segmento fallido sin ocultar el resultado exitoso ni sustituirlo por una serie de ceros.
4. **Menos de cinco categorías o categoría ausente:** mostrar únicamente filas recibidas; no rellenar categorías/importes ficticios.

---

## Fuera de alcance

- Cambios a rutas, modelos, tipos, componentes, datos o pruebas.
- Definir campos nuevos para la API.
- Elegir estilos visuales, colores o gráficos no descritos por el contrato.
- Fijar como permanentes los importes o rangos de fechas usados en los ejemplos.
