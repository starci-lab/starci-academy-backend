import {
    Injectable,
} from "@nestjs/common"
import {
    EntityManager,
    IsNull,
} from "typeorm"
import {
    ContentCommentEntity,
    InjectPrimaryPostgreSQLEntityManager,
} from "@modules/databases"
import {
    CommentForbiddenException,
    CommentNotFoundException,
} from "@modules/exceptions"
import {
    EventEmitterService,
    EventName,
} from "@modules/event"
import type {
    CreateCommentParams,
    DeleteCommentParams,
    DeleteCommentResult,
    ListCommentsParams,
    ListCommentsResult,
    ReplyCountRow,
    UpdateCommentParams,
} from "./types"

/** Default page size for comment listings. */
const DEFAULT_LIMIT = 20

/**
 * Domain service for threaded content comments: create/edit/soft-delete + paged listing.
 * Ownership is enforced here (never trust the client). Every mutation fans out a local
 * event so the Socket.IO gateway can push the change to subscribers of the content room.
 */
@Injectable()
export class CommentService {
    constructor(
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
        private readonly eventEmitterService: EventEmitterService,
    ) {}

    /**
     * Loads a comment with its author, or throws if it does not exist.
     * @param commentId - Comment primary id.
     * @returns The comment entity with `user` relation loaded.
     */
    async getCommentOrThrow(commentId: string): Promise<ContentCommentEntity> {
        // load the row with author so callers can build a node + check ownership
        const comment = await this.entityManager.findOne(ContentCommentEntity,
            {
                where: {
                    id: commentId,
                },
                relations: {
                    user: true,
                },
            })
        // a missing row is a hard 404-style failure for every caller
        if (!comment) {
            throw new CommentNotFoundException({
                commentId,
            })
        }
        return comment
    }

    /**
     * Creates a top-level comment or a reply.
     * @param params - {@link CreateCommentParams}
     * @returns The persisted comment (author relation loaded).
     */
    async createComment({
        contentId,
        parentCommentId,
        body,
        user,
    }: CreateCommentParams): Promise<ContentCommentEntity> {
        // when replying, make sure the parent really exists so we never orphan a reply
        if (parentCommentId) {
            await this.getCommentOrThrow(parentCommentId)
        }
        // build the row via relation ids only — no need to load full content/user rows
        const draft = this.entityManager.create(ContentCommentEntity,
            {
                body,
                isDeleted: false,
                editedAt: null,
                content: {
                    id: contentId,
                },
                user: {
                    id: user.id,
                },
                // null parent marks a top-level comment
                parentComment: parentCommentId ? {
                    id: parentCommentId,
                } : null,
            })
        // persist then reload so RelationId virtual columns + author are populated for the node
        const saved = await this.entityManager.save(draft)
        const comment = await this.getCommentOrThrow(saved.id)
        // notify the content room so other viewers see the new comment without reloading
        await this.eventEmitterService.emit({
            event: EventName.CommentCreated,
            payload: {
                contentId,
                commentId: comment.id,
                parentCommentId: comment.parentCommentId,
            },
        })
        return comment
    }

    /**
     * Edits a comment's body. Only the author may edit.
     * @param params - {@link UpdateCommentParams}
     * @returns The updated comment (author relation loaded).
     */
    async updateComment({
        commentId,
        body,
        user,
    }: UpdateCommentParams): Promise<ContentCommentEntity> {
        // load + ownership guard before mutating anything
        const comment = await this.getCommentOrThrow(commentId)
        // reject edits from anyone who is not the author
        if (comment.userId !== user.id) {
            throw new CommentForbiddenException({
                commentId,
                userId: user.id,
            })
        }
        // apply the new body and stamp the edit time so the UI can show "(edited)"
        comment.body = body
        comment.editedAt = new Date()
        await this.entityManager.save(comment)
        // fan out so subscribers refetch the edited comment
        await this.eventEmitterService.emit({
            event: EventName.CommentUpdated,
            payload: {
                contentId: comment.contentId,
                commentId: comment.id,
                parentCommentId: comment.parentCommentId,
            },
        })
        return comment
    }

    /**
     * Soft-deletes a comment (keeps the row + replies). Only the author may delete.
     * @param params - {@link DeleteCommentParams}
     * @returns The deleted comment id.
     */
    async softDeleteComment({
        commentId,
        user,
    }: DeleteCommentParams): Promise<DeleteCommentResult> {
        // load + ownership guard
        const comment = await this.getCommentOrThrow(commentId)
        // reject deletes from anyone who is not the author
        if (comment.userId !== user.id) {
            throw new CommentForbiddenException({
                commentId,
                userId: user.id,
            })
        }
        // flag as deleted instead of removing so child replies + thread shape survive
        comment.isDeleted = true
        await this.entityManager.save(comment)
        // notify the room so clients swap the body for a "[deleted]" placeholder
        await this.eventEmitterService.emit({
            event: EventName.CommentDeleted,
            payload: {
                contentId: comment.contentId,
                commentId: comment.id,
                parentCommentId: comment.parentCommentId,
            },
        })
        return {
            id: comment.id,
        }
    }

    /**
     * Lists comments for a content. Scoped to top-level comments by default, or to one
     * parent's replies when `parentCommentId` is provided. Paged (1-based).
     * @param params - {@link ListCommentsParams}
     * @returns The page of comments + total count.
     */
    async listComments({
        contentId,
        parentCommentId,
        page = 1,
        limit = DEFAULT_LIMIT,
    }: ListCommentsParams): Promise<ListCommentsResult> {
        // translate 1-based page into an offset; clamp to non-negative
        const skip = Math.max(0,
            page - 1) * limit
        // null parent → top-level comments; a value → that comment's replies
        const [comments,
            total] = await this.entityManager.findAndCount(ContentCommentEntity,
            {
                where: {
                    content: {
                        id: contentId,
                    },
                    parentComment: parentCommentId ? {
                        id: parentCommentId,
                    } : IsNull(),
                },
                relations: {
                    user: true,
                },
                // chronological order keeps a thread readable top-to-bottom
                order: {
                    createdAt: "ASC",
                },
                skip,
                take: limit,
            })
        return {
            comments,
            total,
        }
    }

    /**
     * Counts direct replies for a set of comments in one grouped query (avoids N+1).
     * @param commentIds - Parent comment ids to count replies for.
     * @returns Map of comment id → direct reply count (missing key = 0).
     */
    async countReplies(commentIds: Array<string>): Promise<Record<string, number>> {
        // nothing to count → cheap exit, also avoids an empty IN () clause
        if (commentIds.length === 0) {
            return {
            }
        }
        // one grouped COUNT keyed by parent id rather than a query per comment
        const rows = await this.entityManager
            .createQueryBuilder(ContentCommentEntity,
                "comment")
            .select("comment.parent_comment_id",
                "parentId")
            .addSelect("COUNT(*)",
                "count")
            .where("comment.parent_comment_id IN (:...commentIds)",
                {
                    commentIds,
                })
            .groupBy("comment.parent_comment_id")
            .getRawMany<ReplyCountRow>()
        // fold the raw rows into a lookup the resolver can index per comment
        return rows.reduce<Record<string, number>>((acc, row) => {
            acc[row.parentId] = Number(row.count)
            return acc
        },
        {
        })
    }
}
