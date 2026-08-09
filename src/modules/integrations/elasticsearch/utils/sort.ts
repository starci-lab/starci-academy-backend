/**
 * Analysed (`text`) fields that a list query is allowed to sort by.
 *
 * A `text` field is broken into tokens and holds no per-document value, so sorting or aggregating
 * on it fails with `Fielddata is disabled on [<field>]`. The declared mappings give these fields a
 * `keyword` sub-field carrying the whole untokenised value, which is what sorting must target.
 */
const TEXT_SORT_FIELDS: ReadonlySet<string> = new Set([
    "title",
    "description",
])

/**
 * Resolve a request-level sort field to the index field that can actually be sorted on.
 *
 * @param field - Sort field as named by the GraphQL request (e.g. `title`).
 * @returns The sortable index field (`title.keyword`), or the field unchanged when it is already
 * a doc-values field such as `sortIndex` or `createdAt`.
 *
 * @example
 * resolveSortField("title") // "title.keyword"
 * resolveSortField("createdAt") // "createdAt"
 */
export function resolveSortField(
    field: string,
): string {
    return TEXT_SORT_FIELDS.has(field)
        ? `${field}.keyword`
        : field
}
