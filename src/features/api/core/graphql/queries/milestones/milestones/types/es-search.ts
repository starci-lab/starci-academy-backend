/**
 * Minimal shape of an Elasticsearch `_source` row used by the
 * milestones handler test fixtures. Test-only: carries just the
 * `id` field that the handler maps onto the result.
 */
export interface TestEsSourceRow {
    /** Identifier copied from the ES document `_source.id`. */
    id: string
}
