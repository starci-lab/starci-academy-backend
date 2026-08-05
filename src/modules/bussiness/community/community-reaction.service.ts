import {
    Injectable,
} from "@nestjs/common"
import {
    EntityManager,
} from "typeorm"
import {
    CommunityPostCommentEntity,
    CommunityPostCommentReactionEntity,
    CommunityPostEntity,
    CommunityPostReactionEntity,
    InjectPrimaryPostgreSQLEntityManager,
    ReactionType,
} from "@modules/databases"
import {
    CommunityPostCommentNotFoundException,
    CommunityPostNotFoundException,
} from "@modules/exceptions"
import {
    EventEmitterService,
    EventName,
} from "@modules/event"
import type {
    ReactionCountResult,
    ReactionSummaryResult,
} from "../discussion"
import type {
    CommunityCommentReactionCountRow,
    CommunityCommentReactionRow,
    CommunityPostReactionCountRow,
    CommunityPostReactionRow,
    ReactToCommunityCommentParams,
    ReactToCommunityPostParams,
    SummarizeCommunityCommentsParams,
    SummarizeCommunityPostsParams,
} from "./types"

@Injectable()
/**
 * Domain service for Facebook-style reactions on community posts and their
 * comments. Each user holds at most one reaction per target (composite uniques on
 * the entities); picking the same/another emotion updates the row, passing `null`
 * removes it. Unlike feed activities, self-reactions are allowed (you may like
 * your own post). Every change fans out a local event for the Socket.IO gateway.
 */
export class CommunityReactionService {
    constructor(
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
        private readonly eventEmitterService: EventEmitterService,
    ) {}

    /**
     * Sets, changes, or removes the current user's reaction on a community post.
     * @param params - {@link ReactToCommunityPostParams}
     * @returns The post's fresh reaction summary from this user's view.
     */
    async reactToPost({
        postId,
        user,
        type,
    }: ReactToCommunityPostParams): Promise<ReactionSummaryResult> {
        // 404 guard -- never let a reaction reference a non-existent post
        const postExists = await this.entityManager.count(CommunityPostEntity,
            {
                where: {
                    id: postId,
                },
            })
        if (postExists === 0) {
            throw new CommunityPostNotFoundException({
                postId,
            })
        }
        // find the user's existing reaction on this post (at most one by unique)
        const existing = await this.entityManager.findOne(CommunityPostReactionEntity,
            {
                where: {
                    post: {
                        id: postId,
                    },
                    user: {
                        id: user.id,
                    },
                },
            })
        // null type means "remove my reaction" -- delete only if one exists
        if (type === null) {
            if (existing) {
                await this.entityManager.remove(existing)
            }
        } else if (existing) {
            // already reacted -> just switch the emotion in place
            existing.type = type
            await this.entityManager.save(existing)
        } else {
            // first-time reaction -> insert a new row via relation ids
            await this.entityManager.save(this.entityManager.create(CommunityPostReactionEntity,
                {
                    type,
                    post: {
                        id: postId,
                    },
                    user: {
                        id: user.id,
                    },
                }))
        }
        // tell the post room the reaction totals moved
        await this.eventEmitterService.emit({
            event: EventName.CommunityPostReactionChanged,
            payload: {
                postId,
            },
        })
        // recompute via the batch summarizer, then pick this post's bucket
        const summaries = await this.summarizePosts({
            postIds: [
                postId,
            ],
            userId: user.id,
        })
        return summaries[postId] ?? this.emptySummary()
    }

