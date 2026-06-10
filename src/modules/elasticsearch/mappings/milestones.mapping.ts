import type {
    ElasticsearchIndexMapping,
} from "./types"

/**
 * Index mapping for the `milestones-*` indices.
 *
 * Types the real search/sort fields of a milestone and adds a dedicated `suggest`
 * field of type `completion` (an in-memory FST) powering fast, ranked autocomplete
 * — the ES sync builder populates it with the clean milestone title + a popularity
 * weight derived from display order. Localized translation blobs are stored but
 * not indexed.
 */
export const milestonesIndexMapping: ElasticsearchIndexMapping = {
    mappings: {
        dynamic: true,
        properties: {
            // stable primary-key id of the milestone
            id: {
                type: "keyword",
            },
            // parent course id — stored so suggestions can be scoped/deep-linked
            courseId: {
                type: "keyword",
            },
            // full-text title used for normal search/highlight
            title: {
                type: "text",
            },
            // full-text short description
            description: {
                type: "text",
            },
            // display order within the course's milestone list (drives suggest weight)
            orderIndex: {
                type: "integer",
            },
            // milestone copy default locale
            defaultLocale: {
                type: "keyword",
            },
            // FST-backed autocomplete field; populated by the ES sync builder
            suggest: {
                type: "completion",
            },
            // localized override blob — stored, not indexed
            translations: {
                type: "object",
                enabled: false,
            },
        },
    },
}
