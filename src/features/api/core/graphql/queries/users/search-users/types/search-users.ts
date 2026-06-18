/**
 * Shape of the `_source` payload returned for a single hit from the `users`
 * Elasticsearch index. All fields are optional because a hit's source may be
 * partially populated depending on the indexed document.
 */
export interface UserSearchHitSource {
    /** Primary-key id of the user (also the ES doc `_id`). */
    id?: string
    /** Public handle (the @username). */
    username?: string
    /** User-owned display name; absent when unset. */
    displayName?: string | null
    /** Avatar public URL; absent when none. */
    avatar?: string | null
    /** Short profile bio / tagline; absent when unset. */
    bio?: string | null
    /** "Open to work" hiring flag. */
    openToWork?: boolean
    /** Spendable reward-points balance. */
    points?: number
}
