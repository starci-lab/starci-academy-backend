import type {
    AbstractExceptionMetadata,
} from "../abstract"
import {
    AbstractException,
} from "../abstract"

/** Metadata when a community post row cannot be located. */
export interface CommunityPostNotFoundExceptionMetadata extends AbstractExceptionMetadata {
    /** Id of the post that was not found. */
    postId: string
}

/** Thrown when a community post id does not resolve to a row. */
export class CommunityPostNotFoundException extends AbstractException {
    constructor(
        {
            postId,
            originalError,
        }: CommunityPostNotFoundExceptionMetadata,
    ) {
        super(
            "Community post not found",
            "COMMUNITY_POST_NOT_FOUND_EXCEPTION",
            {
                postId,
                originalError,
            },
        )
    }
}

/** Metadata when a user attempts to mutate a community post they do not own. */
export interface CommunityPostForbiddenExceptionMetadata extends AbstractExceptionMetadata {
    /** Id of the post the action targeted. */
    postId: string
    /** Id of the user who attempted the action. */
    userId: string
}

/** Thrown when a user tries to edit/delete a post that is not theirs. */
export class CommunityPostForbiddenException extends AbstractException {
    constructor(
        {
            postId,
            userId,
            originalError,
        }: CommunityPostForbiddenExceptionMetadata,
    ) {
        super(
            "You are not allowed to modify this post",
            "COMMUNITY_POST_FORBIDDEN_EXCEPTION",
            {
                postId,
                userId,
                originalError,
            },
        )
    }
}

/** Metadata when a community post comment row cannot be located. */
export interface CommunityPostCommentNotFoundExceptionMetadata extends AbstractExceptionMetadata {
    /** Id of the comment that was not found. */
    commentId: string
}

/** Thrown when a community post comment id does not resolve to a row. */
export class CommunityPostCommentNotFoundException extends AbstractException {
    constructor(
        {
            commentId,
            originalError,
        }: CommunityPostCommentNotFoundExceptionMetadata,
    ) {
        super(
            "Community post comment not found",
            "COMMUNITY_POST_COMMENT_NOT_FOUND_EXCEPTION",
            {
                commentId,
                originalError,
            },
        )
    }
}

/** Metadata when a user attempts to mutate a community post comment they do not own. */
export interface CommunityPostCommentForbiddenExceptionMetadata extends AbstractExceptionMetadata {
    /** Id of the comment the action targeted. */
    commentId: string
    /** Id of the user who attempted the action. */
    userId: string
}

/** Thrown when a user tries to edit/delete a community post comment that is not theirs. */
export class CommunityPostCommentForbiddenException extends AbstractException {
    constructor(
        {
            commentId,
            userId,
            originalError,
        }: CommunityPostCommentForbiddenExceptionMetadata,
    ) {
        super(
            "You are not allowed to modify this comment",
            "COMMUNITY_POST_COMMENT_FORBIDDEN_EXCEPTION",
            {
                commentId,
                userId,
                originalError,
            },
        )
    }
}
