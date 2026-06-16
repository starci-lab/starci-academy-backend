/**
 * Minimal Elasticsearch `_source` row shape used by the handler spec to build
 * fake search responses. Only carries the fields the assertions rely on.
 */
export interface EsSourceRow {
    /** Stable identifier of the headhunting company document. */
    id: string
}
