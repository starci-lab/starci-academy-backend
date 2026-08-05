/**
 * An Elasticsearch index mapping: the explicit `settings` / `mappings` applied when an index is
 * (re)created. Used to keep large SCHEMA V2 jsonb blobs (per-language buckets, criteria,
 * translations) out of the searchable mapping -- they would otherwise blow the dynamic field limit
 * or cause mapping-type conflicts -- while keeping the real search fields (title, description,
 * verified) correctly typed.
 */
export interface ElasticsearchIndexMapping {
    /** Index settings (e.g. field limits). Passed straight to `indices.create`. */
    settings?: Record<string, unknown>
    /** Index mappings (typed/searchable fields + disabled jsonb blobs). */
    mappings?: Record<string, unknown>
}
