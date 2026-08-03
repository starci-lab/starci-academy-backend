import type {
    AbstractExceptionMetadata,
} from "../abstract"
import {
    AbstractException,
} from "../abstract"

/** Metadata when a non-member exceeds their community post quota. */
export interface CommunityPostQuotaExceededExceptionMetadata extends AbstractExceptionMetadata {
    /** Id of the user who hit the quota. */
    userId: string
    /** The maximum number of posts allowed within the rolling window. */
    limit: number
    /** The rolling window size in days the limit is measured over. */
    windowDays: number
}

/**
 * Thrown when a non-member tries to create a community post beyond the allowed
 * count within the rolling window. Active members are never rate-limited, so this
 * only ever surfaces for non-members.
 */
export class CommunityPostQuotaExceededException extends AbstractException {
    constructor(
        {
            userId,
            limit,
            windowDays,
            originalError,
        }: CommunityPostQuotaExceededExceptionMetadata,
    ) {
        super(
            "Community post limit reached — become a member to post without limits",
            "COMMUNITY_POST_QUOTA_EXCEEDED_EXCEPTION",
            {
                userId,
                limit,
                windowDays,
                originalError,
            },
        )
    }
}
