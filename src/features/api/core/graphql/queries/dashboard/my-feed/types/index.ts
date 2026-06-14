import type {
    ActivityMetadata,
    ActivityType,
} from "@modules/databases"

/**
 * Raw activity row for the cursor-paginated feed (joined with its actor). Carries
 * `at` + `id` for the keyset cursor `(created_at, id)`.
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
    /** When the activity happened (cursor key). */
    at: Date
}

/** Decoded keyset cursor — the `(created_at, id)` of the previous page's last row. */
export interface DecodedFeedCursor {
    /** ISO timestamp of the last item. */
    at: string
    /** Id of the last item (tiebreak). */
    id: string
}
