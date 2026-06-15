/**
 * Raw row from the trending-contents GROUP BY — `read_count` is text when
 * returned as `bigint` from Postgres, so it is coerced in the resolver.
 */
export interface TrendingContentRow {
    /** `contents.id` of the lesson. */
    id: string
    /** Lesson title. */
    title: string
    /** Reads in the last 7 days (text when bigint). */
    read_count: string | number
}
