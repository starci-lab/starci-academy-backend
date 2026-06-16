/**
 * Minimal `_source` row shape for an Elasticsearch consultant hit used when
 * building mock search responses in tests.
 */
export interface TestEsSourceRow {
    /** Consultant document id carried on the hit `_source`. */
    id: string
}

/**
 * Object form of an Elasticsearch `hits.total` field, where the total is
 * reported as `{ value }` rather than a bare number.
 */
export interface TestEsTotalObject {
    /** Total number of matching documents. */
    value: number
}
