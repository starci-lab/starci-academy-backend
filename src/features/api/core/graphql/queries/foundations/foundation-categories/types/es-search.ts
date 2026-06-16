/**
 * Minimal Elasticsearch `_source` row shape used by the handler test helper to
 * build fake search responses. Only the fields the assertions read are modeled.
 */
export interface TestEsSourceRow {
    /** Foundation category identifier echoed back inside each ES hit `_source`. */
    id: string
}
