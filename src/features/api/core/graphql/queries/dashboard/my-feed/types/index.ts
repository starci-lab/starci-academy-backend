import type {
    ActivityMetadata,
    ActivityType,
} from "@modules/databases"

/**
 * Raw activity row for the score-ranked feed (joined with its actor). Carries
 * `at` + `id` for stable tie-breaking under the relevance ordering.
 */
export interface MyFeedRow {
    /** Activity row id (cursor tiebreaker). */
    id: string
    /** Id of the actor user. */
    actorUserId: string
    /** Username of the actor. */
    actorUsername: string
    /** Avatar URL of the actor, or null. */
    actorAvatar: string | null
    /** Kind of activity. */
    type: ActivityType
    /** Denormalised target snapshot, or null. */
    metadata: ActivityMetadata | null
    /** When the activity happened (tie-break + decay input). */
    at: Date
}

/**
 * Decoded feed cursor for the score-ranked feed. The relevance score depends on a
 * "now" reference, so we pin `asOf` on the first page and carry it across pages —
 * the ranking stays stable while the user scrolls, and `offset` walks the ranked
 * list.
 */
export interface DecodedFeedCursor {
    /** ISO timestamp the page-1 ranking was computed against (decay reference). */
    asOf: string
    /** Number of already-consumed rows to skip (offset pagination). */
    offset: number
}
