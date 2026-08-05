import {
    Injectable,
} from "@nestjs/common"
import {
    EntityManager,
    IsNull,
} from "typeorm"
import {
    CommunityPostCommentEntity,
    CommunityPostEntity,
    InjectPrimaryPostgreSQLEntityManager,
    NotificationType,
} from "@modules/databases"
import {
    CommunityPostCommentForbiddenException,
    CommunityPostCommentNotFoundException,
    CommunityPostNotFoundException,
} from "@modules/exceptions"
import {
    EventEmitterService,
    EventName,
} from "@modules/event"
import {
    NotificationService,
} from "../notification"
import type {
    CommunityPostCommentCountRow,
    CommunityReplyCountRow,
    CreateCommunityCommentParams,
    DeleteCommunityCommentParams,
    DeleteCommunityCommentResult,
    ListCommunityCommentsParams,
    ListCommunityCommentsResult,
    NotifyCommunityReplyTargetsParams,
    UpdateCommunityCommentParams,
} from "./types"

/** Default page size for community comment listings. */
const DEFAULT_LIMIT = 20

@Injectable()
/**
 * Domain service for threaded community post comments: create/edit/soft-delete +
 * paged listing. Ownership is enforced here. Every mutation fans out a local event
 * so the Socket.IO gateway pushes the change to the post room; creating a comment
 * also notifies the post author (and the parent comment author on a reply).
 */
export class CommunityCommentService {
    constructor(
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
        private readonly eventEmitterService: EventEmitterService,
        private readonly notificationService: NotificationService,
    ) {}

    /**
     * Loads a comment with its author, or throws if it does not exist.
     * @param commentId - Comment primary id.
     * @returns The comment entity with `user` relation loaded.
     */
    async getCommentOrThrow(commentId: string): Promise<CommunityPostCommentEntity> {
        // load the row with author so callers can build a node + check ownership
        const comment = await this.entityManager.findOne(CommunityPostCommentEntity,
            {
                where: {
                    id: commentId,
                },
                relations: {
                    user: true,
                },
            })
        // a missing row is a hard not-found for every caller
        if (!comment) {
            throw new CommunityPostCommentNotFoundException({
                commentId,
            })
        }
        return comment
    }

    /**
     * Creates a top-level comment or a reply on a community post.
     * @param params - {@link CreateCommunityCommentParams}
     * @returns The persisted comment (author relation loaded).
     */
    async createComment({
        postId,
        parentCommentId,
        body,
        user,
    }: CreateCommunityCommentParams): Promise<CommunityPostCommentEntity> {
        // resolve the post first (404 guard + we need its author for the notification)
        const post = await this.entityManager.findOne(CommunityPostEntity,
            {
                where: {
                    id: postId,
                },
                // authorId is a @RelationId (virtual, not selectable) -- load the
                // author relation and read author.id instead
                relations: {
                    author: true,
                },
                select: {
                    id: true,
                    author: {
                        id: true,
                    },
                },
            })
        if (!post) {
            throw new CommunityPostNotFoundException({
                postId,
            })
        }
        // when replying, make sure the parent exists so we never orphan a reply
        const parent = parentCommentId
            ? await this.getCommentOrThrow(parentCommentId)
            : null
        // build the row via relation ids only -- no need to load full post/user rows
        const draft = this.entityManager.create(CommunityPostCommentEntity,
            {
                body,
                isDeleted: false,
                editedAt: null,
                post: {
                    id: postId,
                },
                user: {
                    id: user.id,
                },
                // null parent marks a top-level comment
                parentComment: parentCommentId ? {
                    id: parentCommentId,
                } : null,
            })
        // persist then reload so RelationId virtual columns + author are populated
        const saved = await this.entityManager.save(draft)
        const comment = await this.getCommentOrThrow(saved.id)
        // notify the post room so other viewers see the new comment without reloading
        await this.eventEmitterService.emit({
            event: EventName.CommunityCommentCreated,
            payload: {
                postId,
                commentId: comment.id,
                parentCommentId: comment.parentCommentId,
            },
        })
        // fan out reply notifications (skip self-notifications)
        await this.notifyReplyTargets({
            postId,
            postAuthorId: post.author.id,
            parentAuthorId: parent?.userId ?? null,
            actor: user,
        })
        return comment
    }

