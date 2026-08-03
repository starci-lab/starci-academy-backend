/**
 * Cached set of course ids a user is enrolled in (one key per user). Membership
 * is checked with `Array.includes`; the cache is rebuilt from the source on miss
 * and dropped on any enrollment change (enroll / refund) so authorization never
 * goes stale.
 */
export type UserEnrolledCoursesCacheResult = Array<string>
