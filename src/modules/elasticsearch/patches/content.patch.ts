import type {
    ElasticsearchIndexPatch,
} from "./types"

/**
 * Index mapping for the `contents-*` indices. Keeps the real search fields typed (title,
 * description, body) and `verified` as a date, while storing the large relational blobs
 * (references, codeExplainings, codeImplementations, translations, challenges) without indexing
 * them — they are not search targets and would otherwise inflate the dynamic mapping.
 */
export const contentIndexPatch: ElasticsearchIndexPatch = {
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
            title: {
                type: "text",
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
            // large relational blobs — stored, not indexed
            references: {
                type: "object",
                enabled: false,
            },
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
            quizDecks: {
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
