import {
    HttpStatus,
} from "@nestjs/common"
import type {
    AbstractExceptionMetadata,
} from "../abstract"
import {
    AbstractException,
} from "../abstract"

/** Metadata for a caller who tried to read another user's personal-task attempt without permission. */
export interface PersonalTaskAttemptAccessDeniedExceptionMetadata extends AbstractExceptionMetadata {
    /** Id of the caller. */
    callerId: string
    /** Id of the user whose attempt was requested. */
    subjectUserId: string
}

/**
 * Thrown when `lastPersonalTaskAttempt` is queried for a `userId` other than
 * the caller, and the caller does not hold an instructor/admin/mentor realm
 * role.
 */
export class PersonalTaskAttemptAccessDeniedException extends AbstractException {
    constructor({
        callerId,
        subjectUserId,
        originalError,
    }: PersonalTaskAttemptAccessDeniedExceptionMetadata) {
        super(
            "Not allowed to read this user's last attempt.",
            "PERSONAL_TASK_ATTEMPT_ACCESS_DENIED_EXCEPTION",
            {
                callerId,
                subjectUserId,
                originalError,
            },
            HttpStatus.FORBIDDEN,
        )
    }
}
