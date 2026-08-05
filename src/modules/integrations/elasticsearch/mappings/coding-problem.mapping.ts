import type {
    ElasticsearchIndexMapping,
} from "./types"

/**
 * Index mapping for the `coding-problems-*` indices.
 *
 * Types the real search/sort fields of a coding-practice problem and adds a
 * dedicated `suggest` field of type `completion` (an in-memory FST) powering
 * fast, ranked autocomplete -- the ES sync builder populates it with the clean
 * problem title + a popularity weight derived from display order. Localized
 * translation blobs are stored but not indexed.
 *
 * Distinct from the legacy `coding-problem-hints-*` indices (built in the seeder
 * phase from hint markdown); this index powers search + title autocomplete.
 */
export const codingProblemsIndexMapping: ElasticsearchIndexMapping = {
    mappings: {
        dynamic: true,
        properties: {
            // stable primary-key id of the problem
            id: {
                type: "keyword",
            },
            // stable URL slug (e.g. `two-sum`) -- exact-match lookup/deep-link
            slug: {
                type: "keyword",
            },
            // full-text title used for normal search/highlight
            title: {
                type: "text",
            },
            // difficulty tier -- exact-match facet
            difficulty: {
                type: "keyword",
            },
            // problem domain (algorithms, data-structures, ...) -- exact-match facet
            domain: {
                type: "keyword",
            },
            // topic tags -- exact-match facet/filter
            tags: {
                type: "keyword",
            },
            // display order within the problem list (drives suggest weight)
            orderIndex: {
                type: "integer",
            },
            sortIndex: {
                type: "integer",
            },
            // FST-backed autocomplete field; populated by the ES sync builder
            suggest: {
                type: "completion",
            },
            // localized override blob -- stored, not indexed
            translations: {
                type: "object",
                enabled: false,
            },
        },
    },
}
