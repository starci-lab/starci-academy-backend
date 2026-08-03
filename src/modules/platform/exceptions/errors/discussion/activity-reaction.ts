import type {
    AbstractExceptionMetadata,
} from "../abstract"
import {
    AbstractException,
} from "../abstract"

/** Metadata when a feed activity row cannot be located. */
export interface ActivityNotFoundExceptionMetadata extends AbstractExceptionMetadata {
    /** Id of the activity that was not found. */
    activityId: string
}

/** Thrown when an activity id does not resolve to a row. */
export class ActivityNotFoundException extends AbstractException {
    constructor(
        {
            activityId,
            originalError,
        }: ActivityNotFoundExceptionMetadata,
    ) {
        super(
            "Activity not found",
            "ACTIVITY_NOT_FOUND_EXCEPTION",
            {
                activityId,
                originalError,
            },
        )
    }
}

/** Metadata when a user tries to react to their own activity. */
export interface ActivitySelfReactionExceptionMetadata extends AbstractExceptionMetadata {
    /** Id of the activity the action targeted. */
    activityId: string
    /** Id of the user who attempted to react. */
    userId: string
}

/** Thrown when a user tries to react to an activity that is their own. */
export class ActivitySelfReactionException extends AbstractException {
    constructor(
        {
            activityId,
            userId,
            originalError,
        }: ActivitySelfReactionExceptionMetadata,
    ) {
        super(
            "You cannot react to your own activity",
            "ACTIVITY_SELF_REACTION_EXCEPTION",
            {
                activityId,
                userId,
                originalError,
            },
        )
    }
}
