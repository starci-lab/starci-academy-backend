import type {
    ActivityMetadata,
} from "@modules/databases/postgresql/primary/entities/activity.entity"
import type {
    ActivityType,
} from "@modules/databases/postgresql/primary/enums/activity-type"
import type {
    ReactionType,
} from "@modules/databases/postgresql/primary/enums/reaction-type"

/**
 * Raw activity row for a single user's timeline (joined with the actor -- always
 * the profile owner). Carries `at` + `id` for stable newest-first tie-breaking.
 */
export interface UserFeedRow {
    /** Activity row id (tiebreaker). */
    id: string
    /** Id of the actor user (the profile owner). */
    actorUserId: string
    /** Username of the actor. */
    actorUsername: string
    /** Avatar URL of the actor, or null. */
    actorAvatar: string | null
    /** Kind of activity. */
    type: ActivityType
    /** Denormalised target snapshot, or null. */
    metadata: ActivityMetadata | null
    /** When the activity happened. */
    at: Date
    /** Total reactions on this activity (raw COUNT, string from SQL). */
    reactionCount: string | number
    /** The viewer's own reaction on this activity, or null. */
    myReaction: ReactionType | null
}

/**
 * Decoded cursor for the chronological user timeline. Newest-first ordering is
 * absolute (created_at DESC, id DESC), so a plain row offset is enough -- no need
 * to pin a decay reference the way the score-ranked home feed does.
 */
export interface DecodedUserFeedCursor {
    /** Number of already-consumed rows to skip (offset pagination). */
    offset: number
}
