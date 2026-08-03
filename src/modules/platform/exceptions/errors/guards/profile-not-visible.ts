import {
    HttpStatus,
} from "@nestjs/common"
import type {
    AbstractExceptionMetadata,
} from "../abstract"
import {
    AbstractException,
} from "../abstract"

/** Metadata for a request into a locked profile by a non-owner viewer. */
export interface ProfileNotVisibleExceptionMetadata extends AbstractExceptionMetadata {
    /** Id of the profile being viewed. */
    profileUserId: string
}

/**
 * Thrown by {@link GraphQLProfileVisibilityGuard} when the target profile is
 * locked and the viewer is not its owner.
 */
export class ProfileNotVisibleException extends AbstractException {
    constructor({
        profileUserId,
        originalError,
    }: ProfileNotVisibleExceptionMetadata) {
        super(
            "This profile is private.",
            "PROFILE_NOT_VISIBLE_EXCEPTION",
            {
                profileUserId,
                originalError,
            },
            HttpStatus.FORBIDDEN,
        )
    }
}
