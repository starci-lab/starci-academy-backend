import type {
    ElasticsearchIndexMapping,
} from "./types"

/**
 * Index mapping for the `contents-*` indices (autocomplete-enabled variant).
 *
 * Types the real search/sort fields (title, description, body, ordering) and adds a
 * dedicated `suggest` field of type `completion` (an in-memory FST) powering fast,
 * ranked autocomplete -- the ES sync builder populates it with the clean lesson title
 * plus a popularity weight derived from the display order. The large relational blobs
 * (code explainings/implementations, challenges, flashcard decks, translations)
 * are stored but not indexed: they are not search targets and would otherwise inflate
 * the dynamic mapping.
 */
export const contentsIndexMapping: ElasticsearchIndexMapping = {
    settings: {
        index: {
            mapping: {
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
            // `keyword` sub-field carries the untokenised title so the contents list can sort
            // alphabetically -- a bare `text` field has no per-document value to sort on
            title: {
                type: "text",
                fields: {
                    keyword: {
                        type: "keyword",
                        ignore_above: 256,
                    },
                },
            },
            description: {
                type: "text",
            },
            body: {
                type: "text",
            },
            orderIndex: {
                type: "integer",
            },
            // pure display-ordering index, decoupled from orderIndex -- sortable for reordering
            sortIndex: {
                type: "integer",
            },
            minutesRead: {
                type: "integer",
            },
            numChallenges: {
                type: "integer",
            },
            isPremium: {
                type: "boolean",
            },
            defaultLocale: {
                type: "keyword",
            },
            moduleId: {
                type: "keyword",
            },
            // non-null marks SCHEMA V2 content
            verified: {
                type: "date",
            },
            // optional lesson difficulty badge (beginner/intermediate/advanced)
            difficulty: {
                type: "keyword",
            },
            // FST-backed autocomplete field; populated by the ES sync builder
            suggest: {
                type: "completion",
            },
            // large relational blobs -- stored, not indexed
            codeExplainings: {
                type: "object",
                enabled: false,
            },
            codeImplementations: {
                type: "object",
                enabled: false,
            },
            challenges: {
                type: "object",
                enabled: false,
            },
            flashcardDecks: {
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
