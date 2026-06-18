/**
 * Shape of one document stored in the non-localized `users` Elasticsearch
 * index. Mirrors the searchable/displayable subset of {@link UserEntity}; the
 * `id` doubles as the ES doc `_id`.
 */
export interface UserSearchDoc {
    /** Stable primary-key id of the user (also the ES doc `_id`). */
    id: string
    /** Public handle (Keycloak `preferred_username` snapshot). */
    username: string
    /** User-owned display name; `null` when the UI should fall back to `username`. */
    displayName: string | null
    /** Short profile tagline / bio; `null` when unset. */
    bio: string | null
    /** Profile picture URL; `null` when none uploaded. */
    avatar: string | null
    /** GitHub handle; `null` when not linked. */
    githubUsername: string | null
    /** "Open to work" hiring flag — surfaced as a badge / talent-directory filter. */
    openToWork: boolean
    /** Spendable reward-points balance — usable as a popularity sort key. */
    points: number
}

/**
 * Flat Debezium CDC row image for the `public.users` table after the unwrap
 * SMT. Only the primary-key `id` is consumed: the listener re-reads the
 * authoritative row from Postgres, so no other column is needed here (and a
 * delete/rewrite event still carries `id`).
 */
export interface UserCdcRow {
    /** Primary-key id of the changed user row (snake_case wire column = `id`). */
    id?: string
}

/**
 * Minimal Debezium envelope used to defensively unwrap a `public.users` CDC
 * message. The unwrap SMT usually emits the row at top level, but some configs
 * nest it under `payload`; the listener reads whichever is present.
 */
export interface UserCdcEnvelope extends UserCdcRow {
    /** The unwrapped row when nested; absent when the row is already top-level (then the envelope itself is the row). */
    payload?: UserCdcRow
}

/** Params for re-indexing a single user into the `users` index by id. */
export interface ReindexUserParams {
    /** Primary-key id of the user to (re)index or remove from the index. */
    userId: string
}

/** Result of a full user re-index pass. */
export interface ReindexAllUsersResult {
    /** Number of live (non-deleted) users indexed into the `users` index. */
    indexed: number
    /** Number of orphan docs pruned (docs whose user no longer exists / is deleted). */
    pruned: number
}
