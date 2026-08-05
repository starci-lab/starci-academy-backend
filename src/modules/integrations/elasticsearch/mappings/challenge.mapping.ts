import type {
    ElasticsearchIndexMapping,
} from "./types"

/**
 * Index mapping for the `challenges-*` indices. SCHEMA V2 challenges carry large per-language jsonb
 * blobs (`requirements` / `steps` / `outputs` / `prerequisites` + their `translations`) and
 * the internal `outcomeCriteria` / `approachCriteria` rubric. Those are stored but NOT indexed
 * (`enabled: false`) so they never explode the dynamic field limit nor conflict across locales.
 * The real search fields stay typed; `verified` is a proper date.
 */
export const challengeIndexMapping: ElasticsearchIndexMapping = {
    settings: {
        index: {
            mapping: {
                // generous ceiling in case dynamic sub-fields still appear
                total_fields: {
                    limit: 3000,
                },
            },
        },
    },
    mappings: {
        dynamic: true,
        properties: {
            id: {
                type: "keyword",
            },
            displayId: {
                type: "keyword",
            },
            title: {
                type: "text",
            },
            description: {
                type: "text",
            },
            difficulty: {
                type: "keyword",
            },
            orderIndex: {
                type: "integer",
            },
            sortIndex: {
                type: "integer",
            },
            score: {
                type: "integer",
            },
            defaultLocale: {
                type: "keyword",
            },
            contentId: {
                type: "keyword",
            },
            // non-null marks a SCHEMA V2 challenge
            verified: {
                type: "date",
            },
            // FST-backed autocomplete field; populated by the ES sync builder with the
            // clean challenge title + a display-order-derived popularity weight.
            suggest: {
                type: "completion",
            },
            // large jsonb / relational blobs -- stored, not indexed
            requirements: {
                type: "object",
                enabled: false,
            },
            steps: {
                type: "object",
                enabled: false,
            },
            outputs: {
                type: "object",
                enabled: false,
            },
            prerequisites: {
                type: "object",
                enabled: false,
            },
            outcomeCriteria: {
                type: "object",
                enabled: false,
            },
            approachCriteria: {
                type: "object",
                enabled: false,
            },
            submissions: {
                type: "object",
                enabled: false,
            },
            translations: {
                type: "object",
                enabled: false,
            },
        },
    },
}
