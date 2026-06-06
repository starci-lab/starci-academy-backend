/** A mock user entry in a lesson sandbox session. */
export interface MockUser {
    /** Unique numeric id of the user within its session. */
    id: number
    /** Display name shown in the UI (also used for username-availability checks). */
    name: string
    /** Email address (lesson source types include this field). */
    email: string
}

/** A cursor-paginated page of users (infinite-query lesson). */
export interface MockUsersPage {
    /** Users on this page. */
    data: Array<MockUser>
    /** Cursor pointing to the next page, or null when the list is exhausted. */
    nextCursor: number | null
}
