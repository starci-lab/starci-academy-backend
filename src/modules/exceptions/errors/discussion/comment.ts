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
