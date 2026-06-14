import type {
    ActivityMetadata,
    ActivityType,
} from "@modules/databases"

/**
 * Raw `{id,title}` row for a left-rail list (enrolled course / recent content /
 * in-progress challenge). The id becomes a route-index global id; title the label.
 */
export interface MyDashboardRefRow {
    /** Entity primary key (course / content / challenge id). */
    id: string
    /** Display title (token label). */
    title: string
}

/**
 * Raw row returned by the followed-users activity-feed SQL (joins `activities`
 * with the actor). `metadata` is the jsonb snapshot stored on the activity row.
 */
export interface MyDashboardFeedRow {
    /** Id of the actor user (→ actor global id). */
    actorUserId: string
    /** Username of the followed user who performed the activity. */
    actorUsername: string
    /** Avatar URL of the actor, or null when unset. */
    actorAvatar: string | null
    /** Kind of activity. */
    type: ActivityType
    /** Denormalised snapshot carrying the target ref, or null. */
    metadata: ActivityMetadata | null
    /** When the activity happened. */
    at: Date
}
