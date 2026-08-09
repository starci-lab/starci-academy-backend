import type {
    ElasticsearchIndexMapping,
} from "./types"

/**
 * Index mapping for the `courses-*` indices.
 *
 * Types the real search/sort fields of a course and adds a dedicated `suggest`
 * field of type `completion` (an in-memory FST) powering fast, ranked autocomplete
 * -- the ES sync builder populates it with the clean course title + a popularity
 * weight derived from display order. Localized translation blobs are stored but
 * not indexed.
 */
export const coursesIndexMapping: ElasticsearchIndexMapping = {
    mappings: {
        dynamic: true,
        properties: {
            // stable primary-key id of the course
            id: {
                type: "keyword",
            },
            // human-facing stable identifier (not the primary key)
            displayId: {
                type: "keyword",
            },
            // SEO-friendly slug used for public routing
            slug: {
                type: "keyword",
            },
            // full-text title used for normal search/highlight. The `keyword` sub-field carries
            // the whole untokenised title: the courses list sorts alphabetically by title BY
            // DEFAULT, and a bare `text` field holds no per-document value to sort on.
            title: {
                type: "text",
                fields: {
                    keyword: {
                        type: "keyword",
                        ignore_above: 256,
                    },
                },
            },
            // full-text short description
            description: {
                type: "text",
            },
            // cover image URL -- stored only, never queried/sorted
            coverImageUrl: {
                type: "keyword",
                index: false,
            },
            // display order within the course list (drives suggest weight)
            orderIndex: {
                type: "integer",
            },
            // pure display-ordering index, decoupled from orderIndex -- sortable for reordering
            sortIndex: {
                type: "integer",
            },
            // course copy default locale
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