    /**
     * Sets, changes, or removes the current user's reaction on a post comment.
     * @param params - {@link ReactToCommunityCommentParams}
     * @returns The comment's fresh reaction summary from this user's view.
     */
    async reactToComment({
        commentId,
        user,
        type,
    }: ReactToCommunityCommentParams): Promise<ReactionSummaryResult> {
        // resolve the comment first -- we need its post id for the room event + 404 guard
        const comment = await this.entityManager.findOne(CommunityPostCommentEntity,
            {
                where: {
                    id: commentId,
                },
            })
        if (!comment) {
            throw new CommunityPostCommentNotFoundException({
                commentId,
            })
        }
        // find the user's existing reaction on this comment (at most one by unique)
        const existing = await this.entityManager.findOne(CommunityPostCommentReactionEntity,
            {
                where: {
                    comment: {
                        id: commentId,
                    },
                    user: {
                        id: user.id,
                    },
                },
            })
        // null type means "remove my reaction"
        if (type === null) {
            if (existing) {
                await this.entityManager.remove(existing)
            }
        } else if (existing) {
            // switch emotion in place
            existing.type = type
            await this.entityManager.save(existing)
        } else {
            // first-time reaction on this comment
            await this.entityManager.save(
                this.entityManager.create(CommunityPostCommentReactionEntity,
                    {
                        type,
                        comment: {
                            id: commentId,
                        },
                        user: {
                            id: user.id,
                        },
                    }))
        }
        // notify the post room (scoped to the comment's post) of the change
        await this.eventEmitterService.emit({
            event: EventName.CommunityCommentReactionChanged,
            payload: {
                postId: comment.postId,
                commentId,
            },
        })
        // recompute via the batch summarizer, then pick this comment's bucket
        const summaries = await this.summarizeComments({
            commentIds: [
                commentId,
            ],
            userId: user.id,
        })
        return summaries[commentId] ?? this.emptySummary()
    }

    /**
     * Batch-computes reaction summaries for many posts in two grouped queries.
     * @param params - {@link SummarizeCommunityPostsParams}
     * @returns Map of post id -> reaction summary (every requested id is present).
     */
    async summarizePosts({
        postIds,
        userId,
    }: SummarizeCommunityPostsParams): Promise<Record<string, ReactionSummaryResult>> {
        // nothing requested -> empty map (also guards an empty IN () clause)
        if (postIds.length === 0) {
            return {
            }
        }
        // grouped counts per (post, emotion) across all requested posts
        const countRows = await this.entityManager
            .createQueryBuilder(CommunityPostReactionEntity,
                "reaction")
            .select("reaction.post_id",
                "postId")
            .addSelect("reaction.type",
                "type")
            .addSelect("COUNT(*)",
                "count")
            .where("reaction.post_id IN (:...postIds)",
                {
                    postIds,
                })
            .groupBy("reaction.post_id")
            .addGroupBy("reaction.type")
            .getRawMany<CommunityPostReactionCountRow>()
        // the viewing user's own reaction per post (for highlighting) -- SKIPPED for an
        // anonymous viewer (empty userId): binding "" to the uuid `user_id` column makes
        // Postgres reject the whole query (invalid input syntax for type uuid).
        const mineRows = userId
            ? await this.entityManager
                .createQueryBuilder(CommunityPostReactionEntity,
                    "reaction")
                .select("reaction.post_id",
                    "postId")
                .addSelect("reaction.type",
                    "type")
                .where("reaction.post_id IN (:...postIds)",
                    {
                        postIds,
                    })
                .andWhere("reaction.user_id = :userId",
                    {
                        userId,
                    })
                .getRawMany<CommunityPostReactionRow>()
            : ([] as Array<CommunityPostReactionRow>)
        // index "my reaction" by post id for O(1) lookup while assembling
        const myByPost = mineRows.reduce<Record<string, ReactionType>>((acc, row) => {
            acc[row.postId] = row.type
            return acc
        },
        {
        })
        // bucket count rows by post id so each post gets its own counts array
        const countsByPost = countRows.reduce<Record<string, Array<ReactionCountResult>>>((acc, row) => {
            // lazily create the per-post bucket on first sighting
            const bucket = acc[row.postId] ?? []
            bucket.push({
                type: row.type,
                count: Number(row.count),
            })
            acc[row.postId] = bucket
            return acc
        },
        {
        })
        // build a summary for EVERY requested id so callers never get an undefined bucket
        return postIds.reduce<Record<string, ReactionSummaryResult>>((acc, postId) => {
            acc[postId] = this.buildSummary(
                countsByPost[postId] ?? [],
                myByPost[postId] ?? null,
            )
            return acc
        },
        {
        })
    }

