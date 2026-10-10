/** Facet values and date bounds returned by GET /api/metrics/facets. */
export interface FacetsResponse {
  /** Available operation types; each entry is `income` or `outcome`. */
  operation_types: Array<"income" | "outcome">;
  /** Available business segments; each entry is `B2B` or `B2C`. */
  business_types: Array<"B2B" | "B2C">;
  /** Available categories; each entry is `suppliers`, `sales`, `operational`, `administrative`, or `others`. */
  categories: Array<
    | "suppliers"
    | "sales"
    | "operational"
    | "administrative"
    | "others"
  >;
  /** Earliest available movement date, serialized as an ISO date string (`YYYY-MM-DD`). */
  min_date: string;
  /** Latest available movement date, serialized as an ISO date string (`YYYY-MM-DD`). */
  max_date: string;
}

/** One alert returned by GET /api/metrics/alerts. */
export interface AlertEntry {
  /** Period in which the alert was detected; OpenAPI allows any string and specifies no date/period format. */
  period: string;
  /** Sum of outcome amounts in the alert period, as a number. */
  outcome_total: number;
  /** Average outcome amount across preceding grouped periods, as a number. */
  baseline_average: number;
  /** Relative increase over the baseline average as a numeric ratio (for example, 0.3 means 30%), not percentage points. */
  increase_ratio: number;
}

/** Array response from GET /api/metrics/alerts. */
export type AlertsResponse = AlertEntry[];

/** One category total returned by GET /api/metrics/categories/top. */
export interface CategoryEntry {
  /** Aggregated category; one of `suppliers`, `sales`, `operational`, `administrative`, or `others`. */
  category:
    | "suppliers"
    | "sales"
    | "operational"
    | "administrative"
    | "others";
  /** Operation included in the aggregate: `income` or `outcome`. */
  operation_type: "income" | "outcome";
  /** Sum of amounts for this category and operation, as a number. */
  total_amount: number;
}

/** Array response from GET /api/metrics/categories/top. */
export type TopCategoriesResponse = CategoryEntry[];
