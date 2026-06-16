/**
 * Minimal `_source` row shape used by the test helper that builds a fake
 * Elasticsearch search response. Test-only: it carries just the identifier the
 * handler maps onto its result data.
 */
export interface TestEsSourceRow {
    /** Document identifier echoed back as the mapped course id. */
    id: string
}

/**
 * Object-form total count as returned by newer `@elastic/elasticsearch`
 * responses, where `hits.total` is an object carrying the count under `value`
 * rather than a bare number.
 */
export interface EsTotalValue {
    /** Total number of matching documents. */
    value: number
}
