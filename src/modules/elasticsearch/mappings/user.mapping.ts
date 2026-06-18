import type {
    ElasticsearchIndexMapping,
} from "./types"

/**
 * Index mapping for the non-localized `users` index.
 *
 * Powers user search + "who to follow" discovery. A user record is identity
 * data (handle / display name / bio), so — unlike content — it is NOT split per
 * locale: every viewer searches the same single `users` index.
 *
 * `username` and `displayName` are dual-mapped: a `text` field for normal
 * full-text / prefix search plus a `keyword` sub-field for exact-match lookup
 * and sorting. `bio` is full-text only. `points` is typed so the read side can
 * rank/sort by it. Opaque URL/handle fields (`avatar`, `githubUsername`) are
 * stored as `keyword` (exact, not analyzed). `isDeleted` lets the read side
 * defensively exclude any soft-deleted doc that slipped through.
 */
export const userIndexMapping: ElasticsearchIndexMapping = {
    mappings: {
        dynamic: true,
        properties: {
            // stable primary-key id of the user (also the ES doc _id)
            id: {
                type: "keyword",
            },
            // public handle — full-text/prefix search + exact-match keyword sub-field
            username: {
                type: "text",
                fields: {
                    keyword: {
                        type: "keyword",
                    },
                },
            },
            // user-owned display name — same dual mapping as username
            displayName: {
                type: "text",
                fields: {
                    keyword: {
                        type: "keyword",
                    },
                },
            },
            // short profile tagline — full-text search target only
            bio: {
                type: "text",
            },
            // profile picture URL — stored, exact-match only (not analyzed)
            avatar: {
                type: "keyword",
            },
            // GitHub handle — exact-match facet/lookup
            githubUsername: {
                type: "keyword",
            },
            // "open to work" hiring flag — exact-match boolean facet
            openToWork: {
                type: "boolean",
            },
            // spendable reward-points balance — sortable for popularity ranking
            points: {
                type: "integer",
            },
            // soft-delete flag — lets the read side exclude removed users
            isDeleted: {
                type: "boolean",
            },
        },
    },
}
