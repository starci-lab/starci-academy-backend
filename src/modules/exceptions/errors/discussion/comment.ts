import type {
    AbstractExceptionMetadata,
} from "../abstract"
import {
    AbstractException,
} from "../abstract"

/** Metadata when a comment row cannot be located. */
export interface CommentNotFoundExceptionMetadata extends AbstractExceptionMetadata {
    /** Id of the comment that was not found. */
    commentId: string
}

/** Thrown when a comment id does not resolve to a row. */
export class CommentNotFoundException extends AbstractException {
    constructor(
        {
            commentId,
            originalError,
        }: CommentNotFoundExceptionMetadata,
    ) {
        super(
            "Comment not found",
            "COMMENT_NOT_FOUND_EXCEPTION",
            {
                commentId,
                originalError,
            },
        )
    }
}

/** Metadata when a top-level comment's scope is invalid (not exactly one of content/course). */
export interface CommentInvalidScopeExceptionMetadata extends AbstractExceptionMetadata {
    /** Content id supplied by the caller, if any. */
    contentId?: string | null
    /** Course id supplied by the caller, if any. */
    courseId?: string | null
}

/** Thrown when a top-level comment is created without exactly one of contentId/courseId. */
export class CommentInvalidScopeException extends AbstractException {
    constructor(
        {
            contentId,
            courseId,
            originalError,
        }: CommentInvalidScopeExceptionMetadata,
    ) {
        super(
            "A top-level comment must be scoped to exactly one of a lesson content or a course",
            "COMMENT_INVALID_SCOPE_EXCEPTION",
            {
                contentId,
                courseId,
                originalError,
            },
        )
    }
}

/** Metadata when a user attempts to mutate a comment they do not own. */
export interface CommentForbiddenExceptionMetadata extends AbstractExceptionMetadata {
    /** Id of the comment the action targeted. */
    commentId: string
    /** Id of the user who attempted the action. */
    userId: string
}

/** Thrown when a user tries to edit/delete a comment that is not theirs. */
export class CommentForbiddenException extends AbstractException {
    constructor(
        {
            commentId,
            userId,
            originalError,
        }: CommentForbiddenExceptionMetadata,
    ) {
        super(
            "You are not allowed to modify this comment",
            "COMMENT_FORBIDDEN_EXCEPTION",
            {
                commentId,
                userId,
                originalError,
            },
        )
    }
}
