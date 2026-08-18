/**
 * Older `@elastic/elasticsearch` client majors wrap a boolean-returning call
 * (e.g. `indices.exists`) in `{ body: boolean }` instead of returning the
 * boolean directly -- narrowed to read `.body` when the runtime response
 * isn't already a `boolean`.
 */
export interface EsLegacyBooleanBody {
    body: boolean
}
