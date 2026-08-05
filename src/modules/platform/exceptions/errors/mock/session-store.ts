import {
    HttpStatus,
} from "@nestjs/common"
import type {
    AbstractExceptionMetadata,
} from "../abstract"
import {
    AbstractException,
} from "../abstract"

/** Thrown when a lesson-mock session's user id does not exist. */
export interface MockSessionUserNotFoundExceptionMetadata extends AbstractExceptionMetadata {
    userId: number
}

/**
 * Thrown by the optimistic-update lesson mocks when a `userId` does not
 * match any user currently in the session.
 */
export class MockSessionUserNotFoundException extends AbstractException {
    constructor(
        {
            userId,
            originalError,
        }: MockSessionUserNotFoundExceptionMetadata,
    ) {
        super(
            "Session user not found.",
            "MOCK_SESSION_USER_NOT_FOUND_EXCEPTION",
            {
                userId,
                originalError,
            },
            HttpStatus.BAD_REQUEST,
        )
    }
}

/** Thrown by the deliberate `fail=true` path used to demo optimistic-update rollback. */
export type MockSimulatedFailureExceptionMetadata = AbstractExceptionMetadata

/**
 * Thrown on purpose when the client sets `fail: true`, simulating a server
 * error so the lesson frontend can demonstrate its optimistic-update rollback.
 */
export class MockSimulatedFailureException extends AbstractException {
    constructor({
        originalError,
    }: MockSimulatedFailureExceptionMetadata) {
        super(
            "Simulated server error (fail=true).",
            "MOCK_SIMULATED_FAILURE_EXCEPTION",
            {
                originalError,
            },
            HttpStatus.BAD_REQUEST,
        )
    }
}