    /**
     * Edits a comment's body. Only the author may edit.
     * @param params - {@link UpdateCommunityCommentParams}
     * @returns The updated comment (author relation loaded).
     */
    async updateComment({
        commentId,
        body,
        user,
    }: UpdateCommunityCommentParams): Promise<CommunityPostCommentEntity> {
        // load + ownership guard before mutating anything
        const comment = await this.getCommentOrThrow(commentId)
        // reject edits from anyone who is not the author
        if (comment.userId !== user.id) {
            throw new CommunityPostCommentForbiddenException({
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
            event: EventName.CommunityCommentUpdated,
            payload: {
                postId: comment.postId,
                commentId: comment.id,
                parentCommentId: comment.parentCommentId,
            },
        })
        return comment
    }

    /**
     * Soft-deletes a comment (keeps the row + replies). Only the author may delete.
     * @param params - {@link DeleteCommunityCommentParams}
     * @returns The deleted comment id.
     */
    async softDeleteComment({
        commentId,
        user,
    }: DeleteCommunityCommentParams): Promise<DeleteCommunityCommentResult> {
        // load + ownership guard
        const comment = await this.getCommentOrThrow(commentId)
        // reject deletes from anyone who is not the author
        if (comment.userId !== user.id) {
            throw new CommunityPostCommentForbiddenException({
                commentId,
                userId: user.id,
            })
        }
        // flag as deleted instead of removing so child replies + thread shape survive
        comment.isDeleted = true
        await this.entityManager.save(comment)
        // notify the room so clients swap the body for a "[deleted]" placeholder
        await this.eventEmitterService.emit({
            event: EventName.CommunityCommentDeleted,
            payload: {
                postId: comment.postId,
                commentId: comment.id,
                parentCommentId: comment.parentCommentId,
            },
        })
        return {
            id: comment.id,
        }
    }

    /**
     * Lists comments for a post. Scoped to top-level comments by default, or to one
     * parent's replies when `parentCommentId` is provided. Paged (1-based).
     * @param params - {@link ListCommunityCommentsParams}
     * @returns The page of comments + total count.
     */
    async listComments({
        postId,
        parentCommentId,
        page = 1,
        limit = DEFAULT_LIMIT,
    }: ListCommunityCommentsParams): Promise<ListCommunityCommentsResult> {
        // translate 1-based page into an offset; clamp to non-negative
        const skip = Math.max(0,
            page - 1) * limit
        // null parent -> top-level comments; a value -> that comment's replies
        const [
            comments,
            total,
        ] = await this.entityManager.findAndCount(CommunityPostCommentEntity,
            {
                where: {
                    post: {
                        id: postId,
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
     * @returns Map of comment id -> direct reply count (missing key = 0).
     */
    async countReplies(commentIds: Array<string>): Promise<Record<string, number>> {
        // nothing to count -> cheap exit, also avoids an empty IN () clause
        if (commentIds.length === 0) {
            return {
            }
        }
        // one grouped COUNT keyed by parent id rather than a query per comment
        const rows = await this.entityManager
            .createQueryBuilder(CommunityPostCommentEntity,
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
            .getRawMany<CommunityReplyCountRow>()
        // fold the raw rows into a lookup the resolver can index per comment
        return rows.reduce<Record<string, number>>((acc, row) => {
            acc[row.parentId] = Number(row.count)
            return acc
        },
        {
        })
    }

    /**
     * Counts comments for a set of posts in one grouped query (avoids N+1).
     * Soft-deleted comments still count so the feed's "N comments" stays stable.
     * @param postIds - Post ids to count comments for.
     * @returns Map of post id -> comment count (missing key = 0).
     */
    async countCommentsByPosts(postIds: Array<string>): Promise<Record<string, number>> {
        // nothing to count -> cheap exit, also avoids an empty IN () clause
        if (postIds.length === 0) {
            return {
            }
        }
        // one grouped COUNT keyed by post id rather than a query per post
        const rows = await this.entityManager
            .createQueryBuilder(CommunityPostCommentEntity,
                "comment")
            .select("comment.post_id",
                "postId")
            .addSelect("COUNT(*)",
                "count")
            .where("comment.post_id IN (:...postIds)",
                {
                    postIds,
                })
            .groupBy("comment.post_id")
            .getRawMany<CommunityPostCommentCountRow>()
        // fold the raw rows into a lookup the resolver can index per post
        return rows.reduce<Record<string, number>>((acc, row) => {
            acc[row.postId] = Number(row.count)
            return acc
        },
        {
        })
    }

    /**
     * Fans out "someone engaged with your post" notifications for a new comment.
     * Notifies the post author and, on a reply, the parent comment author -- never
     * the actor themselves, and never the same recipient twice.
     * @param params - Post id, the post + parent author ids, and the acting user.
     */
    private async notifyReplyTargets({
        postId,
        postAuthorId,
        parentAuthorId,
        actor,
    }: NotifyCommunityReplyTargetsParams): Promise<void> {
        // de-dupe recipients and drop the actor so nobody is pinged about their own act
        const recipientIds = new Set<string>()
        if (postAuthorId !== actor.id) {
            recipientIds.add(postAuthorId)
        }
        if (parentAuthorId && parentAuthorId !== actor.id) {
            recipientIds.add(parentAuthorId)
        }
        // emit one CommunityReply notification per distinct recipient (clickable to post)
        for (const recipientId of recipientIds) {
            await this.notificationService.createNotification({
                userId: recipientId,
                type: NotificationType.CommunityReply,
                title: {
                    key: "notification.communityReply.title",
                    params: {
                        actor: actor.username,
                    },
                },
                target: {
                    entityName: CommunityPostEntity.name,
                    id: postId,
                    label: "",
                },
            })
        }
    }
}
