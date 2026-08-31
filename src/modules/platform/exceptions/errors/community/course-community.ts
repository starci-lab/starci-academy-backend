import type { AbstractExceptionMetadata } from "../abstract"
import { AbstractException } from "../abstract"

export class CourseCommunityUnavailableException extends AbstractException {
    constructor({ originalError }: AbstractExceptionMetadata = {}) {
        super("Course community target unavailable", "COURSE_COMMUNITY_UNAVAILABLE_EXCEPTION", { originalError })
    }
}

export class CourseCommunityCursorException extends AbstractException {
    constructor({ originalError }: AbstractExceptionMetadata = {}) {
        super("Invalid course community cursor", "COURSE_COMMUNITY_CURSOR_EXCEPTION", { originalError })
    }
}

export class CourseCommunityIdempotencyConflictException extends AbstractException {
    constructor({ originalError }: AbstractExceptionMetadata = {}) {
        super("Idempotency key was already used with another payload", "COURSE_COMMUNITY_IDEMPOTENCY_CONFLICT_EXCEPTION", { originalError })
    }
}
