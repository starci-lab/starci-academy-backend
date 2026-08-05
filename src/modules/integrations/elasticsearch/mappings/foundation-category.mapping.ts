import type {
    ElasticsearchIndexMapping,
} from "./types"

/**
 * Index mapping for the `foundation-categories-*` indices.
 *
 * Types the real search/sort fields and adds a dedicated `suggest` field of type
 * `completion` (an in-memory FST) powering fast, ranked autocomplete -- the
 * builder populates it with the bare tech name + a popularity weight. Localized
 * translation blobs are stored but not indexed.
 */
export const foundationCategoryIndexMapping: ElasticsearchIndexMapping = {
    mappings: {
        dynamic: true,
        properties: {
            id: {
                type: "keyword",
            },
            displayId: {
                type: "keyword",
            },
            slug: {
                type: "keyword",
            },
            title: {
                type: "text",
            },
            description: {
                type: "text",
            },
            thumbnailUrl: {
                type: "keyword",
                index: false,
            },
            orderIndex: {
                type: "integer",
            },
            sortIndex: {
                type: "integer",
            },
            defaultLocale: {
                type: "keyword",
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
