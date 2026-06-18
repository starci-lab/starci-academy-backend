import type {
    AbstractExceptionMetadata,
} from "../abstract"
import {
    AbstractException,
} from "../abstract"

/** Metadata when a user has reached the maximum number of pinned projects. */
export interface PinnedProjectLimitReachedExceptionMetadata extends AbstractExceptionMetadata {
    /** Id of the user attempting to pin. */
    userId: string
    /** The maximum number of pins allowed per user. */
    maxPins: number
}

/** Thrown when a user attempts to pin more than the allowed maximum of projects. */
export class PinnedProjectLimitReachedException extends AbstractException {
    constructor(
        {
            userId,
            maxPins,
            originalError,
        }: PinnedProjectLimitReachedExceptionMetadata,
    ) {
        super(
            "Pinned project limit reached",
            "PINNED_PROJECT_LIMIT_REACHED_EXCEPTION",
            {
                userId,
                maxPins,
                originalError,
            },
        )
    }
}

/** Metadata when an enrollment to be pinned is not owned by the requesting user. */
export interface EnrollmentNotOwnedExceptionMetadata extends AbstractExceptionMetadata {
    /** Id of the user making the request. */
    userId: string
    /** Id of the enrollment that was not found for / owned by the user. */
    enrollmentId: string
}

/** Thrown when the enrollment to pin does not exist or does not belong to the user. */
export class EnrollmentNotOwnedException extends AbstractException {
    constructor(
        {
            userId,
            enrollmentId,
            originalError,
        }: EnrollmentNotOwnedExceptionMetadata,
    ) {
        super(
            "Enrollment not found or not owned by the user",
            "ENROLLMENT_NOT_OWNED_EXCEPTION",
            {
                userId,
                enrollmentId,
                originalError,
            },
        )
    }
}

/** Metadata when a pinned project to act on is not owned by the requesting user. */
export interface PinnedProjectNotOwnedExceptionMetadata extends AbstractExceptionMetadata {
    /** Id of the user making the request. */
    userId: string
    /** Id of the pin that was not found for / owned by the user. */
    pinId: string
}

/** Thrown when the pin to unpin / reorder does not exist or does not belong to the user. */
export class PinnedProjectNotOwnedException extends AbstractException {
    constructor(
        {
            userId,
            pinId,
            originalError,
        }: PinnedProjectNotOwnedExceptionMetadata,
    ) {
        super(
            "Pinned project not found or not owned by the user",
            "PINNED_PROJECT_NOT_OWNED_EXCEPTION",
            {
                userId,
                pinId,
                originalError,
            },
        )
    }
}
