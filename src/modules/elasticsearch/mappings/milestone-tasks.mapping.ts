import type {
    ElasticsearchIndexMapping,
} from "./types"

/**
 * Index mapping for the `milestone-tasks-*` indices.
 *
 * Types the real search/sort fields of a milestone task and adds a dedicated
 * `suggest` field of type `completion` (an in-memory FST) powering fast, ranked
 * autocomplete — the ES sync builder populates it with the clean task title plus
 * a weight derived from display order. Localized translation blobs are stored but
 * not indexed.
 */
export const milestoneTasksIndexMapping: ElasticsearchIndexMapping = {
    mappings: {
        dynamic: true,
        properties: {
            // stable primary-key id of the milestone task
            id: {
                type: "keyword",
            },
            // full-text title used for normal search/highlight + suggest source
            title: {
                type: "text",
            },
            // full-text task description
            description: {
                type: "text",
            },
            // display order within the milestone's task list (drives suggest weight)
            orderIndex: {
                type: "integer",
            },
            // priority weight — lower values are higher priority
            weight: {
                type: "integer",
            },
            // task type classification (design, techIntegrate, business)
            type: {
                type: "keyword",
            },
            // parent milestone id — used to scope/filter suggestions per milestone
            milestoneId: {
                type: "keyword",
            },
            // task copy default locale
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