    /**
     * Batch-computes reaction summaries for many post comments in two grouped queries.
     * @param params - {@link SummarizeCommunityCommentsParams}
     * @returns Map of comment id -> reaction summary (every requested id is present).
     */
    async summarizeComments({
        commentIds,
        userId,
    }: SummarizeCommunityCommentsParams): Promise<Record<string, ReactionSummaryResult>> {
        // nothing requested -> empty map (also guards an empty IN () clause)
        if (commentIds.length === 0) {
            return {
            }
        }
        // grouped counts per (comment, emotion) across all requested comments
        const countRows = await this.entityManager
            .createQueryBuilder(CommunityPostCommentReactionEntity,
                "reaction")
            .select("reaction.comment_id",
                "commentId")
            .addSelect("reaction.type",
                "type")
            .addSelect("COUNT(*)",
                "count")
            .where("reaction.comment_id IN (:...commentIds)",
                {
                    commentIds,
                })
            .groupBy("reaction.comment_id")
            .addGroupBy("reaction.type")
            .getRawMany<CommunityCommentReactionCountRow>()
        // the viewing user's own reaction per comment (for highlighting) -- SKIPPED for an
        // anonymous viewer (empty userId): binding "" to the uuid `user_id` column makes
        // Postgres reject the whole query (invalid input syntax for type uuid).
        const mineRows = userId
            ? await this.entityManager
                .createQueryBuilder(CommunityPostCommentReactionEntity,
                    "reaction")
                .select("reaction.comment_id",
                    "commentId")
                .addSelect("reaction.type",
                    "type")
                .where("reaction.comment_id IN (:...commentIds)",
                    {
                        commentIds,
                    })
                .andWhere("reaction.user_id = :userId",
                    {
                        userId,
                    })
                .getRawMany<CommunityCommentReactionRow>()
            : ([] as Array<CommunityCommentReactionRow>)
        // index "my reaction" by comment id for O(1) lookup while assembling
        const myByComment = mineRows.reduce<Record<string, ReactionType>>((acc, row) => {
            acc[row.commentId] = row.type
            return acc
        },
        {
        })
        // bucket count rows by comment id so each comment gets its own counts array
        const countsByComment = countRows.reduce<Record<string, Array<ReactionCountResult>>>((acc, row) => {
            // lazily create the per-comment bucket on first sighting
            const bucket = acc[row.commentId] ?? []
            bucket.push({
                type: row.type,
                count: Number(row.count),
            })
            acc[row.commentId] = bucket
            return acc
        },
        {
        })
        // build a summary for EVERY requested id so callers never get an undefined bucket
        return commentIds.reduce<Record<string, ReactionSummaryResult>>((acc, commentId) => {
            acc[commentId] = this.buildSummary(
                countsByComment[commentId] ?? [],
                myByComment[commentId] ?? null,
            )
            return acc
        },
        {
        })
    }

    /**
     * Folds raw per-emotion counts into a {@link ReactionSummaryResult}. Community
     * targets never carry view/share counts, so both are 0.
     * @param counts - Per-emotion count results.
     * @param myReaction - The viewing user's own emotion, or null.
     * @returns The assembled summary.
     */
    private buildSummary(
        counts: Array<ReactionCountResult>,
        myReaction: ReactionType | null,
    ): ReactionSummaryResult {
        // total is the sum across every emotion bucket
        const total = counts.reduce((acc, count) => acc + count.count,
            0)
        return {
            counts,
            total,
            myReaction,
            // community summaries never carry view/share counts
            viewCount: 0,
            shareCount: 0,
        }
    }

    /**
     * Builds an empty reaction summary (no reactions, no personal pick).
     * @returns A zeroed summary.
     */
    private emptySummary(): ReactionSummaryResult {
        return {
            counts: [],
            total: 0,
            myReaction: null,
            viewCount: 0,
            shareCount: 0,
        }
    }
}
