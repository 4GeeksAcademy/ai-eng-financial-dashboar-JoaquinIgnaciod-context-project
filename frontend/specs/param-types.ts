/** Optional date range accepted by the alert and top-category query endpoints. */
export interface DateRangeFilter {
  /** Optional inclusive lower bound; OpenAPI `date` string in `YYYY-MM-DD` format. */
  start_date?: string;
  /** Optional inclusive upper bound; OpenAPI `date` string in `YYYY-MM-DD` format. */
  end_date?: string;
}

/** Query parameters accepted by GET /api/metrics/alerts. */
export interface AlertsParams extends DateRangeFilter {
  /** Minimum relative increase ratio; any number `>= 0` is accepted; defaults to `0.3` when omitted. */
  threshold?: number;
  /** Aggregation interval: `day`, `week`, or `month`; defaults to `month` when omitted. */
  group_by?: "day" | "week" | "month";
  /** Optional business segment filter: `B2B` or `B2C`; omitted means no segment filter. */
  business_type?: "B2B" | "B2C";
}

/** Query parameters accepted by GET /api/metrics/categories/top. */
export interface TopCategoriesParams extends DateRangeFilter {
  /** Operation to aggregate: `income` or `outcome`; defaults to `outcome` when omitted. */
  operation_type?: "income" | "outcome";
  /** Maximum category count; OpenAPI requires an integer from `1` through `20` and defaults to `5`. */
  limit?: number;
  /** Optional business segment filter: `B2B` or `B2C`; omitted means no segment filter. */
  business_type?: "B2B" | "B2C";
}
