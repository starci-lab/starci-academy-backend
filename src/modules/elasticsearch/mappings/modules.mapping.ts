import type {
    ElasticsearchIndexMapping,
} from "./types"

/**
 * Index mapping for the `modules-*` indices.
 *
 * Types the real search/sort fields of a module document and adds a dedicated
 * `suggest` field of type `completion` (an in-memory FST) powering fast, ranked
 * autocomplete — the ES sync builder populates it with the clean module title +
 * a popularity weight derived from display order. Localized translation blobs are
 * stored but not indexed.
 */
export const modulesIndexMapping: ElasticsearchIndexMapping = {
    mappings: {
        dynamic: true,
        properties: {
            // stable primary-key id of the module
            id: {
                type: "keyword",
            },
            // human-facing stable identifier (not the primary key)
            displayId: {
                type: "keyword",
            },
            // module title — full-text searchable
            title: {
                type: "text",
            },
            // short module description — full-text searchable
            description: {
                type: "text",
            },
            // display order within the parent course's module list — sortable
            orderIndex: {
                type: "integer",
            },
            // parent course id for filtering modules by course
            courseId: {
                type: "keyword",
            },
            // default locale of the module copy
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
