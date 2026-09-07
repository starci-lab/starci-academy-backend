import type {
    AbstractExceptionMetadata,
} from "../abstract"
import {
    AbstractException,
} from "../abstract"

/** Metadata for a course community operation that failed because its target is unavailable. */
export type CourseCommunityUnavailableExceptionMetadata = AbstractExceptionMetadata

/**
 * Thrown when a course community operation targets a post, comment, or scope
 * that does not exist or is not reachable by the caller -- e.g. a stale id,
 * a soft-deleted row, or a course the caller has no community access to.
 */
export class CourseCommunityUnavailableException extends AbstractException {
    constructor({
        originalError,
    }: CourseCommunityUnavailableExceptionMetadata) {
        super(
            "Course community target unavailable",
            "COURSE_COMMUNITY_UNAVAILABLE_EXCEPTION",
            {
                originalError,
            },
        )
    }
}

/** Metadata for a course community feed/comment request with an invalid pagination cursor. */
export type CourseCommunityCursorExceptionMetadata = AbstractExceptionMetadata

/**
 * Thrown when a course community feed or comments query receives a cursor
 * that cannot be decoded -- reach for this instead of failing silently, so
 * callers can tell a malformed cursor apart from an empty page.
 */
export class CourseCommunityCursorException extends AbstractException {
    constructor({
        originalError,
    }: CourseCommunityCursorExceptionMetadata) {
        super(
            "Invalid course community cursor",
            "COURSE_COMMUNITY_CURSOR_EXCEPTION",
            {
                originalError,
            },
        )
    }
}

/** Metadata for an idempotency key reuse conflict on a course community mutation. */
export type CourseCommunityIdempotencyConflictExceptionMetadata = AbstractExceptionMetadata

/**
 * Thrown when a course community mutation replays an idempotency key that
 * was already recorded against a different payload -- reach for this to
 * reject the retry instead of silently reprocessing it.
 */
export class CourseCommunityIdempotencyConflictException extends AbstractException {
    constructor({
        originalError,
    }: CourseCommunityIdempotencyConflictExceptionMetadata) {
        super(
            "Idempotency key was already used with another payload",
            "COURSE_COMMUNITY_IDEMPOTENCY_CONFLICT_EXCEPTION",
            {
                originalError,
            },
        )
    }
}
