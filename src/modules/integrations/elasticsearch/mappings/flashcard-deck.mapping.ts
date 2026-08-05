import type {
    ElasticsearchIndexMapping,
} from "./types"

/**
 * Index mapping for the `flashcard-decks-*` indices.
 *
 * Types the real search/sort fields of a flashcard deck and adds a dedicated
 * `suggest` field of type `completion` (an in-memory FST) powering fast, ranked
 * autocomplete -- the ES sync builder populates it with the clean deck title + a
 * popularity weight derived from display order. Localized translation blobs are
 * stored but not indexed.
 */
export const flashcardDecksIndexMapping: ElasticsearchIndexMapping = {
    mappings: {
        dynamic: true,
        properties: {
            // stable primary-key id of the deck
            id: {
                type: "keyword",
            },
            // parent course id -- stored so suggestions can be scoped/deep-linked
            courseId: {
                type: "keyword",
            },
            // human-facing slug -- used to build deck deep-link URLs from search hits
            displayId: {
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
            // difficulty tier (easy | medium | hard | insane) -- exact-match facet
            difficulty: {
                type: "keyword",
            },
            // display order within the course's deck list (drives suggest weight)
            orderIndex: {
                type: "integer",
            },
            // pure ordering index used to reorder the list (decoupled from orderIndex)
            sortIndex: {
                type: "integer",
            },
            // deck copy default locale
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
